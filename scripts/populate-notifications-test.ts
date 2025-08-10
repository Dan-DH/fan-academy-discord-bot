// Script to populate the database with test Notifications
// Usage: npx ts-node scripts/populate-notifications.ts
// Note: requires some user(s) to be registered using /register to create notifications.

import mongoose from 'mongoose';

import { Notification } from '../src/db/models/Notification';
import { NotificationDelivery, INotificationDelivery } from '../src/db/models/NotificationDelivery';
import { UserLink } from '../src/db/models/UserLink';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/FA-test-db';

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const userLinks: any[] = await UserLink.find({}).lean();
    console.log(`Found ${userLinks.length} existing user links.`);

    // 1. Create test notifications
    const now = new Date();
    const notifications = Array.from({ length: 3 }).map((_, i) => ({
        title: `Test Notification ${i + 1}`,
        summary: `This is a test notification created at ${now.toISOString()}`,
        createdAt: new Date(now.getTime() - i * 60000), // each 1 min apart
    }));
    await Notification.deleteMany({});
    const insertedNotifications = await Notification.insertMany(notifications);
    console.log(`Inserted ${insertedNotifications.length} notifications.`);

    // 2. Create NotificationDeliveries for each user and notification
    await NotificationDelivery.deleteMany({});
    const deliveries: Partial<INotificationDelivery>[] = [];
    for (const user of userLinks) {
        for (const notif of insertedNotifications) {
            deliveries.push({
                notificationId: notif._id,
                username: user.username,
                attempts: 0,
            });
        }
    }
    const insertedDeliveries = await NotificationDelivery.insertMany(deliveries);
    console.log(`Inserted ${insertedDeliveries.length} notification deliveries.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
