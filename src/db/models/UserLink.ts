import { Schema, model, Document } from 'mongoose';

export interface IUserLink extends Document {
    discordUserId: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
}

const userLinkSchema = new Schema<IUserLink>({
    discordUserId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

export const UserLink = model<IUserLink>('UserLink', userLinkSchema);
