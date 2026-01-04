import 'dotenv/config';
import express from "express";
import { client } from './bot/client';
import './bot/handlers';
import { connectMongo } from './db';
import { runNotifierLoop } from './services/notifier';

async function main() {
    await connectMongo();

    const app = express();
    const PORT = process.env.PORT || 3000;

    app.get('/', (_req, res) => {
        res.send('Bot is running!');
    });

    app.listen(PORT, () => {
        console.log(`[server] HTTP server listening on port ${PORT}`);
    });

    const token = process.env.DISCORD_TOKEN;
    if (!token) throw new Error('[bot] DISCORD_TOKEN is not set');

    console.log('[bot] Discord token length:', token.length);

    client.once('ready', () => {
        console.log(`[bot] Logged in as ${client.user?.tag}`);
    });

    await client.login(token);

    runNotifierLoop(client);

    console.log('[bot] Main setup complete');
}

main().catch((err) => {
    console.error('[bot] Fatal error:', err);
    process.exit(1);
});
