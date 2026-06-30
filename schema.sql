-- 合一療癒 D1 Schema
-- Run: wrangler d1 execute refer-db --file=schema.sql --remote

CREATE TABLE IF NOT EXISTS users (
  uid           TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_uid  TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  friend    TEXT NOT NULL,
  service   TEXT NOT NULL DEFAULT '',
  date      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_uid  TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  type      TEXT NOT NULL,  -- 'grant' or 'redeem'
  amount    INTEGER NOT NULL,
  note      TEXT NOT NULL DEFAULT '',
  date      TEXT NOT NULL
);
