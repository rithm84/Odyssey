import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { EnabledModules } from '@odyssey/shared/types/database';

/**
 * Creates the module selection embed with toggle buttons
 */
export function createModuleSelectionEmbed(
  eventName: string,
  selectedModules: EnabledModules,
  sessionId: string
) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🔧 Customize Your Event')
    .setDescription(
      `Choose which features to enable for **${eventName}**\n\n` +
      `✨ **Smart defaults are pre-selected** based on your event type.\n` +
      `You can unselect any optional modules below.\n` +
      `_(Schedule and Attendees are required and cannot be disabled)_`
    )
    .addFields(
      {
        name: '📋 Always Included',
        value: '• Schedule of Events ✓\n• Attendees List ✓',
        inline: false
      },
      {
        name: '⚙️ Optional Features',
        value: 'Toggle the buttons below to customize:',
        inline: false
      }
    )
    .setTimestamp();

  // Row 1: Required modules (disabled buttons for display)
  const row1 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`module_required_info_${sessionId}`)
        .setLabel('✓ Schedule & Attendees (Required)')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

  // Row 2: Optional modules (first 3)
  const row2 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`module_toggle_group_dashboard_${sessionId}`)
        .setLabel(`${selectedModules.group_dashboard ? '✓' : ' '} Group Dashboard`)
        .setStyle(selectedModules.group_dashboard ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`module_toggle_individual_packing_${sessionId}`)
        .setLabel(`${selectedModules.individual_packing ? '✓' : ' '} Individual Packing`)
        .setStyle(selectedModules.individual_packing ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`module_toggle_transportation_${sessionId}`)
        .setLabel(`${selectedModules.transportation ? '✓' : ' '} Transportation`)
        .setStyle(selectedModules.transportation ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

  // Row 3: Optional modules (last 2)
  const row3 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`module_toggle_budget_${sessionId}`)
        .setLabel(`${selectedModules.budget ? '✓' : ' '} Budget/Expenses`)
        .setStyle(selectedModules.budget ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`module_toggle_weather_${sessionId}`)
        .setLabel(`${selectedModules.weather ? '✓' : ' '} Weather Forecast`)
        .setStyle(selectedModules.weather ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

  // Row 4: Action buttons
  const row4 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`module_confirm_${sessionId}`)
        .setLabel('✅ Confirm Selections')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`module_cancel_${sessionId}`)
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Danger)
    );

  return { embed, components: [row1, row2, row3, row4] };
}
