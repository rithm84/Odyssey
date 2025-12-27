import { AutocompleteInteraction } from 'discord.js';
import { supabase } from '@/lib/supabase';

export async function handleAutocomplete(interaction: AutocompleteInteraction) {
  if (interaction.commandName === 'edit-event-modules') {
    const focusedValue = interaction.options.getFocused(); // What user is typing
    const userId = interaction.user.id;

    // Query user's events from database (where they're organizer or co-host)
    const { data: events, error } = await supabase
      .from('events')
      .select('id, name, date, event_members!inner(role)')
      .eq('event_members.user_id', userId)
      .in('event_members.role', ['organizer', 'co_host'])
      .order('date', { ascending: true })
      .limit(25); // Discord max autocomplete choices

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
      name: `${event.name} (${event.date || 'No date'})`, // Display label
      value: event.id // Actual value sent to command
    }));

    await interaction.respond(choices);
  }
}
