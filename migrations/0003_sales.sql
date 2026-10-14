-- New sales ledger. Legacy sandbox orders are intentionally preserved.
CREATE TABLE sales_orders (
 id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, request_hash TEXT NOT NULL,
 environment TEXT NOT NULL CHECK(environment IN ('test','live')),
 session_id TEXT UNIQUE, payment_intent_id TEXT UNIQUE,
 offer_id TEXT NOT NULL, edition_id TEXT NOT NULL, pdf_key TEXT NOT NULL, pdf_sha256 TEXT NOT NULL,
 price_id TEXT NOT NULL, tax_rate_id TEXT NOT NULL, terms_version TEXT NOT NULL, terms_text TEXT NOT NULL,
 consent_at INTEGER NOT NULL, buyer_kind TEXT NOT NULL CHECK(buyer_kind IN ('individual','business')),
 buyer_name TEXT NOT NULL, buyer_email TEXT, company_name TEXT,
 status TEXT NOT NULL DEFAULT 'created', amount_total INTEGER NOT NULL DEFAULT 4999,
 amount_tax INTEGER NOT NULL DEFAULT 261, amount_refunded INTEGER NOT NULL DEFAULT 0,
 invoice_url TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 paid_at INTEGER, download_until INTEGER, download_version INTEGER NOT NULL DEFAULT 1,
 downloads INTEGER NOT NULL DEFAULT 0, last_download_at INTEGER,
 email_status TEXT NOT NULL DEFAULT 'pending', email_id TEXT,
 job_attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER NOT NULL DEFAULT 0,
 lease_until INTEGER NOT NULL DEFAULT 0, last_error TEXT,
 renew_requested INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX sales_retry ON sales_orders(status,next_attempt_at);
CREATE TABLE sales_events(event_id TEXT PRIMARY KEY, order_id TEXT REFERENCES sales_orders(id), received_at INTEGER NOT NULL);
CREATE TABLE sales_rate_limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
