import { ChatInputCommandInteraction, PermissionsBitField, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandIntegerOption, SlashCommandChannelOption } from 'discord.js';
import { z } from 'zod';
import { GuildConfig } from '../db/models/GuildConfig';

export const configCommand = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure bot settings for this server')
    .addSubcommand((sub: SlashCommandSubcommandBuilder) => sub
        .setName('show')
        .setDescription('Show current configuration')
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) => sub
        .setName('set-notify-channel')
        .setDescription('Set the channel where notifications will be posted')
        .addChannelOption((opt: SlashCommandChannelOption) => opt
            .setName('channel')
            .setDescription('A text channel')
            .setRequired(true)
        )
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) => sub
        .setName('set-poll-interval')
        .setDescription('Set poll interval in seconds (>= 5)')
        .addIntegerOption((opt: SlashCommandIntegerOption) => opt
            .setName('seconds')
            .setDescription('Interval in seconds')
            .setRequired(true)
            .setMinValue(5)
        )
    )
    .addSubcommand((sub: SlashCommandSubcommandBuilder) => sub
        .setName('set-message-spacing')
        .setDescription('Set delay between users when sending batches (ms)')
        .addIntegerOption((opt: SlashCommandIntegerOption) => opt
            .setName('ms')
            .setDescription('Milliseconds')
            .setRequired(true)
            .setMinValue(0)
        )
    );

const schema = z.object({ seconds: z.number().int().min(5) });

function requireGuildAdmin(interaction: ChatInputCommandInteraction): string | null {
    if (!interaction.guildId) return 'This command must be used in a guild.';
    const perms = interaction.memberPermissions;
    if (!perms || !perms.has(PermissionsBitField.Flags.ManageGuild)) {
        return 'You need the Manage Server permission to use this command.';
    }
    return null;
}

export async function handleConfig(interaction: ChatInputCommandInteraction) {
    const err = requireGuildAdmin(interaction);
    if (err) return interaction.editReply({ content: err });

    const guildId = interaction.guildId!;
    const sub = interaction.options.getSubcommand();

    if (sub === 'show') {
        const cfg = await GuildConfig.getEffectiveConfig(guildId);
        return interaction.editReply({
            content: [
                `Guild: ${guildId}`,
                `Notify channel: ${cfg.notifyChannelId ?? '(not set)'}`,
                `Poll interval: ${cfg.pollIntervalSeconds}s`,
                `Message spacing: ${cfg.messageSpacingMs}ms`,
            ].join('\n'),
        });
    }

    if (sub === 'set-notify-channel') {
        const ch = interaction.options.getChannel('channel', true);
        // Accept text-capable channel types (GUILD_TEXT=0, GUILD_ANNOUNCEMENT=5, GUILD_FORUM=15 uses posts; still allow)
        const allowedTypes = new Set([0, 5, 15]);
        if (!ch || !allowedTypes.has((ch as any).type)) {
            return interaction.editReply({ content: 'Please choose a text-capable channel.' });
        }
        await GuildConfig.upsertGuildConfig(guildId, { notifyChannelId: ch.id });
        return interaction.editReply({ content: `Notify channel set to <#${ch.id}>` });
    }

    if (sub === 'set-poll-interval') {
        const seconds = interaction.options.getInteger('seconds', true);
        const parsed = schema.safeParse({ seconds });
        if (!parsed.success) {
            return interaction.editReply({ content: 'Seconds must be an integer >= 5.' });
        }
        await GuildConfig.upsertGuildConfig(guildId, { pollIntervalSeconds: seconds });
        return interaction.editReply({ content: `Poll interval set to ${seconds}s` });
    }

    if (sub === 'set-message-spacing') {
        const ms = interaction.options.getInteger('ms', true);
        await GuildConfig.upsertGuildConfig(guildId, { messageSpacingMs: Math.max(0, ms) });
        return interaction.editReply({ content: `Message spacing set to ${ms}ms` });
    }
}
