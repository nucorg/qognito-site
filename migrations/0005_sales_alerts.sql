-- Operational incident outbox: no customer address or signed download link.
CREATE TABLE sales_alerts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 order_id TEXT NOT NULL REFERENCES sales_orders(id),
 opened_at INTEGER NOT NULL,
 resolved_at INTEGER,
 failure_email_id TEXT,
 recovery_email_id TEXT,
 lease_until INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX sales_alert_open ON sales_alerts(order_id) WHERE resolved_at IS NULL;
