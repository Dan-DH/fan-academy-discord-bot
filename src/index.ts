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
        console.log(`HTTP server listening on port ${PORT}`);
    });

    const token = process.env.DISCORD_TOKEN;
    if (!token) throw new Error('DISCORD_TOKEN is not set');

    await client.login(token);
    runNotifierLoop(client);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
