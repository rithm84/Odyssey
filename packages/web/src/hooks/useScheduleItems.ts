"use client";

import { createClient } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";

export interface ScheduleItem {
  id: string;
  event_id: string;
  title: string;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  order_index: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Helper to convert time string to minutes for sorting
const timeToMinutes = (timeStr: string | null): number => {
  if (!timeStr) return Infinity; // Items without time sort last

  const match = timeStr.match(/(\d+):(\d+)/);
  if (!match) return Infinity;

  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  return hours * 60 + minutes;
};

// Sort schedule items by start_time
const sortByTime = (items: ScheduleItem[]): ScheduleItem[] => {
  return [...items].sort((a, b) => {
    const aTime = timeToMinutes(a.start_time);
    const bTime = timeToMinutes(b.start_time);
    return aTime - bTime;
  });
};

export function useScheduleItems(eventId: string) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Fetch user's role for this event
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const discordUserId = user.user_metadata?.provider_id || user.user_metadata?.sub;
      if (!discordUserId) return;

      const { data: membership } = await supabase
        .from('event_members')
        .select('role')
        .eq('event_id', eventId)
        .eq('user_id', discordUserId)
        .single();

      if (membership) {
        setUserRole(membership.role);
        setCanEdit(membership.role === 'organizer' || membership.role === 'co_host');
      }
    };

    fetchUserRole();

    // Initial fetch
    const fetchScheduleItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/event/${eventId}/schedule`);

        if (!response.ok) {
          throw new Error("Failed to fetch schedule items");
        }

        const data = await response.json();
        setScheduleItems(sortByTime(data.scheduleItems || []));
        setError(null);
      } catch (err) {
        console.error("Error fetching schedule items:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleItems();

    // Set up real-time subscription
    const channel = supabase
      .channel(`schedule_items:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "schedule_items",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log("INSERT received:", payload);
          setScheduleItems((current) => {
            // Check if item already exists (avoid duplicates)
            if (current.some((item) => item.id === payload.new.id)) {
              return current;
            }
            return sortByTime([...current, payload.new as ScheduleItem]);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "schedule_items",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log("UPDATE received:", payload);
          setScheduleItems((current) =>
            sortByTime(
              current.map((item) =>
                item.id === payload.new.id ? (payload.new as ScheduleItem) : item
              )
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "schedule_items",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log("DELETE received:", payload);
          // For DELETE events, payload.old contains the deleted row
          const deletedId = (payload.old as any).id;
          console.log("Deleting item with id:", deletedId);
          setScheduleItems((current) => {
            const filtered = current.filter((item) => item.id !== deletedId);
            console.log("Items after filter:", filtered.length);
            return filtered;
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Helper functions for CRUD operations
  const addItem = async (item: {
    title: string;
    description?: string;
    start_time?: string;
    end_time?: string;
  }) => {
    try {
      const response = await fetch(`/api/event/${eventId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add schedule item");
      }

      const data = await response.json();
      // Optimistic update - add item immediately (realtime will also add it, but we dedupe)
      setScheduleItems((current) => {
        if (current.some((i) => i.id === data.scheduleItem.id)) {
          return current;
        }
        return sortByTime([...current, data.scheduleItem]);
      });
      return data.scheduleItem;
    } catch (err) {
      console.error("Error adding schedule item:", err);
      throw err;
    }
  };

  const updateItem = async (
    itemId: string,
    updates: {
      title?: string;
      description?: string;
      start_time?: string;
      end_time?: string;
      order_index?: number;
    }
  ) => {
    // Optimistic update - update item immediately
    setScheduleItems((current) =>
      sortByTime(
        current.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      )
    );

    try {
      const response = await fetch(`/api/event/${eventId}/schedule/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Rollback optimistic update on error - refetch items
        const refetchResponse = await fetch(`/api/event/${eventId}/schedule`);
        if (refetchResponse.ok) {
          const refetchData = await refetchResponse.json();
          setScheduleItems(sortByTime(refetchData.scheduleItems || []));
        }
        throw new Error(errorData.error || "Failed to update schedule item");
      }

      const data = await response.json();
      return data.scheduleItem;
    } catch (err) {
      console.error("Error updating schedule item:", err);
      throw err;
    }
  };

  const deleteItem = async (itemId: string) => {
    // Optimistic update - remove item immediately
    setScheduleItems((current) => current.filter((item) => item.id !== itemId));

    try {
      const response = await fetch(`/api/event/${eventId}/schedule/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Rollback optimistic update on error - refetch items
        const refetchResponse = await fetch(`/api/event/${eventId}/schedule`);
        if (refetchResponse.ok) {
          const refetchData = await refetchResponse.json();
          setScheduleItems(sortByTime(refetchData.scheduleItems || []));
        }
        throw new Error(errorData.error || "Failed to delete schedule item");
      }

      return true;
    } catch (err) {
      console.error("Error deleting schedule item:", err);
      throw err;
    }
  };

  const reorderItems = async (
    items: Array<{ id: string; order_index: number }>
  ) => {
    try {
      const response = await fetch(`/api/event/${eventId}/schedule/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reorder schedule items");
      }

      const data = await response.json();
      return data.scheduleItems;
    } catch (err) {
      console.error("Error reordering schedule items:", err);
      throw err;
    }
  };

  return {
    scheduleItems,
    loading,
    error,
    userRole,
    canEdit,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
  };
}
