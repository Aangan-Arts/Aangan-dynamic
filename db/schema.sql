-- AANGAN database (Cloudflare D1). Apply once:  npx wrangler d1 execute aangan --remote --file db/schema.sql

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,                 -- e.g. 20261020_1000 (old products) or P-<time> (new)
  slug        TEXT NOT NULL UNIQUE,             -- web address: p/<slug>/
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price       INTEGER,                          -- selling price in rupees; NULL = price on request
  mrp         INTEGER,                          -- price before the offer (shown struck out)
  category    TEXT NOT NULL DEFAULT '',
  details     TEXT NOT NULL DEFAULT '{}',       -- JSON object, e.g. {"Size":"38 inches"}
  care        TEXT NOT NULL DEFAULT '[]',       -- JSON list of care lines
  dispatch    TEXT NOT NULL DEFAULT '',
  available   INTEGER NOT NULL DEFAULT 1,       -- 0 = shown as "Currently unavailable"
  sort        INTEGER NOT NULL DEFAULT 0,       -- lower shows first
  media       TEXT NOT NULL DEFAULT '{}',       -- JSON: image addresses and sizes (see functions/lib/catalog.js)
  deleted     INTEGER NOT NULL DEFAULT 0,       -- 1 = removed from the shop (kept for old orders)
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS products_live ON products (deleted, sort);

CREATE TABLE IF NOT EXISTS orders (
  ref         TEXT PRIMARY KEY,                 -- AGN-261031-K7Q2, the same reference the customer sends on WhatsApp
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  status      TEXT NOT NULL DEFAULT 'new',      -- new, confirmed, paid, shipped, delivered, cancelled
  method      TEXT NOT NULL,                    -- whatsapp_direct or details_form
  items       TEXT NOT NULL,                    -- JSON list: [{id, name, price, qty}], prices checked by the server
  subtotal    INTEGER NOT NULL DEFAULT 0,
  free_ship   INTEGER NOT NULL DEFAULT 0,
  name        TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  address     TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  pincode     TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',         -- the customer's note (gift message etc.)
  admin_note  TEXT NOT NULL DEFAULT '',         -- your private note: tracking number, payment ref …
  ip_hash     TEXT NOT NULL DEFAULT ''          -- for spam limits only; not the address itself
);
CREATE INDEX IF NOT EXISTS orders_by_status ON orders (status, created_at);
CREATE INDEX IF NOT EXISTS orders_by_time ON orders (created_at);

CREATE TABLE IF NOT EXISTS order_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ref         TEXT NOT NULL,
  at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  status      TEXT NOT NULL,
  by_email    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS order_events_ref ON order_events (ref);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('last_publish_at', '1970-01-01T00:00:00Z');
