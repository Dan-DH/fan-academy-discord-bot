import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { z } from 'zod';
import { UserLink } from '../db/models/UserLink';

export const registerCommand = new SlashCommandBuilder()
    .setName('register')
    .setDescription('Link your Discord account with your fan academy username')
    .addStringOption((opt: SlashCommandStringOption) => opt
        .setName('username')
        .setDescription('Your fan academy username')
        .setRequired(true)
    );

const schema = z.object({ username: z.string().min(1).max(64) });

export async function handleRegister(interaction: ChatInputCommandInteraction) {
    const username = interaction.options.getString('username', true).trim();
    const parsed = schema.safeParse({ username });
    if (!parsed.success) {
        return interaction.reply({ content: 'Invalid username', ephemeral: true });
    }

    const discordUserId = interaction.user.id;

    const existingForUsername = await UserLink.findOne({ username }).lean();
    if (existingForUsername) {
        return interaction.reply({ content: 'That username is already linked by another Discord user.', ephemeral: true });
    }

    const existingForUser = await UserLink.findOne({ discordUserId }).lean();
    if (existingForUser && existingForUser.username !== username) {
        return interaction.reply({ content: `You are already linked to username "${existingForUser.username}".`, ephemeral: true });
    }

    await UserLink.updateOne(
        { discordUserId },
        { $setOnInsert: { discordUserId, username } },
        { upsert: true }
    );

    return interaction.editReply({
      content: `Linked to username "${username}".`,
    });
}
