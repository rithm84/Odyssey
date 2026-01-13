"use client";

import { createClient } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";

export interface PackingItem {
  id: string;
  event_id: string;
  item_name: string;
  quantity: number;
  assigned_to?: string | null;
  is_packed: boolean;
  pending_approval: boolean;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export function usePackingItems(eventId: string) {
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [canAddTasks, setCanAddTasks] = useState(false);

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
        setCanAddTasks(membership.role === 'organizer' || membership.role === 'co_host');
      }
    };

    fetchUserRole();

    // Initial fetch
    const fetchPackingItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/event/${eventId}/packing`);

        if (!response.ok) {
          throw new Error("Failed to fetch packing items");
        }

        const data = await response.json();
        setPackingItems(data.packingItems || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching packing items:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackingItems();

    // Set up real-time subscription
    const channel = supabase
      .channel(`packing_items:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "packing_items",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setPackingItems((current) => {
            if (current.some((item) => item.id === payload.new.id)) {
              return current;
            }
            return [...current, payload.new as PackingItem];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "packing_items",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setPackingItems((current) =>
            current.map((item) =>
              item.id === payload.new.id ? (payload.new as PackingItem) : item
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "packing_items",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setPackingItems((current) => current.filter((item) => item.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const addItem = async (item: {
    item_name: string;
    quantity?: number;
    assigned_to?: string;
  }) => {
    try {
      const response = await fetch(`/api/event/${eventId}/packing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add packing item");
      }

      const data = await response.json();
      return data.packingItem;
    } catch (err) {
      console.error("Error adding packing item:", err);
      throw err;
    }
  };

  const updateItem = async (
    itemId: string,
    updates: {
      item_name?: string;
      quantity?: number;
      assigned_to?: string | null;
      is_packed?: boolean;
      pending_approval?: boolean;
    }
  ) => {
    // Optimistic update
    setPackingItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );

    try {
      const response = await fetch(`/api/event/${eventId}/packing/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Rollback optimistic update on error
        const refetchResponse = await fetch(`/api/event/${eventId}/packing`);
        if (refetchResponse.ok) {
          const refetchData = await refetchResponse.json();
          setPackingItems(refetchData.packingItems || []);
        }
        throw new Error(errorData.error || "Failed to update packing item");
      }

      const data = await response.json();
      return data.packingItem;
    } catch (err) {
      console.error("Error updating packing item:", err);
      throw err;
    }
  };

  const deleteItem = async (itemId: string) => {
    // Optimistic update
    setPackingItems((current) => current.filter((item) => item.id !== itemId));

    try {
      const response = await fetch(`/api/event/${eventId}/packing/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Rollback optimistic update on error
        const refetchResponse = await fetch(`/api/event/${eventId}/packing`);
        if (refetchResponse.ok) {
          const refetchData = await refetchResponse.json();
          setPackingItems(refetchData.packingItems || []);
        }
        throw new Error(errorData.error || "Failed to delete packing item");
      }

      return true;
    } catch (err) {
      console.error("Error deleting packing item:", err);
      throw err;
    }
  };

  return {
    packingItems,
    loading,
    error,
    userRole,
    canAddTasks,
    addItem,
    updateItem,
    deleteItem,
  };
}
