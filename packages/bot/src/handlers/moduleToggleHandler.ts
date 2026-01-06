import { ButtonInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { createModuleSelectionEmbed } from '@/utils/moduleSelectionEmbed';
import { supabase } from '@/lib/supabase';
import type { ParsedEventData } from '@/types/agent';
import type { EnabledModules } from '@odyssey/shared/types/database';

// Declare global type for pending module selections
declare global {
  var pendingModuleSelection: Map<string, {
    eventData: ParsedEventData | null; // Can be null for edits
    guildId: string | null;
    channelId: string;
    selectedModules: EnabledModules;
    eventId?: string; // Optional - only present when editing
    // Metadata for debugging (not used in logic, just for logging)
    userId: string;
    timestamp: number;
  }>;
}

export async function handleModuleToggle(interaction: ButtonInteraction) {
  const parts = interaction.customId.split('_');

  // Expected format: module_toggle_<module_name>_<sessionId> or module_confirm_<sessionId>
  if (parts[0] !== 'module') return;

  const action = parts[1]; // 'toggle', 'confirm', or 'cancel'

  // SessionId is the last part (short alphanumeric ID)
  const sessionId = parts[parts.length - 1];

  // Safety check: ensure sessionId exists
  if (!sessionId) {
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
      // Module name is everything between action (parts[1]) and sessionId (last part)
      // Example: module_toggle_group_dashboard_abc12345
      // parts[2] to parts[length-2] = "group", "dashboard" → join with "_"
      const moduleNameParts = parts.slice(2, parts.length - 1);
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

        // Get event name (from eventData for new events, or extract from sessionId for edits)
        let eventName = 'Your Event';
        if (pendingSelection.eventData) {
          eventName = pendingSelection.eventData.name;
        } else if (pendingSelection.eventId) {
          // For edits, fetch the event name from the database
          const { data: eventInfo } = await supabase
            .from('events')
            .select('name')
            .eq('id', pendingSelection.eventId)
            .single();
          eventName = eventInfo?.name ?? 'Your Event';
        }

        // Update the embed with new state
        const { embed, components } = createModuleSelectionEmbed(
          eventName,
          pendingSelection.selectedModules,
          sessionId
        );

        await interaction.update({ embeds: [embed], components });
      }

    } else if (action === 'confirm') {
      // Save event to database with selected modules
      await interaction.deferUpdate();

      const { eventData, guildId, selectedModules, eventId } = pendingSelection;

      if (eventId) {
        // EDITING existing event
        const { error } = await supabase
          .from('events')
          .update({ enabled_modules: selectedModules })
          .eq('id', eventId);

        if (error) throw error;

        // Get event name for success message
        const { data: eventInfo } = await supabase
          .from('events')
          .select('name')
          .eq('id', eventId)
          .single();

        // Map module names to emojis
        const moduleEmojis: Record<keyof EnabledModules, string> = {
          schedule: '📅',
          attendees: '👥',
          group_dashboard: '📋',
          individual_packing: '🎒',
          transportation: '🚗',
          budget: '💰',
          weather: '🌤️'
        };

        // Create success embed with enabled modules list (with emojis)
        const enabledFeatures = Object.entries(selectedModules)
          .filter(([_, enabled]) => enabled)
          .map(([name, _]) => {
            const emoji = moduleEmojis[name as keyof EnabledModules] || '•';
            const formatted = name
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            return `• ${emoji}  ${formatted}`;
          })
          .join('\n');

        const successEmbed = new EmbedBuilder()
          .setColor('#57F287')
          .setTitle('✅ Modules Updated!')
          .setDescription(`**${eventInfo?.name}** modules have been updated successfully.`)
          .addFields(
            { name: 'Enabled Features', value: enabledFeatures }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed], components: [] });
      } else {
        // CREATING new event
        // Safety check: ensure eventData exists for new event creation
        if (!eventData) {
          throw new Error('Event data is required for creating new events');
        }

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

        // Map module names to emojis
        const moduleEmojis: Record<keyof EnabledModules, string> = {
          schedule: '📅',
          attendees: '👥',
          group_dashboard: '📋',
          individual_packing: '🎒',
          transportation: '🚗',
          budget: '💰',
          weather: '🌤️'
        };

        // Create success embed with enabled modules list (with emojis)
        const enabledFeatures = Object.entries(selectedModules)
          .filter(([_, enabled]) => enabled)
          .map(([name, _]) => {
            const emoji = moduleEmojis[name as keyof EnabledModules] || '•';
            const formatted = name
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            return `• ${emoji}  ${formatted}`;
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
      }

      // Clean up pending selection
      global.pendingModuleSelection.delete(sessionId);

    } else if (action === 'cancel') {
      const cancelMessage = pendingSelection.eventId
        ? 'Edits discarded. ❌'
        : 'Event creation cancelled. ❌';

      await interaction.update({
        content: cancelMessage,
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
