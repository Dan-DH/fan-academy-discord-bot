
import { TextChannel, Client, Guild } from 'discord.js';
import { NotificationDelivery, INotificationDelivery } from '../db/models/NotificationDelivery';
import { Notification, INotification } from '../db/models/Notification';
import { UserLink, IUserLink } from '../db/models/UserLink';
import { GuildConfig, GuildConfigEffective } from '../db/models/GuildConfig';

// --- Constants ---
const NOTIFICATION_BATCH_LIMIT = 500;
const DISCORD_MESSAGE_MAX_LENGTH = 1900; // Discord's hard limit is 2000, but leave room for mention, etc.
const SCHEDULER_INTERVAL_MS = 1000;
const MIN_POLL_INTERVAL_SECONDS = 5;

/**
 * Starts the notification delivery loop for all Discord guilds the bot is in.
 * Periodically checks for pending notifications and delivers them to users.
 * @param client Discord.js Client instance
 */
export async function runNotifierLoop(client: Client) {
    const guilds = client.guilds.cache;
    const lastPoll = new Map<string, number>(); // guildId -> last poll timestamp(ms)

    /**
     * Fetches the text channel for notifications, or returns null if not found or not text-capable.
     */
    async function getTextChannel(guild: Guild, channelId: string): Promise<TextChannel | null> {
        try {
            const channel = await guild.channels.fetch(channelId);
            if (channel && 'send' in (channel as any)) {
                return channel as TextChannel;
            }
        } catch {
            // ignore
        }
        return null;
    }

    /**
     * Formats a list of notification deliveries into message lines.
     */
    function formatNotificationLines(deliveries: INotificationDelivery[], notificationMap: Map<string, INotification>): string[] {
        return deliveries.map((d) => {
            const n = notificationMap.get(String(d.notificationId));
            if (!n) return '';
            const title = n.title;
            const summary = n.summary;
            return `• [${title}] — ${summary}`;
        }).filter(Boolean);
    }

    /**
     * Processes pending notification deliveries for a single guild.
     * @param guildId The Discord guild ID
     */
    async function processGuild(guildId: string) {
        const guild = guilds.get(guildId);
        if (!guild) return;

        try {
            const cfg: GuildConfigEffective = await GuildConfig.getEffectiveConfig(guildId);
            const channelId = cfg.notifyChannelId;
            if (!channelId) {
                console.warn(`[notifier] guild ${guildId} has no notify channel, skipping.`);
                return;
            }
            const textChannel = await getTextChannel(guild, channelId);
            if (!textChannel) {
                console.warn(`[notifier] guild ${guildId} notify channel not found or not text-capable.`);
                return;
            }

            // Claim a batch: pull pending deliveries
            const pending = await NotificationDelivery.find({
                deliveredAt: null,
                claimedAt: null,
            })
                .limit(NOTIFICATION_BATCH_LIMIT)
                .lean<INotificationDelivery[]>();

            if (!pending.length) return;

            // Claim atomically and group by username
            const claimedByUser: Record<string, string[]> = {};
            for (const d of pending) {
                const updated = await NotificationDelivery.findOneAndUpdate(
                    { _id: d._id, deliveredAt: null, claimedAt: null },
                    { $set: { claimedAt: new Date() } },
                    { new: true }
                ).lean<INotificationDelivery | null>();
                if (!updated) continue;
                const key = updated.username;
                if (!claimedByUser[key]) claimedByUser[key] = [];
                claimedByUser[key].push(String(updated._id));
            }

            const usernames = Object.keys(claimedByUser);
            for (let i = 0; i < usernames.length; i++) {
                const username = usernames[i];
                const ids = claimedByUser[username];
                const link = await UserLink.findOne({ username }).lean<IUserLink | null>();
                if (!link) {
                    console.warn(`[notifier] No Discord link for username ${username}, skipping.`);
                    await NotificationDelivery.updateMany({ _id: { $in: ids } }, {
                        $set: { lastAttemptAt: new Date(), error: 'No Discord link', claimedAt: null },
                        $inc: { attempts: 1 },
                    });
                    continue;
                }

                const deliveries = await NotificationDelivery.find({ _id: { $in: ids } }).lean<INotificationDelivery[]>();
                const notifications = await Notification.find({ _id: { $in: deliveries.map((dd: INotificationDelivery) => dd.notificationId) } }).lean<INotification[]>();
                const notificationMap = new Map<string, INotification>(notifications.map((n: INotification) => [String(n._id), n]));
                const lines = formatNotificationLines(deliveries, notificationMap);

                if (!lines.length) {
                    await NotificationDelivery.updateMany({ _id: { $in: ids } }, { $set: { claimedAt: null } });
                    continue;
                }

                const mention = `<@${link.discordUserId}>`;
                const content = `${mention}\n${lines.join('\n')}`.slice(0, DISCORD_MESSAGE_MAX_LENGTH);
                try {
                    const msg = await textChannel.send({ content });
                    await NotificationDelivery.updateMany({ _id: { $in: ids } }, {
                        $set: { deliveredAt: new Date(), deliveredMessageId: msg.id, claimedAt: null },
                    });
                } catch (err: unknown) {
                    console.error(`[notifier] send failed for user ${username} in guild ${guildId}`, err);
                    const errMsg = err instanceof Error ? err.message : String(err);
                    await NotificationDelivery.updateMany({ _id: { $in: ids } }, {
                        $set: { lastAttemptAt: new Date(), error: errMsg, claimedAt: null },
                        $inc: { attempts: 1 },
                    });
                }

                if (i < usernames.length - 1) {
                    await new Promise((res) => setTimeout(res, cfg.messageSpacingMs));
                }
            }
        } catch (err) {
            console.error(`[notifier] guild ${guildId} tick error`, err);
        }
    }

    /**
     * Scheduler tick: checks all guilds and processes those due for notification delivery.
     */
    async function schedulerTick() {
        const now = Date.now();
        for (const [guildId] of guilds) {
            try {
                const cfg = await GuildConfig.getEffectiveConfig(guildId);
                const last = lastPoll.get(guildId) ?? 0;
                const intervalMs = Math.max(MIN_POLL_INTERVAL_SECONDS, cfg.pollIntervalSeconds) * 1000;
                if (now - last >= intervalMs) {
                    lastPoll.set(guildId, now);
                    await processGuild(guildId);
                }
            } catch (err) {
                console.error(`[notifier] schedulerTick error for guild ${guildId}`, err);
            }
        }
    }

    // Start the scheduler loop

    setInterval(() => {
        schedulerTick().catch((e) => console.error('[notifier] scheduler error', e));
    }, SCHEDULER_INTERVAL_MS);

    // Run once immediately on startup
    schedulerTick().catch(() => undefined);
}
