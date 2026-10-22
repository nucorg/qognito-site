#!/usr/bin/env python3
"""Second, independent copy of the commerce backup: restic copy from the SSD repository to Google Drive.

Reads the SSD repository, writes only to the off-site repository. Same password as the SSD repository.
"""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import shutil
import subprocess

OFFSITE_DEFAULT = 'rclone:drive-pro:Qognito-Commerce-restic'   # Drive root, outside every rsync --delete mirror
POLICY = ['forget', '--host', 'qognito-commerce', '--tag', 'production', '--group-by', 'host,tags', '--keep-within', '90d']


class OffsiteError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise OffsiteError(message)


def save(path, data):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.chmod(0o600)
    temporary.replace(path)


class Offsite:
    def __init__(self, config):
        self.cfg = json.loads(Path(config).read_text())
        self.root = Path(self.cfg['private_dir']).expanduser().resolve()
        require(self.root.is_dir() and self.root.stat().st_mode & 0o077 == 0, 'Private directory permissions')
        self.source = Path(self.cfg['repository']).resolve()
        self.mount = Path(self.cfg['mount']).resolve()
        self.password = Path(self.cfg['password_file']).resolve()
        self.target = self.cfg.get('offsite_repository', OFFSITE_DEFAULT)
        self.state_path = self.root / 'offsite-status.json'
        self.state = json.loads(self.state_path.read_text()) if self.state_path.exists() else {}
        self.log = self.root / ('offsite-' + dt.date.today().strftime('%Y%m%d') + '.log')
        self.phase = 'initialization'

    def run(self, args, env=None, timeout=1800):
        result = subprocess.run([str(a) for a in args], env=env, capture_output=True, timeout=timeout)
        # Commands are not logged: arguments may include sensitive destinations.
        with self.log.open('ab') as stream:
            stream.write(result.stdout + result.stderr)
        require(result.returncode == 0, 'Command failed during ' + self.phase)
        return result.stdout

    def validate(self):
        require(self.mount.is_mount(), 'Backup SSD is not mounted')
        actual = self.run(['/usr/bin/findmnt', '-n', '-o', 'UUID', '--target', self.mount]).decode().strip()
        require(actual == self.cfg['mount_uuid'], 'Wrong backup SSD')
        require(self.password.is_file() and self.password.stat().st_mode & 0o077 == 0, 'Password file permissions')
        require(self.target.startswith('rclone:'), 'Off-site repository must be an rclone remote')

    def restic(self, *args):
        env = dict(os.environ, RESTIC_REPOSITORY=self.target, RESTIC_PASSWORD_FILE=str(self.password),
                   RESTIC_FROM_REPOSITORY=str(self.source), RESTIC_FROM_PASSWORD_FILE=str(self.password))
        return self.run([self.cfg['restic'], '--retry-lock', '30m', *args], env=env)

    def snapshots(self, repository):
        env = dict(os.environ, RESTIC_REPOSITORY=repository, RESTIC_PASSWORD_FILE=str(self.password))
        out = self.run([self.cfg['restic'], '--retry-lock', '30m', 'snapshots', '--json', '--tag', 'production'], env=env)
        return {s['id'] for s in json.loads(out or b'[]')}

    def execute(self, action):
        if action == 'status':
            return self.state
        try:
            self.validate()
            if action == 'init':
                self.phase = 'off-site init'
                self.restic('init', '--copy-chunker-params')
                return {'initialized': self.target}
            self.phase = 'off-site copy'
            self.restic('copy')
            self.phase = 'off-site retention'
            self.restic(*POLICY, '--prune')
            self.phase = 'off-site check'
            self.restic('check', *(['--read-data'] if action == 'check' else []))
            count = len(self.snapshots(self.target))
            require(count > 0, 'Off-site repository is empty')
            self.state.update(last_success_at=dt.datetime.now(dt.timezone.utc).isoformat(),
                              snapshots=count, read_data=action == 'check', last_error=None)
            save(self.state_path, self.state)
            return self.state
        except Exception as error:
            self.state.update(last_error={'at': dt.datetime.now(dt.timezone.utc).isoformat(), 'phase': self.phase,
                              'reason': str(error) if isinstance(error, OffsiteError) else type(error).__name__})
            save(self.state_path, self.state)
            if shutil.which('notify-send') and not os.environ.get('QOGNITO_NO_NOTIFY'):
                subprocess.run(['notify-send', '--urgency=critical', 'Copie distante du commerce Qognito',
                                'Échec pendant ' + self.phase + '. Consulter le statut privé.'], capture_output=True)
            raise


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['init', 'copy', 'check', 'status'],
                        help='copy: daily copy + retention + structure check; check: same with --read-data')
    parser.add_argument('--config', default=str(Path.home() / 'Qognito-Commerce/backup.json'))
    args = parser.parse_args()
    try:
        print(json.dumps(Offsite(args.config).execute(args.action), ensure_ascii=False))
    except Exception as error:
        # No raw provider errors or destinations in stdout/journal.
        print(str(error) if isinstance(error, OffsiteError) else 'Off-site copy failed: ' + type(error).__name__)
        raise SystemExit(1) from None


if __name__ == '__main__':
    main()
