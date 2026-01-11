import { ButtonInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { supabase } from '@/lib/supabase';
import type { ParsedEventData } from '@/types/agent';
import { getRecommendedModules } from '@/utils/smartDefaults';
import { createModuleSelectionEmbed } from '@/utils/moduleSelectionEmbed';
import { generateUniqueSessionId } from '@/utils/generateSessionId';
import { createConfirmationEmbed } from '@/utils/createEventConfirmationEmbed';
import { createAccessSelectionEmbed } from '@/utils/createAccessSelectionEmbed';

// Declare global types for pending events, edit sessions, and module selection
declare global {
  var pendingEvents: Map<string, {
    eventData: ParsedEventData;
    guildId: string | null;
    guildName: string | null;
    visibility: 'public' | 'private';
    accessList: Array<{ type: 'role' | 'user'; id: string; name: string }>;
  }>;
  var editSessions: Map<string, { eventData: ParsedEventData; guildId: string | null; guildName: string | null; confirmationId: string }>;
  var pendingModuleSelection: Map<string, {
    eventData: ParsedEventData | null; // Can be null for edits
    guildId: string | null;
    guildName: string | null;
    channelId: string;
    selectedModules: import('@odyssey/shared/types/database').EnabledModules;
    visibility?: 'public' | 'private'; // Event visibility
    accessList?: Array<{ type: 'role' | 'user'; id: string; name: string }>; // Access list for private events
    eventId?: string; // Optional - only present when editing
    // Metadata for debugging (not used in logic, just for logging)
    userId: string;
    timestamp: number;
  }>;
}

export async function handleEventConfirmationButton(interaction: ButtonInteraction) {
  const customIdParts = interaction.customId.split('_');

  // Expected format: event_confirm_yes_<sessionId> or event_confirm_edit_<sessionId>
  if (customIdParts[0] !== 'event' || customIdParts[1] !== 'confirm') return;

  const action = customIdParts[2]; // 'yes', 'edit', 'cancel', or 'toggle' (for toggle_visibility)

  // Handle compound actions like 'toggle_visibility'
  let confirmationId: string | undefined;
  if (action === 'toggle' && customIdParts[3] === 'visibility') {
    confirmationId = customIdParts[4]; // For event_confirm_toggle_visibility_<sessionId>
  } else {
    confirmationId = customIdParts[3]; // Session ID (8-char hash)
  }

  if (!confirmationId) {
    await interaction.reply({
      content: 'Invalid confirmation ID. Please create the event again.',
      ephemeral: true
    });
    return;
  }

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

  const { eventData, guildId, guildName, visibility, accessList } = pendingEvent;

  try {
    if (action === 'toggle' && customIdParts[3] === 'visibility') {
      // If currently public, show access selection embed for private event
      if (visibility === 'public') {
        // Fetch guild to get roles and members
        if (!interaction.guild) {
          await interaction.reply({
            content: 'This command can only be used in a server.',
            ephemeral: true
          });
          return;
        }

        // Show access selection embed
        const { embed, components } = await createAccessSelectionEmbed(
          eventData.name,
          interaction.guild,
          confirmationId,
          accessList
        );

        await interaction.update({ embeds: [embed], components });

      } else {
        // If currently private, toggle back to public
        pendingEvent.visibility = 'public';

        // Recreate the confirmation embed with public visibility
        const embed = createConfirmationEmbed(eventData, 'public');

        // Recreate buttons with "Make Private" label
        const buttons = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`event_confirm_yes_${confirmationId}`)
              .setLabel('✅ Yes')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`event_confirm_edit_${confirmationId}`)
              .setLabel('✏️ Edit')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`event_confirm_toggle_visibility_${confirmationId}`)
              .setLabel('🔒 Make Private')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(`event_confirm_cancel_${confirmationId}`)
              .setLabel('❌ Cancel')
              .setStyle(ButtonStyle.Danger)
          );

        // Update the message
        await interaction.update({ embeds: [embed], components: [buttons] });
      }

    } else if (action === 'yes') {
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
        guildName,
        channelId: interaction.channelId ?? '',
        selectedModules,
        visibility,
        accessList,
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
        guildName,
        confirmationId
      });

    } else if (action === 'cancel') {
      try {
        await interaction.update({
          content: 'Event creation cancelled. ❌',
          embeds: [],
          components: []
        });
        global.pendingEvents.delete(confirmationId);
      } catch (cancelError) {
        console.error(`Error cancelling event ${confirmationId}:`, cancelError);
        throw cancelError;
      }
    }

  } catch (error) {
    console.error('Error handling confirmation button:', error);

    // Handle different interaction states
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: 'Failed to create event. Please try again.'
        });
      } else {
        await interaction.reply({
          content: 'Failed to create event. Please try again.',
          ephemeral: true
        });
      }
    } catch (followupError) {
      console.error('Error sending error message:', followupError);
      // If we can't reply, try followUp as last resort
      try {
        await interaction.followUp({
          content: 'An error occurred. Please try again.',
          ephemeral: true
        });
      } catch (finalError) {
        console.error('Could not send any error message:', finalError);
      }
    }
  }
}
