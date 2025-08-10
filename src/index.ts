import 'dotenv/config';
import { client } from './bot/client';
import './bot/handlers';
import { connectMongo } from './db';
import { runNotifierLoop } from './services/notifier';

async function main() {
    await connectMongo();
    const token = process.env.DISCORD_TOKEN;
    if (!token) throw new Error('DISCORD_TOKEN is not set');
    await client.login(token);
    runNotifierLoop(client);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
