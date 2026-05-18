"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_cron_1 = __importDefault(require("node-cron"));
const web_push_1 = __importDefault(require("web-push"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const rss_1 = require("./rss");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 3001;
app.get('/api/dispatches', async (req, res) => {
    try {
        const db = (0, db_1.getDb)();
        // Return all dispatches sorted by time descending, limit to 500 for performance
        const rows = await db.all('SELECT * FROM dispatches ORDER BY time DESC LIMIT 500');
        // Map to frontend interface format
        const dispatches = rows.map(row => ({
            id: row.id,
            type: row.type,
            title: row.title,
            location: row.location,
            description: row.description,
            time: new Date(row.time),
            source: row.source,
            coords: row.lat && row.lon ? [row.lat, row.lon] : undefined,
            weather: row.weather_temp != null ? {
                temp: row.weather_temp,
                condition: row.weather_condition,
                wind: row.weather_wind
            } : undefined
        }));
        res.json(dispatches);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// VAPID Public Key for frontend
app.get('/api/vapidPublicKey', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});
// Subscribe to push notifications
app.post('/api/subscribe', async (req, res) => {
    const subscription = req.body.subscription;
    const filters = req.body.filters || { enabled: true, types: [], localities: [] };
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
    }
    try {
        const db = (0, db_1.getDb)();
        // Insert or update subscription
        await db.run(`
      INSERT INTO subscriptions (endpoint, p256dh, auth, filters)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        filters = excluded.filters
    `, [
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth,
            JSON.stringify(filters)
        ]);
        res.status(201).json({ success: true });
    }
    catch (err) {
        console.error('Subscribe error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Init sequence
async function startServer() {
    await (0, db_1.initDb)();
    // Initial fetch
    await (0, rss_1.fetchAndProcessRSS)();
    // Schedule CRON every minute
    node_cron_1.default.schedule('* * * * *', () => {
        (0, rss_1.fetchAndProcessRSS)();
    });
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
        if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
            console.warn('\n!!! WARNING !!! VAPID Keys not found in environment.');
            console.warn('Run `npx web-push generate-vapid-keys` and set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env file.');
        }
    });
}
startServer();
//# sourceMappingURL=index.js.map