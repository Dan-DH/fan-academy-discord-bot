import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export const intents = [
    GatewayIntentBits.Guilds,
];

export const client = new Client({
    intents,
    partials: [Partials.Channel],
});

client.once('ready', () => {
    console.log(`[bot] Logged in as ${client.user?.tag}`);
});
