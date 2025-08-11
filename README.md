# Fan Academy Discord Bot

A TypeScript Discord bot using discord.js v14 and mongoose. It links Discord users to your fan academy usernames, and periodically posts compacted notification batches to a configured channel.

## Prerequisites

- Node.js 22+
- Yarn
- MongoDB running locally or accessible via URI

## Setup

1. Clone the repo and install dependencies:

   ```bash
   yarn
   ```

2. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   DISCORD_TOKEN=...
   DISCORD_CLIENT_ID=...
   DISCORD_GUILD_ID=...
   MONGODB_URI=mongodb://localhost:27017/yourdb
   DEFAULT_NOTIFY_CHANNEL_ID=
   ```
    Optionals:
   ```bash   
   DEFAULT_POLL_INTERVAL_SECONDS=30
   DEFAULT_MESSAGE_SPACING_MS=1500
   NOTIFICATION_MAX_AGE_DAYS=7
   ```

3. Start MongoDB (if not already running).

## Deploy slash commands

This is only required once at the beginning and when modifying existing commands or adding new commands. Specifying the guild (Guild-scoped) makes them to be processed faster:

```bash
yarn deploy:commands
```

Ensure `DISCORD_CLIENT_ID` and `DISCORD_GUILD_ID` are set in `.env`.

## Run

- Development:

```bash
yarn dev
```

- Production:

```bash
yarn build
yarn start
```

## Commands

- `/register username:<string>`
  - Links your Discord user to your app username.
  - Errors if the username is already linked by someone else, or if you're linked to a different username.

- `/unregister`
  - Removes your link, or errors if none found.

- `/config` (Admin only)
  - `show` — displays current settings
  - `set-notify-channel channel:<#text-channel>` — sets the target channel
  - `set-poll-interval seconds:<int>=5` — sets poll interval (seconds)
  - `set-message-spacing ms:<int>` — delay between messages when notifying multiple users

## Data model

- UserLink
  - discordUserId (unique)
  - username (unique)
  - createdAt, updatedAt

- Notification
  - type? string
  - title string
  - summary string
  - createdAt Date (default now)

- NotificationDelivery
  - notificationId ObjectId (ref Notification)
  - username string (recipient username)
  - deliveredAt? Date | null (null pending)
  - deliveredMessageId? string
  - attempts number
  - lastAttemptAt? Date
  - error? string
  - claimedAt? Date | null

Creation flow: FA backend system inserts the Notification (definitions) and fan-out NotificationDelivery (notifications to send) docs for each recipient username.

## Notifier loop

- Polls pending deliveries per guild.
- Claims deliveries (`claimedAt=now`) to avoid duplicates.
- Batches by username; compacts multiple notifications into one message.
- Mentions the mapped Discord user once; formats lines as `• [title] — summary`.
- Sends sequentially with `messageSpacingMs` delay.
- Marks deliveries delivered with message id; records attempts and errors.
- Skips if no notify channel configured.

## Notes

- All command replies are ephemeral.
- Intents: Guilds.
- Minimal logging to console.
- Guard clauses and defensive null checks included.
