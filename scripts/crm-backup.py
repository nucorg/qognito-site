#!/usr/bin/env python3
"""Sauvegarde privée Restic ; refuse un support absent et toute restauration écrasante."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from zipfile import ZipFile

parser = argparse.ArgumentParser()
parser.add_argument('action', choices=['init', 'backup', 'check', 'snapshots', 'restore'])
parser.add_argument('--config', type=Path, default=Path.home() / 'Qognito-CRM/backup.json')
parser.add_argument('--target', type=Path)
parser.add_argument('--snapshot', default='latest')
args = parser.parse_args()
os.umask(0o077)

def fail(message):
    if not os.environ.get('QOGNITO_NO_NOTIFY') and shutil.which('notify-send'):
        subprocess.run(['notify-send', '--urgency=critical', 'Sauvegarde Qognito', message], check=False)
    raise SystemExit(message)

try:
    cfg = json.loads(args.config.expanduser().read_text())
    if not all(cfg.get(key) for key in ('source', 'mount', 'repository', 'password_file')):
        fail('Sauvegarde non configurée : compléter backup.json.')
    source = Path(cfg['source']).expanduser().resolve()
    mount = Path(cfg['mount']).expanduser().resolve()
    repo = Path(cfg['repository']).expanduser().resolve()
    password = Path(cfg['password_file']).expanduser().resolve()
    binary = shutil.which(cfg.get('restic_binary', 'restic'))
    if not binary:
        fail('Restic absent : installer Restic avant activation du timer.')
    if not mount.is_mount():
        fail('Support de sauvegarde absent : aucune écriture effectuée.')
    if repo == mount or not repo.is_relative_to(mount) or repo.is_relative_to(source):
        fail('Le dépôt doit être un sous-dossier dédié du support externe, hors du dossier source.')
    if password.is_relative_to(source) or password.is_relative_to(repo):
        fail('Le mot de passe doit être conservé hors des données et du dépôt sauvegardés.')
    if not password.is_file() or password.stat().st_mode & 0o077:
        fail('Le fichier de mot de passe doit exister avec des permissions 600.')
    if not source.is_dir():
        fail('Dossier source absent.')
    env = dict(os.environ, RESTIC_REPOSITORY=str(repo), RESTIC_PASSWORD_FILE=str(password))

    def run(*command, cwd=None):
        subprocess.run([binary, *command], env=env, cwd=cwd, check=True)

    if args.action == 'init':
        if repo.exists() and any(repo.iterdir()):
            fail('Le dossier du dépôt contient déjà des fichiers : initialisation refusée.')
        run('init')
    elif args.action == 'backup':
        if list(source.glob('.~lock.*')):
            fail('Fermer le tableur LibreOffice avant la sauvegarde ; la prochaine exécution réessaiera.')
        # Sauvegarder une copie stable ; ne jamais inclure les restaurations ou des secrets.
        with tempfile.TemporaryDirectory(prefix='qognito-backup-') as temp:
            staging = Path(temp) / 'Qognito-CRM'
            staging.mkdir()
            for name in ('prospects.ods', 'emails', 'procedures'):
                path = source / name
                if not path.exists():
                    fail(f'Élément attendu absent : {name}')
                if path.is_symlink() or (path.is_dir() and any(p.is_symlink() for p in path.rglob('*'))):
                    fail('Lien symbolique dans les données : sauvegarde refusée pour éviter une copie hors périmètre.')
                if path.is_dir():
                    shutil.copytree(path, staging / name)
                else:
                    before = path.stat()
                    shutil.copy2(path, staging / name)
                    after = path.stat()
                    if (before.st_mtime_ns, before.st_size) != (after.st_mtime_ns, after.st_size):
                        fail('Le tableur a changé pendant la copie : relancer la sauvegarde.')
            with ZipFile(staging / 'prospects.ods') as archive:
                if archive.testzip():
                    fail('Le tableur copié est endommagé : sauvegarde interrompue.')
            run('backup', 'Qognito-CRM', '--host', 'qognito-crm', '--tag', 'qognito-crm', cwd=temp)
        # Les chemins de staging changent : ne pas créer un groupe de rétention par chemin.
        run('forget', '--host', 'qognito-crm', '--tag', 'qognito-crm', '--group-by', 'host,tags', '--keep-within', '90d', '--prune')
        print('Sauvegarde terminée. Historique de 90 jours appliqué.')
    elif args.action == 'check':
        run('check', '--read-data')
    elif args.action == 'snapshots':
        run('snapshots', '--host', 'qognito-crm', '--tag', 'qognito-crm')
    elif args.action == 'restore':
        if not args.target or args.target.expanduser().exists():
            fail('Restauration refusée : --target doit désigner un dossier neuf.')
        run('restore', args.snapshot, '--host', 'qognito-crm', '--tag', 'qognito-crm', '--target', str(args.target.expanduser().resolve()))
        print('Restauration de contrôle créée. Réappliquer suppressions et oppositions avant utilisation.')
except (OSError, ValueError, subprocess.CalledProcessError) as error:
    fail(f'Sauvegarde interrompue ({type(error).__name__}). Consulter le journal ; aucun succès confirmé.')
