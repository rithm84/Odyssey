"use client";

import { createClient } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";

export interface EventMember {
  user_id: string;
  role: string;
  rsvp_status: string | null;
  username?: string;
  avatar_url?: string;
}

export function useEventMembers(eventId: string) {
  const [members, setMembers] = useState<EventMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/event/${eventId}/members`);

        if (!response.ok) {
          throw new Error("Failed to fetch event members");
        }

        const data = await response.json();
        setMembers(data.members || []);
      } catch (err) {
        console.error("Error fetching event members:", err);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [eventId]);

  return { members, loading };
}
