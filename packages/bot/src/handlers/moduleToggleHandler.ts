import { ButtonInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { createModuleSelectionEmbed } from '@/utils/moduleSelectionEmbed';
import { supabase } from '@/lib/supabase';
import type { ParsedEventData } from '@/types/agent';
import type { EnabledModules } from '@odyssey/shared/types/database';

// Declare global type for pending module selections
declare global {
  var pendingModuleSelection: Map<string, {
    eventData: ParsedEventData;
    guildId: string | null;
    channelId: string;
    selectedModules: EnabledModules;
  }>;
}

export async function handleModuleToggle(interaction: ButtonInteraction) {
  const parts = interaction.customId.split('_');

  // Expected format: module_toggle_<module_name>_<userId>_<timestamp> or module_confirm_<userId>_<timestamp>
  if (parts[0] !== 'module') return;

  const action = parts[1]; // 'toggle', 'confirm', or 'cancel'

  // SessionId is userId_timestamp (last TWO parts)
  const userId = parts[parts.length - 2];
  const timestamp = parts[parts.length - 1];
  const sessionId = `${userId}_${timestamp}`;

  // Safety check: ensure sessionId components exist
  if (!userId || !timestamp) {
    await interaction.reply({
      content: 'Invalid session. Please create the event again.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  // Get pending module selection
  global.pendingModuleSelection = global.pendingModuleSelection || new Map();
  const pendingSelection = global.pendingModuleSelection.get(sessionId);

  if (!pendingSelection) {
    await interaction.reply({
      content: 'This module selection has expired. Please create the event again.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    if (action === 'toggle') {
      // Toggle a specific module
      // Module name is everything between action (parts[1]) and last 2 parts (userId_timestamp)
      // Example: module_toggle_group_dashboard_123456789_1703123456789
      // parts[2] to parts[length-3] = "group", "dashboard" → join with "_"
      const moduleNameParts = parts.slice(2, parts.length - 2);
      const moduleName = moduleNameParts.join('_'); // e.g., 'group_dashboard'

      // Safety check: ensure moduleName exists and is valid
      if (!moduleName) {
        await interaction.reply({
          content: 'Invalid module selection.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Toggle the module (but not schedule/attendees as they're required)
      if (moduleName in pendingSelection.selectedModules && moduleName !== 'schedule' && moduleName !== 'attendees') {
        pendingSelection.selectedModules[moduleName as keyof EnabledModules] =
          !pendingSelection.selectedModules[moduleName as keyof EnabledModules];

        // Update the embed with new state
        const { embed, components } = createModuleSelectionEmbed(
          pendingSelection.eventData.name,
          pendingSelection.selectedModules,
          sessionId
        );

        await interaction.update({ embeds: [embed], components });
      }

    } else if (action === 'confirm') {
      // Save event to database with selected modules
      await interaction.deferUpdate();

      const { eventData, guildId, selectedModules } = pendingSelection;

      // Format date as YYYY-MM-DD in local timezone
      const formatLocalDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Convert string dates back to Date objects if needed
      const date = eventData.date ? new Date(eventData.date) : null;
      const startTime = eventData.startTime ? new Date(eventData.startTime) : null;

      const { data, error } = await supabase
        .from('events')
        .insert({
          guild_id: guildId ?? '',
          channel_id: interaction.channelId ?? '',
          name: eventData.name,
          date: date ? formatLocalDate(date) : null,
          time: startTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          location: eventData.location,
          event_type: eventData.eventType,
          creation_method: 'nlp',
          enabled_modules: selectedModules,
          synced_with_discord: false,
          created_by: interaction.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create success embed with enabled modules list
      const enabledFeatures = Object.entries(selectedModules)
        .filter(([_, enabled]) => enabled)
        .map(([name, _]) => {
          const formatted = name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          return `• ${formatted}`;
        })
        .join('\n');

      const successEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('✅ Event Created!')
        .setDescription(`**${eventData.name}** has been created with your selected features.`)
        .addFields(
          { name: 'Event ID', value: data.id.toString() },
          { name: 'Enabled Features', value: enabledFeatures }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed], components: [] });

      // Clean up pending selection
      global.pendingModuleSelection.delete(sessionId);

    } else if (action === 'cancel') {
      await interaction.update({
        content: 'Event creation cancelled. ❌',
        embeds: [],
        components: []
      });
      global.pendingModuleSelection.delete(sessionId);
    }

  } catch (error) {
    console.error('Error handling module toggle:', error);

    const errorMessage = 'Failed to save event. Please try again.';

    if (interaction.deferred) {
      await interaction.editReply({ content: errorMessage });
    } else {
      await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
    }
  }
}
