CREATE TABLE commerce_orders (
  session_id TEXT PRIMARY KEY,
  payment_intent_id TEXT NOT NULL UNIQUE,
  offer_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  page_language TEXT NOT NULL CHECK (page_language IN ('fr', 'en')),
  buyer_email TEXT NOT NULL,
  amount_total INTEGER NOT NULL CHECK (amount_total > 0),
  currency TEXT NOT NULL CHECK (currency = 'eur'),
  environment TEXT NOT NULL CHECK (environment = 'test'),
  status TEXT NOT NULL CHECK (status = 'paid_awaiting_setup'),
  created_at TEXT NOT NULL
);
CREATE TABLE commerce_fulfillment (
  session_id TEXT NOT NULL REFERENCES commerce_orders(session_id),
  kind TEXT NOT NULL CHECK (kind IN ('pdf', 'arbitre')),
  status TEXT NOT NULL CHECK (status = 'awaiting_setup'),
  created_at TEXT NOT NULL,
  PRIMARY KEY (session_id, kind)
);
CREATE TABLE commerce_events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES commerce_orders(session_id),
  received_at TEXT NOT NULL
);
