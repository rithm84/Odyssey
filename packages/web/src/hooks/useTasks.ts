"use client";

import { createClient } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";

export interface Task {
  id: string;
  event_id: string;
  task_description: string;
  assigned_to?: string | null;
  is_complete: boolean;
  due_date?: string | null;
  priority: "low" | "medium" | "high";
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export function useTasks(eventId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
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
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/event/${eventId}/tasks`);

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data = await response.json();
        setTasks(data.tasks || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // Set up real-time subscription
    const channel = supabase
      .channel(`tasks:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setTasks((current) => {
            if (current.some((task) => task.id === payload.new.id)) {
              return current;
            }
            return [...current, payload.new as Task];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setTasks((current) =>
            current.map((task) =>
              task.id === payload.new.id ? (payload.new as Task) : task
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tasks",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setTasks((current) => current.filter((task) => task.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const addTask = async (task: {
    task_description: string;
    assigned_to?: string;
    due_date?: string;
    priority?: "low" | "medium" | "high";
  }) => {
    try {
      const response = await fetch(`/api/event/${eventId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add task");
      }

      const data = await response.json();
      return data.task;
    } catch (err) {
      console.error("Error adding task:", err);
      throw err;
    }
  };

  const updateTask = async (
    taskId: string,
    updates: {
      task_description?: string;
      assigned_to?: string | null;
      is_complete?: boolean;
      due_date?: string | null;
      priority?: "low" | "medium" | "high";
    }
  ) => {
    // Optimistic update
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );

    try {
      const response = await fetch(`/api/event/${eventId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Rollback optimistic update on error
        const refetchResponse = await fetch(`/api/event/${eventId}/tasks`);
        if (refetchResponse.ok) {
          const refetchData = await refetchResponse.json();
          setTasks(refetchData.tasks || []);
        }
        throw new Error(errorData.error || "Failed to update task");
      }

      const data = await response.json();
      return data.task;
    } catch (err) {
      console.error("Error updating task:", err);
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    // Optimistic update
    setTasks((current) => current.filter((task) => task.id !== taskId));

    try {
      const response = await fetch(`/api/event/${eventId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Rollback optimistic update on error
        const refetchResponse = await fetch(`/api/event/${eventId}/tasks`);
        if (refetchResponse.ok) {
          const refetchData = await refetchResponse.json();
          setTasks(refetchData.tasks || []);
        }
        throw new Error(errorData.error || "Failed to delete task");
      }

      return true;
    } catch (err) {
      console.error("Error deleting task:", err);
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    userRole,
    canAddTasks,
    addTask,
    updateTask,
    deleteTask,
  };
}
