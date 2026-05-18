import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
export declare function initDb(): Promise<Database<sqlite3.Database, sqlite3.Statement>>;
export declare function getDb(): Database<sqlite3.Database, sqlite3.Statement>;
//# sourceMappingURL=db.d.ts.map