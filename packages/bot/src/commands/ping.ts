import { SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../lib/supabase.js";

export const pingCommand = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),

    async execute(interaction: ChatInputCommandInteraction) {
        const { data, error } = await supabase
            .from('events')
            .insert({
                name: 'Test Event from Ping',
                created_by: interaction.user.id,
                channel_id: interaction.channelId!,
            })
            .select();
        
        if (error) {
            console.error('Database error: ', error);
            await interaction.reply('Pong! (but database error occurred)');
        } else {
            await interaction.reply(`Pong! Created test event with ID: ${data[0].id}`);
        }
    }
};