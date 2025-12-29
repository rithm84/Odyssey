import { AutocompleteInteraction } from 'discord.js';
import { supabase } from '@/lib/supabase';

export async function handleAutocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused();
  const userId = interaction.user.id;

  // Autocomplete for commands that need organizer/co-host events
  if (interaction.commandName === 'edit-event-modules' ||
      interaction.commandName === 'manage-members') {
    // Query user's events from database (where they're organizer or co-host)
    const { data: events, error } = await supabase
      .from('events')
      .select('id, name, date, event_members!inner(role)')
      .eq('event_members.user_id', userId)
      .in('event_members.role', ['organizer', 'co_host'])
      .order('date', { ascending: true })
      .limit(25);

    if (error || !events) {
      await interaction.respond([]);
      return;
    }

    // Filter by what user is typing
    const filtered = events.filter(event =>
      event.name.toLowerCase().includes(focusedValue.toLowerCase())
    );

    // Format choices for Discord
    const choices = filtered.map(event => ({
      name: `${event.name} (${event.date || 'No date'})`,
      value: event.id
    }));

    await interaction.respond(choices);
    return;
  }

  // Autocomplete for RSVP - show all events user is a member of
  if (interaction.commandName === 'rsvp') {
    const { data: events, error } = await supabase
      .from('events')
      .select('id, name, date, event_members!inner(user_id)')
      .eq('event_members.user_id', userId)
      .order('date', { ascending: true })
      .limit(25);

    if (error || !events) {
      await interaction.respond([]);
      return;
    }

    // Filter by what user is typing
    const filtered = events.filter(event =>
      event.name.toLowerCase().includes(focusedValue.toLowerCase())
    );

    // Format choices for Discord
    const choices = filtered.map(event => ({
      name: `${event.name} (${event.date || 'No date'})`,
      value: event.id
    }));

    await interaction.respond(choices);
    return;
  }
}
