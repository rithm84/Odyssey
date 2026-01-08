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
      .select('id, name, start_date, event_members!inner(role)')
      .eq('event_members.user_id', userId)
      .in('event_members.role', ['organizer', 'co_host'])
      .order('start_date', { ascending: true })
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
      name: `${event.name} (${event.start_date || 'No date'})`,
      value: event.id
    }));

    await interaction.respond(choices);
    return;
  }

  // Autocomplete for RSVP - show all events user is a member of
  if (interaction.commandName === 'rsvp') {
    const { data: events, error } = await supabase
      .from('events')
      .select('id, name, start_date, event_members!inner(user_id)')
      .eq('event_members.user_id', userId)
      .order('start_date', { ascending: true })
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
      name: `${event.name} (${event.start_date || 'No date'})`,
      value: event.id
    }));

    await interaction.respond(choices);
    return;
  }

  // Autocomplete for find-best-times - show only availability grid polls
  if (interaction.commandName === 'find-best-times') {
    const { data: polls, error } = await supabase
      .from('polls')
      .select('id, title, created_at')
      .eq('vote_type', 'availability_grid')
      .eq('poll_type', 'web')
      .eq('guild_id', interaction.guildId || '')
      .order('created_at', { ascending: false })
      .limit(25);

    if (error || !polls) {
      await interaction.respond([]);
      return;
    }

    // Filter by what user is typing
    const filtered = polls.filter(poll =>
      poll.title.toLowerCase().includes(focusedValue.toLowerCase())
    );

    // Format choices for Discord
    const choices = filtered.map(poll => {
      const date = new Date(poll.created_at);
      const dateStr = date.toLocaleDateString();
      return {
        name: `${poll.title} (${dateStr})`,
        value: poll.id
      };
    });

    await interaction.respond(choices);
    return;
  }
}
