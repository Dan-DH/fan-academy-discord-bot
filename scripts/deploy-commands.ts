// Script to populate the database with test Notifications
// Usage: `yarn deploy:commands`
// Note: This script deploys slash commands to a single guild for faster iteration.
// Ensure DISCORD_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID are set in your .env before running.

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { allCommands } from '../src/bot/commands';
import type {
    APIApplicationCommand,
} from "discord-api-types/v10";

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.DISCORD_GUILD_ID!; // guild-scoped for speed

async function main() {
    if (!token || !clientId || !guildId) {
        console.error("DISCORD_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID must be set");
        process.exit(1);
    }

    const rest = new REST({ version: "10" }).setToken(token);

    try {
        console.log(`Started refreshing ${allCommands.length} application (/) commands.`);

        const data = (await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: allCommands }
        )) as APIApplicationCommand[];

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error("Failed to reload application (/) commands:", error);
        process.exitCode = 1;
    }
}

main();
