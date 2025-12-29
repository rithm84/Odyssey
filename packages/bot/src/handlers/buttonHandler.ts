import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { supabase } from '@/lib/supabase';
import type { ParsedEventData } from '@/types/agent';
import { getRecommendedModules } from '@/utils/smartDefaults';
import { createModuleSelectionEmbed } from '@/utils/moduleSelectionEmbed';
import { generateUniqueSessionId } from '@/utils/generateSessionId';

// Declare global types for pending events, edit sessions, and module selection
declare global {
  var pendingEvents: Map<string, { eventData: ParsedEventData; guildId: string | null }>;
  var editSessions: Map<string, { eventData: ParsedEventData; guildId: string | null; confirmationId: string }>;
  var pendingModuleSelection: Map<string, {
    eventData: ParsedEventData | null; // Can be null for edits
    guildId: string | null;
    channelId: string;
    selectedModules: import('@odyssey/shared/types/database').EnabledModules;
    eventId?: string; // Optional - only present when editing
    // Metadata for debugging (not used in logic, just for logging)
    userId: string;
    timestamp: number;
  }>;
}

export async function handleEventConfirmationButton(interaction: ButtonInteraction) {
  const customIdParts = interaction.customId.split('_');

  // Expected format: event_confirm_yes_userId_timestamp or event_confirm_edit_userId_timestamp
  if (customIdParts[0] !== 'event' || customIdParts[1] !== 'confirm') return;

  const action = customIdParts[2]; // 'yes', 'edit', or 'cancel'
  const confirmationId = `${customIdParts[3]}_${customIdParts[4]}`; // Reconstruct userId_timestamp

  // Retrieve pending event data
  global.pendingEvents = global.pendingEvents || new Map();
  const pendingEvent = global.pendingEvents.get(confirmationId);

  if (!pendingEvent) {
    await interaction.reply({
      content: 'This confirmation has expired. Please create the event again.',
      ephemeral: true
    });
    return;
  }

  const { eventData, guildId } = pendingEvent;

  try {
    if (action === 'yes') {
      // Instead of saving directly, show module selection
      await interaction.deferReply();


      // Get smart defaults based on event type
      const selectedModules = getRecommendedModules(eventData.eventType);

      // Create module selection session
      global.pendingModuleSelection = global.pendingModuleSelection || new Map();
      const sessionId = generateUniqueSessionId(global.pendingModuleSelection);
      global.pendingModuleSelection.set(sessionId, {
        eventData,
        guildId,
        channelId: interaction.channelId ?? '',
        selectedModules,
        // Metadata for debugging
        userId: interaction.user.id,
        timestamp: Date.now()
      });

      // Show module selection embed
      const { embed, components } = createModuleSelectionEmbed(
        eventData.name,
        selectedModules,
        sessionId
      );

      await interaction.editReply({ embeds: [embed], components });

      // Clean up pending event confirmation (moved to module selection)
      global.pendingEvents.delete(confirmationId);

    } else if (action === 'edit') {
      // Check if user is already editing a different event
      global.editSessions = global.editSessions || new Map();
      const existingSession = global.editSessions.get(interaction.user.id);

      if (existingSession && existingSession.confirmationId !== confirmationId) {
        // User is editing a DIFFERENT event - warn and replace
        await interaction.reply({
          content: `You were editing another event. Switching to edit **${eventData.name}** instead. Hit 'Edit' on the old event to revert back. ⚠️`,
          ephemeral: true
        });
      } else {
        // Normal edit flow
        await interaction.reply({
          content: 'What would you like to change? Just type your edits in the channel (e.g., "change time to 7 PM"). No need to mention me!',
          ephemeral: true
        });
      }

      // Store/update edit session for this user
      global.editSessions.set(interaction.user.id, {
        eventData,
        guildId,
        confirmationId
      });

    } else if (action === 'cancel') {
      await interaction.update({
        content: 'Event creation cancelled. ❌',
        embeds: [],
        components: []
      });
      global.pendingEvents.delete(confirmationId);
    }

  } catch (error) {
    console.error('Error handling confirmation button:', error);

    if (interaction.deferred) {
      await interaction.editReply({
        content: 'Failed to create event. Please try again.'
      });
    } else {
      await interaction.reply({
        content: 'Failed to create event. Please try again.',
        ephemeral: true
      });
    }
  }
}
