"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.getDb = getDb;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
let db;
async function initDb() {
    db = await (0, sqlite_1.open)({
        filename: process.env.DB_PATH || './hzs.db',
        driver: sqlite3_1.default.Database
    });
    await db.exec(`
    CREATE TABLE IF NOT EXISTS dispatches (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      time TEXT NOT NULL,
      source TEXT NOT NULL,
      lat REAL,
      lon REAL,
      weather_temp REAL,
      weather_condition TEXT,
      weather_wind REAL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      filters TEXT NOT NULL -- JSON s typy a lokalitami
    );
  `);
    console.log('Database initialized');
    return db;
}
function getDb() {
    if (!db)
        throw new Error('DB not initialized');
    return db;
}
//# sourceMappingURL=db.js.map