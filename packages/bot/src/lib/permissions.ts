import { supabase } from '@/lib/supabase';
import type { ChatInputCommandInteraction } from 'discord.js';

/**
 * Event role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY = {
  viewer: 1,
  member: 2,
  co_host: 3,
  organizer: 4
} as const;

export type EventRole = keyof typeof ROLE_HIERARCHY;

/**
 * Get a user's role for a specific event
 * @returns Role string or null if user is not a member
 */
export async function getUserRole(
  userId: string,
  eventId: string
): Promise<EventRole | null> {
  const { data, error } = await supabase
    .from('event_members')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role as EventRole;
}

/**
 * Check if a user has at least the required permission level for an event
 * @param userId Discord user ID
 * @param eventId Event UUID
 * @param minRole Minimum required role
 * @returns true if user has permission, false otherwise
 */
export async function hasPermission(
  userId: string,
  eventId: string,
  minRole: EventRole
): Promise<boolean> {
  const userRole = await getUserRole(userId, eventId);

  if (!userRole) {
    return false;
  }

  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Check if user is an organizer for the event
 */
export async function isOrganizer(
  userId: string,
  eventId: string
): Promise<boolean> {
  return hasPermission(userId, eventId, 'organizer');
}

/**
 * Check if user is a co-host or organizer for the event
 */
export async function isCoHostOrAbove(
  userId: string,
  eventId: string
): Promise<boolean> {
  return hasPermission(userId, eventId, 'co_host');
}

/**
 * Middleware-style permission check for slash commands
 * Returns true if user has permission, sends error message and returns false otherwise
 */
export async function checkEventPermission(
  interaction: ChatInputCommandInteraction,
  eventId: string,
  minRole: EventRole
): Promise<boolean> {
  const hasAccess = await hasPermission(
    interaction.user.id,
    eventId,
    minRole
  );

  if (!hasAccess) {
    const roleNames = {
      organizer: 'organizer',
      co_host: 'co-host or organizer',
      member: 'member',
      viewer: 'viewer'
    };

    await interaction.editReply({
      content: `You don't have permission to do this. This action requires ${roleNames[minRole]} role.`
    });
  }

  return hasAccess;
}
