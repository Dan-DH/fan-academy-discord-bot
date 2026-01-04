import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { UserLink } from '../db/models/UserLink';

export const unregisterCommand = new SlashCommandBuilder()
    .setName('unregister')
    .setDescription('Unlink your Discord account from your app username');

export async function handleUnregister(interaction: ChatInputCommandInteraction) {
    const discordUserId = interaction.user.id;
    const existing = await UserLink.findOne({ discordUserId }).lean();
    if (!existing) {
        return interaction.reply({ content: 'You are not linked to any username.', ephemeral: true });
    }

    await UserLink.deleteOne({ discordUserId });
    return interaction.editReply({ content: 'Your link has been removed.' });
}
