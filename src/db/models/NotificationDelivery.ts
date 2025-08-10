import { Schema, model, Document, Types } from 'mongoose';

export interface INotificationDelivery extends Document {
    _id: Types.ObjectId;
    notificationId: Types.ObjectId;
    username: string;
    deliveredAt?: Date | null;
    deliveredMessageId?: string;
    attempts: number;
    lastAttemptAt?: Date;
    error?: string;
    claimedAt?: Date | null;
}

const notificationDeliverySchema = new Schema<INotificationDelivery>({
    notificationId: { type: Schema.Types.ObjectId, ref: 'Notification', required: true, index: true },
    username: { type: String, required: true, index: true },
    deliveredAt: { type: Date, default: null, index: true },
    deliveredMessageId: { type: String },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    error: { type: String },
    claimedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

notificationDeliverySchema.index({ username: 1, deliveredAt: 1 });

export const NotificationDelivery = model<INotificationDelivery>('NotificationDelivery', notificationDeliverySchema);
