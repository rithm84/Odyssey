import { AutocompleteInteraction } from 'discord.js';
import { supabase } from '@/lib/supabase';

export async function handleAutocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused();
  const userId = interaction.user.id;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Autocomplete for commands that need organizer/co-host events
  if (interaction.commandName === 'edit-event-modules' ||
      interaction.commandName === 'manage-members') {
    // Query user's events from database (where they're organizer or co-host)
    const { data: events, error } = await supabase
      .from('events')
      .select('id, name, start_date, end_date, event_members!inner(role)')
      .eq('event_members.user_id', userId)
      .in('event_members.role', ['organizer', 'co_host'])
      .or(`end_date.gte.${today},and(end_date.is.null,start_date.gte.${today})`)
      .order('start_date', { ascending: true })
      .limit(50);

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

  // Autocomplete for RSVP - show all events in the guild
  if (interaction.commandName === 'rsvp') {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('id, name, start_date, end_date')
        .eq('guild_id', interaction.guildId || '')
        .or(`end_date.gte.${today},and(end_date.is.null,start_date.gte.${today})`)
        .order('start_date', { ascending: true })
        .limit(50);

      if (error) {
        await interaction.respond([]);
        return;
      }

      if (!events || events.length === 0) {
        await interaction.respond([]);
        return;
      }

      // Filter by what user is typing
      const filtered = events.filter(event =>
        event.name.toLowerCase().includes(focusedValue.toLowerCase())
      );

      // Format choices for Discord
      const choices = filtered.slice(0, 25).map(event => ({
        name: `${event.name} (${event.start_date || 'No date'})`,
        value: event.id
      }));

      await interaction.respond(choices);
    } catch (error) {
      await interaction.respond([]);
    }
    return;
  }

  // Autocomplete for leave-event - show all events where user is a member (including organizers)
  // The handler will check and block organizers from actually leaving
  if (interaction.commandName === 'leave-event') {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('id, name, start_date, end_date, event_members!inner(user_id, role)')
        .eq('event_members.user_id', userId)
        .or(`end_date.gte.${today},and(end_date.is.null,start_date.gte.${today})`)
        .order('start_date', { ascending: true })
        .limit(50);

      if (error) {
        await interaction.respond([]);
        return;
      }

      if (!events || events.length === 0) {
        await interaction.respond([]);
        return;
      }

      // Filter by what user is typing
      const filtered = events.filter(event =>
        event.name.toLowerCase().includes(focusedValue.toLowerCase())
      );

      // Format choices for Discord
      const choices = filtered.slice(0, 25).map(event => ({
        name: `${event.name} (${event.start_date || 'No date'})`,
        value: event.id
      }));

      await interaction.respond(choices);
    } catch (error) {
      await interaction.respond([]);
    }
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
