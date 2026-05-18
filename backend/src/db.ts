import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database;

export async function initDb() {
  db = await open({
    filename: process.env.DB_PATH || './hzs.db',
    driver: sqlite3.Database
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

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}
