import { Schema, model, Document } from 'mongoose';

const envDefaults = {
    pollIntervalSeconds: Number(process.env.DEFAULT_POLL_INTERVAL_SECONDS ?? 30),
    messageSpacingMs: Number(process.env.DEFAULT_MESSAGE_SPACING_MS ?? 1500),
    notifyChannelId: process.env.DEFAULT_NOTIFY_CHANNEL_ID,
};

export interface IGuildConfig extends Document {
    guildId: string;
    notifyChannelId?: string;
    pollIntervalSeconds: number;
    messageSpacingMs: number;
    createdAt: Date;
    updatedAt: Date;
}

export type GuildConfigEffective = {
    guildId: string;
    notifyChannelId?: string;
    pollIntervalSeconds: number;
    messageSpacingMs: number;
};

const schema = new Schema<IGuildConfig>({
    guildId: { type: String, required: true, unique: true, index: true },
    notifyChannelId: { type: String },
    pollIntervalSeconds: { type: Number, default: envDefaults.pollIntervalSeconds },
    messageSpacingMs: { type: Number, default: envDefaults.messageSpacingMs },
}, { timestamps: true });

schema.statics.getEffectiveConfig = async function (guildId: string): Promise<GuildConfigEffective> {
    const cfg = await this.findOne({ guildId }).lean();
    return {
        guildId,
        notifyChannelId: cfg?.notifyChannelId ?? envDefaults.notifyChannelId,
        pollIntervalSeconds: cfg?.pollIntervalSeconds ?? envDefaults.pollIntervalSeconds,
        messageSpacingMs: cfg?.messageSpacingMs ?? envDefaults.messageSpacingMs,
    } as GuildConfigEffective;
};

schema.statics.upsertGuildConfig = function (guildId: string, patch: Partial<IGuildConfig>) {
    return this.updateOne({ guildId }, { $set: patch, $setOnInsert: { guildId } }, { upsert: true });
};

import type { Model } from 'mongoose';

export interface GuildConfigModel extends Model<IGuildConfig> {
    getEffectiveConfig: (guildId: string) => Promise<GuildConfigEffective>;
    upsertGuildConfig: (guildId: string, patch: Partial<IGuildConfig>) => Promise<unknown>;
}

export const GuildConfig = model<IGuildConfig>('GuildConfig', schema) as unknown as GuildConfigModel;
