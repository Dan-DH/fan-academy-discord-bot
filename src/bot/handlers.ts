import { Events, Interaction } from 'discord.js';
import { client } from './client';
import { handleRegister } from '../commands/register';
import { handleUnregister } from '../commands/unregister';
import { handleConfig } from '../commands/config';

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
        switch (interaction.commandName) {
            case 'register':
                await handleRegister(interaction);
                break;
            case 'unregister':
                await handleUnregister(interaction);
                break;
            case 'config':
                await handleConfig(interaction);
                break;
            default:
                await interaction.reply({ content: 'Unknown command', ephemeral: true });
        }
    } catch (err) {
        console.error('[bot] command error', err);
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: 'There was an error processing that command.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error processing that command.', ephemeral: true });
        }
    }
});
