"use strict";
// Script to populate the database with test Notifications
// Usage: `yarn deploy:commands`
// Note: This script deploys slash commands to a single guild for faster iteration.
// Ensure DISCORD_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID are set in your .env before running.
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const commands_1 = require("../src/bot/commands");
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID; // guild-scoped for speed
async function main() {
    if (!token || !clientId || !guildId) {
        console.error("DISCORD_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID must be set");
        process.exit(1);
    }
    const rest = new discord_js_1.REST({ version: "10" }).setToken(token);
    try {
        console.log(`Started refreshing ${commands_1.allCommands.length} application (/) commands.`);
        const data = (await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), { body: commands_1.allCommands }));
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    }
    catch (error) {
        console.error("Failed to reload application (/) commands:", error);
        process.exitCode = 1;
    }
}
main();
//# sourceMappingURL=deploy-commands.js.map