#!/usr/bin/env python3
"""Private production backup. Cloud operations are reads; restore is local only."""
import argparse
from contextlib import closing
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import tempfile
import time
import tomllib
import urllib.request
from zoneinfo import ZoneInfo


class BackupError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise BackupError(message)


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def save(path, data):
    path = Path(path)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.chmod(0o600)
    temporary.replace(path)


def due(state, now=None):
    now = now or dt.datetime.now(ZoneInfo('Europe/Paris'))
    deadline = now.replace(hour=20, minute=0, second=0, microsecond=0)
    if now < deadline:
        deadline -= dt.timedelta(days=1)
    return state.get('last_success_epoch', 0) < deadline.timestamp()


def validate_sql(path):
    # Memory-only import: no Worker, webhook, email or payment can run here.
    with closing(sqlite3.connect(':memory:')) as db:
        db.executescript(Path(path).read_text())
        require(db.execute('PRAGMA integrity_check').fetchall() == [('ok',)], 'SQL integrity')
        require(not db.execute('PRAGMA foreign_key_check').fetchall(), 'SQL foreign keys')
        names = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        require({'sales_orders', 'sales_events', 'sales_alerts', 'd1_migrations'} <= names, 'Missing tables')
        counts = {name: db.execute('SELECT COUNT(*) FROM "' + name.replace('"', '""') + '"').fetchone()[0]
                  for name in sorted(names) if not name.startswith(('sqlite_', '_cf_'))}
        pdfs = list(db.execute('SELECT DISTINCT pdf_key,pdf_sha256 FROM sales_orders'))
        return counts, pdfs


def validate_package(directory):
    directory = Path(directory)
    manifest = json.loads((directory / 'manifest.json').read_text())
    require(manifest['environment'] == 'production', 'Wrong environment')
    for name, expected in manifest['files'].items():
        path = directory / name
        require(path.resolve().is_relative_to(directory.resolve()) and not path.is_symlink(), 'Unsafe manifest path')
        require(path.is_file() and digest(path) == expected, 'Backup file integrity')
    counts, refs = validate_sql(directory / 'database.sql')
    require(counts == manifest['table_counts'], 'SQL row counts')
    for key, sha in refs:
        require(manifest['pdf_objects'].get(key, {}).get('sha256') == sha, 'Missing historical PDF')
    for obj in manifest['pdf_objects'].values():
        require(obj['file'] in manifest['files'], 'Unlisted PDF file')
        require(digest(directory / obj['file']) == obj['sha256'], 'PDF integrity')
    return manifest


