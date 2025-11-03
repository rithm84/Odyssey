import { SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../lib/supabase.js";

export const createEventCommand = {
    data: new SlashCommandBuilder()
        .setName('create-event')
        .setDescription('Create a new event')
        .addStringOption( option =>
            option
                .setName('name')
                .setDescription('Event name')
                .setRequired(true)
        )
        .addStringOption( option =>
            option
                .setName('date')
                .setDescription('Event date (e.g., "This Saturday" or "2024-11-05")')
                .setRequired(false)
        )
        .addStringOption( option =>
            option
                .setName('time')
                .setDescription('Event time (e.g., "6pm" or "18:00")')
                .setRequired(false)
        )
        .addStringOption( option =>
            option
                .setName('location')
                .setDescription('Event location')
                .setRequired(false)
        )
        .addStringOption( option =>
            option
                .setName('description')
                .setDescription('Event description')
                .setRequired(false)
        ),
    
    async execute(interaction: ChatInputCommandInteraction) {
        // extract option values from command input
        const name = interaction.options.getString('name', true);
        const date = interaction.options.getString('date');
        const time = interaction.options.getString('time');
        const location = interaction.options.getString('location');
        const description = interaction.options.getString('description');

        // insert into supabase
        const { data, error } = await supabase
            .from('events')
            .insert({
                name: name,
                date: date,
                time: time,
                location: location,
                description: description,
                created_by: interaction.user.id,
                channel_id: interaction.channelId!,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating event: ', error)
            await interaction.reply('Failed to create event. Please try again.')
            return
        }

        // Create the event dashboard URL (web app TBD)
        const dashboardUrl = `https://odyssey.app/event/${data.id}`

        // build success message array
        const messageParts = [
            `✅ **Event Created!**`,
            `# ${name}`,
            (date && time) && `📅 ${date} at ${time}`,
            (date && !time) && `📅 ${date}`,
            (!date && time) && `🕐 ${time}`,
            location && `📍 ${location}`,
            description && `📝 ${description}`,
            ` `,
            `[View Event Dashboard](${dashboardUrl})`
        ].filter(Boolean)

        // Reply with success message
        await interaction.reply({
            content: messageParts.join('\n')
        })
    } 
        
}