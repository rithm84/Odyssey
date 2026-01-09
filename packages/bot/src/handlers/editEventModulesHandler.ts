import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { supabase } from '@/lib/supabase';
import { createModuleSelectionEmbed } from '@/utils/moduleSelectionEmbed';
import { generateUniqueSessionId } from '@/utils/generateSessionId';
import type { EnabledModules } from '@odyssey/shared/types/database';

export async function handleEditEventModules(interaction: ChatInputCommandInteraction) {
  const eventId = interaction.options.getString('event', true);
  const userId = interaction.user.id;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // Fetch event from database
  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, guild_id, guild_name, enabled_modules, event_members!inner(role)')
    .eq('id', eventId)
    .eq('event_members.user_id', userId)
    .in('event_members.role', ['organizer', 'co_host'])
    .single();

  if (error || !event) {
    await interaction.editReply({
      content: "Event not found or you don't have permission to edit it."
    });
    return;
  }

  // Create module selection session with current modules pre-selected
  global.pendingModuleSelection = global.pendingModuleSelection || new Map();
  const sessionId = generateUniqueSessionId(global.pendingModuleSelection);

  global.pendingModuleSelection.set(sessionId, {
    eventData: null, // Not creating new event, editing existing
    guildId: event.guild_id,
    guildName: event.guild_name,
    channelId: interaction.channelId ?? '',
    selectedModules: event.enabled_modules as EnabledModules,
    eventId, // Store eventId for UPDATE instead of INSERT
    // Metadata for debugging
    userId,
    timestamp: Date.now()
  });

  // Show module selection embed
  const { embed, components } = createModuleSelectionEmbed(
    event.name,
    event.enabled_modules as EnabledModules,
    sessionId
  );

  await interaction.editReply({ embeds: [embed], components });
}
