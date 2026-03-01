import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const resolveDbPath = () => {
  const dataDir = path.resolve(__dirname, "../../data");
  fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, "wellness-tax.sqlite");
};

export const initDb = async () => {
  if (db) {
    return db;
  }

  db = await open({
    filename: resolveDbPath(),
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      subtotal REAL NOT NULL,
      composite_tax_rate REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  return db;
};

export const getDb = async () => initDb();
