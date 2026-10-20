import datetime as dt
import fcntl
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from zoneinfo import ZoneInfo

spec = importlib.util.spec_from_file_location('backup', Path(__file__).resolve().parents[1] / 'scripts/commerce-backup.py')
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)
os.environ['QOGNITO_NO_NOTIFY'] = '1'

SQL = '''CREATE TABLE sales_orders(id TEXT PRIMARY KEY, pdf_key TEXT, pdf_sha256 TEXT);
CREATE TABLE sales_events(order_id TEXT REFERENCES sales_orders(id));
CREATE TABLE sales_alerts(id INTEGER);
CREATE TABLE d1_migrations(id INTEGER);
INSERT INTO d1_migrations VALUES(1);'''


class BackupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.private = self.root / 'private'
        self.private.mkdir(mode=0o700)
        self.mount = self.root / 'ssd'
        self.mount.mkdir()
        self.password = self.private / 'password'
        self.password.write_text('only-a-test-password')
        self.password.chmod(0o600)
        self.config = self.private / 'backup.json'
        b.save(self.config, dict(private_dir=str(self.private), repository=str(self.mount / 'commerce'),
               mount=str(self.mount), mount_uuid='expected-uuid', password_file=str(self.password),
               project=str(self.root), restic='/usr/bin/restic'))
        self.app = b.CommerceBackup(self.config)

    def tearDown(self):
        self.temp.cleanup()

    def package(self, path):
        path.mkdir()
        (path / 'database.sql').write_text(SQL)
        (path / 'file.pdf').write_bytes(b'%PDF-fixture')
        sha = b.digest(path / 'file.pdf')
        with (path / 'database.sql').open('a') as stream:
            stream.write("INSERT INTO sales_orders VALUES('fixture','saga-ia/test.pdf','" + sha + "');")
        m = dict(environment='production', export_seconds=0.1, table_counts=b.validate_sql(path / 'database.sql')[0],
                 pdf_objects={'saga-ia/test.pdf': dict(file='file.pdf', sha256=sha)},
                 files={n: b.digest(path / n) for n in ['database.sql', 'file.pdf']})
        b.save(path / 'manifest.json', m)
        return m

    def test_due_paris_and_catchup(self):
        now = dt.datetime(2026, 10, 20, 19, 0, tzinfo=ZoneInfo('Europe/Paris'))
        self.assertTrue(b.due({}, now))
        previous = now - dt.timedelta(hours=22)
        self.assertFalse(b.due({'last_success_epoch': previous.timestamp()}, now))
        self.assertTrue(b.due({'last_success_epoch': previous.timestamp()}, now.replace(hour=20)))
        self.assertFalse(b.due({'last_success_epoch': now.replace(hour=20, minute=1).timestamp()}, now.replace(hour=21)))

    def test_missing_and_wrong_disk(self):
        with patch.object(Path, 'is_mount', return_value=False):
            with self.assertRaises(b.BackupError): self.app.validate_storage()
        with patch.object(Path, 'is_mount', return_value=True), patch.object(self.app, 'run', return_value=b'wrong-uuid\n'):
            with self.assertRaises(b.BackupError): self.app.validate_storage()
        with patch.object(Path, 'is_mount', return_value=True), patch.object(self.app, 'run', return_value=b'expected-uuid\n'):
            self.app.validate_storage()

    def test_concurrency(self):
        with (self.private / 'operation.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with self.assertRaises(b.BackupError): self.app.execute('backup')

    def test_export_or_auth_failure_preserves_success_and_no_snapshot(self):
        for failure in [b.BackupError('interrupted export'), PermissionError('credentials')]:
            self.app.state = {'last_success_epoch': 1234, 'snapshot': 'previous'}
            with patch.object(self.app, 'validate_storage'), patch.object(self.app, 'collect', side_effect=failure), patch.object(self.app, 'restic') as restic:
                with self.assertRaises(b.BackupError): self.app.execute('backup')
                restic.assert_not_called()
                self.assertEqual(self.app.state['last_success_epoch'], 1234)
                self.assertEqual(self.app.state['snapshot'], 'previous')

    def test_sql_and_pdf_integrity(self):
        p = self.root / 'package'
        self.package(p)
        b.validate_package(p)
        (p / 'file.pdf').write_bytes(b'changed')
        with self.assertRaises(b.BackupError): b.validate_package(p)

    def test_missing_historical_pdf(self):
        p = self.root / 'package'
        m = self.package(p)
        with (p / 'database.sql').open('a') as f:
            f.write("INSERT INTO sales_orders VALUES('old','saga-ia/old.pdf','" + 'a'*64 + "');")
        m['files']['database.sql'] = b.digest(p / 'database.sql')
        m['table_counts'] = b.validate_sql(p / 'database.sql')[0]
        b.save(p / 'manifest.json', m)
        with self.assertRaises(b.BackupError): b.validate_package(p)

    def test_foreign_key_failure(self):
        p = self.root / 'bad.sql'
        p.write_text(SQL + "INSERT INTO sales_events VALUES('missing');")
        with self.assertRaises(b.BackupError): b.validate_sql(p)

    def test_restore_refuses_existing_target(self):
        with self.assertRaises(b.BackupError): self.app.restore(self.private, 'latest')

    def test_real_restic_roundtrip_and_failed_overwrite(self):
        # Isolated repository and synthetic data; no Cloudflare or production writes.
        with patch.object(self.app, 'validate_storage'):
            self.app.execute('init')
            with patch.object(self.app, 'collect', side_effect=self.package):
                first = self.app.execute('backup')
            result = self.app.execute('restore', self.root / 'restored')
            self.assertTrue(result['snapshot'].startswith(first['snapshot']))
            self.assertTrue(result['verified'])
            self.app.execute('check')
            with patch.object(self.app, 'collect', side_effect=self.package):
                self.app.execute('backup')  # exercises dry-run + scoped retention


if __name__ == '__main__':
    unittest.main()
