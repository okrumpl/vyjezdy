"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = sendPushNotification;
const web_push_1 = __importDefault(require("web-push"));
const db_1 = require("./db");
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@hzs-dashboard.local';
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    web_push_1.default.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}
async function sendPushNotification(dispatch) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn('VAPID keys not set, cannot send push notifications.');
        return;
    }
    const db = (0, db_1.getDb)();
    const subs = await db.all('SELECT * FROM subscriptions');
    if (subs.length === 0)
        return;
    const payload = JSON.stringify({
        title: `🚒 Nový výjezd: ${dispatch.type}`,
        body: `📍 ${dispatch.location}`,
        url: '/',
        id: dispatch.id
    });
    const promises = subs.map(async (sub) => {
        // Check filters
        try {
            const filters = JSON.parse(sub.filters);
            let match = false;
            if (!filters.enabled)
                return; // User disabled push temporarily
            const typeMatch = filters.types.length === 0 || filters.types.includes(dispatch.type);
            let locMatch = true;
            if (filters.localities.length > 0) {
                const dLoc = dispatch.location.toLowerCase();
                locMatch = filters.localities.some((l) => dLoc.includes(l.toLowerCase()));
            }
            match = typeMatch && locMatch;
            if (!match)
                return;
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            await web_push_1.default.sendNotification(pushSubscription, payload);
        }
        catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
                console.log('Subscription expired or deleted, removing from DB', sub.endpoint);
                await db.run('DELETE FROM subscriptions WHERE endpoint = ?', sub.endpoint);
            }
            else {
                console.error('Push notification failed:', err);
            }
        }
    });
    await Promise.allSettled(promises);
}
//# sourceMappingURL=push.js.map