class CommerceBackup:
    def __init__(self, config):
        self.cfg = json.loads(Path(config).read_text())
        self.root = Path(self.cfg['private_dir']).expanduser().resolve()
        require(self.root.is_dir() and self.root.stat().st_mode & 0o077 == 0, 'Private directory permissions')
        self.repo = Path(self.cfg['repository']).resolve()
        self.mount = Path(self.cfg['mount']).resolve()
        self.password = Path(self.cfg['password_file']).resolve()
        self.project = Path(self.cfg['project']).resolve()
        self.state_path = self.root / 'status.json'
        self.state = json.loads(self.state_path.read_text()) if self.state_path.exists() else {}
        self.log = None
        self.phase = 'initialization'

    def run(self, args, cwd=None, env=None, timeout=600, record_stdout=True):
        result = subprocess.run([str(a) for a in args], cwd=cwd, env=env, capture_output=True, timeout=timeout)
        if self.log:
            # Commands are not logged: arguments may include sensitive destinations.
            with self.log.open('ab') as stream:
                stream.write((result.stdout if record_stdout else b'') + result.stderr)
        require(result.returncode == 0, 'Command failed during ' + self.phase)
        return result.stdout

    def validate_storage(self):
        require(self.mount.is_mount(), 'Backup SSD is not mounted')
        actual = self.run(['/usr/bin/findmnt', '-n', '-o', 'UUID', '--target', self.mount]).decode().strip()
        require(actual == self.cfg['mount_uuid'], 'Wrong backup SSD')
        require(self.repo != self.mount and self.repo.is_relative_to(self.mount), 'Repository must be on the SSD')
        require(not self.root.is_relative_to(self.repo), 'Private files must be outside repository')
        require(self.password.is_file() and self.password.stat().st_mode & 0o077 == 0, 'Password file permissions')
        require(not self.password.is_relative_to(self.repo), 'Password inside repository')

    def restic(self, *args):
        env = dict(os.environ, RESTIC_REPOSITORY=str(self.repo), RESTIC_PASSWORD_FILE=str(self.password))
        return self.run([self.cfg['restic'], *args], env=env, timeout=1800)

    def wrangler(self, *args):
        return self.run([self.cfg['node'], self.project / 'node_modules/wrangler/bin/wrangler.js', *args], cwd=self.project,
                        env=dict(os.environ, CLOUDFLARE_ACCOUNT_ID=self.cfg['account_id']))

    def api(self, path, raw=False):
        cfg = tomllib.loads(Path(self.cfg['wrangler_auth']).read_text())
        req = urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/' + self.cfg['account_id'] + path,
                                     headers={'Authorization': 'Bearer ' + cfg['oauth_token']})
        with urllib.request.urlopen(req, timeout=60) as response:
            data = response.read()
            if raw:
                return data, response.headers.get('Content-Type')
        payload = json.loads(data)
        require(payload.get('success'), 'Cloudflare read failed')
        return payload['result']

    def collect(self, directory):
        directory.mkdir()
        self.phase = 'D1 export'
        started = time.monotonic()
        self.wrangler('d1', 'export', self.cfg['database'], '--remote', '--config', self.cfg['wrangler_config'], '--env', 'production',
                      '--output', directory / 'database.sql')
        export_seconds = round(time.monotonic() - started, 2)
        counts, refs = validate_sql(directory / 'database.sql')
        self.phase = 'production configuration'
        project = self.api('/pages/projects/' + self.cfg['pages_project'])
        deployment = project['canonical_deployment']
        require(deployment['latest_stage']['status'] == 'success', 'Deployment not stable')
        commit = deployment['deployment_trigger']['metadata']['commit_hash']
        require(re.fullmatch(r'[0-9a-f]{40}', commit), 'Unknown deployed commit')
        catalogue = json.loads(self.run(['git', 'show', commit + ':commerce/saga-volume-01.json'], cwd=self.project))
        pdf = catalogue['contents']['private_pdf_candidate']
        (directory / 'deployed-code.tar').write_bytes(self.run(['git', 'archive', commit], cwd=self.project, record_stdout=False))
        save(directory / 'catalogue.json', catalogue)
        save(directory / 'pages.json', {'deployment': deployment, 'production': project['deployment_configs']['production']})
        worker_path = '/workers/scripts/' + self.cfg['worker']
        settings = self.api(worker_path + '/settings')
        versions = self.api(worker_path + '/deployments')
        bundle, mime = self.api(worker_path, raw=True)
        (directory / 'worker.bundle').write_bytes(bundle)
        save(directory / 'worker.json', {'settings': settings, 'deployments': versions, 'bundle_content_type': mime})
        # Explicit allow-list; never collect the whole environment or home directory.
        secrets = json.loads(Path(self.cfg['secrets_file']).read_text())
        names = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'COMMERCE_TOKEN_SECRET', 'RESEND_API_KEY']
        require(all(secrets.get(k) for k in names), 'Missing recovery secret')
        require(secrets['STRIPE_SECRET_KEY'].startswith(('sk_live_', 'rk_live_')), 'Wrong Stripe environment')
        save(directory / 'secrets.json', {k: secrets[k] for k in names})
        (directory / 'publication.yml').write_bytes(Path(self.cfg['publication_manifest']).read_bytes())
        (directory / 'backup-program.py').write_bytes(Path(__file__).read_bytes())
        save(directory / 'backup-config.json', self.cfg)
        # Local unpublished work is distinguished from the actual deployed source.
        (directory / 'local-tracked-diff.patch').write_bytes(self.run(['git', 'diff', '--binary', commit], cwd=self.project))
        save(directory / 'local-state.json', {'head': self.run(['git', 'rev-parse', 'HEAD'], cwd=self.project).decode().strip(),
              'status': self.run(['git', 'status', '--porcelain'], cwd=self.project).decode()})
        wanted = {}
        for key, sha in refs + [(pdf['storage_key'], pdf['sha256'])]:
            require(isinstance(key, str) and key.startswith('saga-ia/') and not any(x in key.split('/') for x in ['..', '']), 'Unsafe R2 key')
            require(isinstance(sha, str) and re.fullmatch(r'[0-9a-f]{64}', sha), 'Invalid PDF digest')
            require(key not in wanted or wanted[key] == sha, 'Conflicting PDF hashes')
            wanted[key] = sha
        self.phase = 'R2 download'
        (directory / 'pdfs').mkdir()
        objects = {}
        for key, sha in sorted(wanted.items()):
            relative = 'pdfs/' + sha + '.pdf'
            target = directory / relative
            self.wrangler('r2', 'object', 'get', self.cfg['bucket'] + '/' + key, '--remote', '--file', target)
            require(digest(target) == sha, 'R2 PDF digest mismatch')
            objects[key] = {'file': relative, 'sha256': sha}
        require(self.api('/pages/projects/' + self.cfg['pages_project'])['canonical_deployment']['id'] == deployment['id'], 'Deployment changed during backup')
        require(self.api(worker_path + '/deployments') == versions, 'Worker changed during backup')
        manifest = {'schema_version': 1, 'environment': 'production', 'created_at': dt.datetime.now(dt.timezone.utc).isoformat(),
                    'database': self.cfg['database'], 'bucket': self.cfg['bucket'], 'commit': commit,
                    'pages_deployment': deployment['id'], 'worker': self.cfg['worker'], 'export_seconds': export_seconds,
                    'table_counts': counts, 'pdf_objects': objects,
                    'files': {str(p.relative_to(directory)): digest(p) for p in directory.rglob('*') if p.is_file()}}
        save(directory / 'manifest.json', manifest)
        validate_package(directory)
        return manifest

    def backup(self):
        self.phase = 'collection'
        with tempfile.TemporaryDirectory(prefix='collect-', dir=self.root) as temp:
            manifest = self.collect(Path(temp) / 'commerce')
            self.phase = 'encrypted snapshot'
            raw = self.restic('backup', str(Path(temp) / 'commerce'), '--host', 'qognito-commerce', '--tag', 'production', '--json')
            summaries = [j for line in raw.splitlines() if (j := json.loads(line)).get('message_type') == 'summary']
            require(len(summaries) == 1 and summaries[0].get('snapshot_id'), 'Snapshot not confirmed')
            snapshot = summaries[0]['snapshot_id']
        self.state.update(last_success_epoch=time.time(), last_success_at=dt.datetime.now(dt.timezone.utc).isoformat(),
                          snapshot=snapshot, manifest=manifest, last_error=None)
        save(self.state_path, self.state)
        if self.state.get('restore_verified_snapshot'):
            self.phase = 'retention'
            policy = ['forget', '--host', 'qognito-commerce', '--tag', 'production', '--group-by', 'host,tags', '--keep-within', '90d']
            self.restic(*policy, '--dry-run', '--json')
            self.restic(*policy, '--prune')
        return {'snapshot': snapshot, 'tables': len(manifest['table_counts']), 'pdfs': len(manifest['pdf_objects']),
                'export_seconds': manifest['export_seconds']}

    def restore(self, target, snapshot):
        target = Path(target).expanduser().absolute()
        require(not target.exists() and not target.is_symlink(), 'Restore target must not exist')
        require(not target.resolve().is_relative_to(self.repo), 'Restore target inside repository')
        target.mkdir(mode=0o700, parents=True)
        self.phase = 'isolated restore'
        snapshots = json.loads(self.restic('snapshots', '--host', 'qognito-commerce', '--tag', 'production', '--json', snapshot))
        require(len(snapshots) == 1, 'Ambiguous snapshot')
        chosen = snapshots[0]
        self.restic('restore', chosen['id'], '--target', target)
        candidates = list(target.rglob('commerce/manifest.json'))
        require(len(candidates) == 1, 'Missing restored package')
        manifest = validate_package(candidates[0].parent)
        self.state.update(restore_verified_snapshot=chosen['id'], restore_verified_at=dt.datetime.now(dt.timezone.utc).isoformat())
        save(self.state_path, self.state)
        return {'snapshot': chosen['id'], 'verified': True, 'pdfs': len(manifest['pdf_objects']), 'target': str(target)}

    def execute(self, action, target=None, snapshot='latest'):
        with (self.root / 'operation.lock').open('a') as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise BackupError('Another backup operation is running') from None
            if action == 'status':
                return {k: v for k, v in self.state.items() if k != 'manifest'} | {'due': due(self.state)}
            if action == 'backup-if-due' and not due(self.state):
                return {'skipped': 'daily backup already successful'}
            self.log = self.root / ('operation-' + dt.datetime.now().strftime('%Y%m%d-%H%M%S') + '.log')
            self.log.touch(mode=0o600)
            try:
                self.validate_storage()
                if action == 'init':
                    require(not self.repo.exists() or not any(self.repo.iterdir()), 'Repository already exists; refusing init')
                    self.restic('init')
                    return {'initialized': True}
                if action in ['backup', 'backup-if-due']:
                    return self.backup()
                if action == 'check':
                    self.phase = 'repository verification'
                    self.restic('check', '--read-data')
                    return {'verified': True}
                if action == 'restore':
                    require(target, 'A new restore directory is required')
                    return self.restore(target, snapshot)
                raise BackupError('Unknown action')
            except Exception as error:
                self.state.update(last_error={'at': dt.datetime.now(dt.timezone.utc).isoformat(), 'phase': self.phase,
                                  'type': type(error).__name__, 'reason': str(error) if isinstance(error, BackupError) else type(error).__name__})
                save(self.state_path, self.state)
                if shutil.which('notify-send') and not os.environ.get('QOGNITO_NO_NOTIFY'):
                    subprocess.run(['notify-send', '--urgency=critical', 'Sauvegarde commerce Qognito',
                                    'Échec pendant ' + self.phase + '. Consulter le statut privé.'], capture_output=True)
                # No raw provider errors, SQL, tokens or signed URLs in stdout/journal.
                raise BackupError('Backup operation failed during ' + self.phase + '; see private log') from None


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['init', 'backup', 'backup-if-due', 'status', 'check', 'restore'])
    parser.add_argument('--config', default=str(Path.home() / 'Qognito-Commerce/backup.json'))
    parser.add_argument('--target')
    parser.add_argument('--snapshot', default='latest')
    args = parser.parse_args()
    try:
        result = CommerceBackup(args.config).execute(args.action, args.target, args.snapshot)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as error:
        print(str(error) if isinstance(error, BackupError) else 'Backup configuration failed: ' + type(error).__name__)
        raise SystemExit(1) from None


if __name__ == '__main__':
    main()
