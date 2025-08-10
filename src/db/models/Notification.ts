import { Schema, model, Document, Types } from 'mongoose';

// Note: This should be in sync with the backend that inserts notifications

export interface INotification extends Document {
    _id: Types.ObjectId;
    type?: string;
    title: string;
    summary: string;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
    type: { type: String },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
});

export const Notification = model<INotification>('Notification', notificationSchema);
