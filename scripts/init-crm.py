#!/usr/bin/env python3
"""Crée un suivi LibreOffice privé et vierge, sans écraser de fichier existant."""
import argparse
import json
import os
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZipFile, ZIP_STORED, ZIP_DEFLATED

parser = argparse.ArgumentParser()
parser.add_argument('--directory', type=Path, default=Path.home() / 'Qognito-CRM')
args = parser.parse_args()
os.umask(0o077)
root = args.directory.expanduser().resolve()
root.mkdir(mode=0o700, parents=True, exist_ok=True)
for folder in ('emails', 'procedures', 'restaurations'):
    (root / folder).mkdir(mode=0o700, exist_ok=True)

def write_new(path, text):
    try:
        with path.open('x', encoding='utf-8') as f:
            f.write(text)
    except FileExistsError:
        pass

tables = {
    'Prospects': [['Identifiant demande', 'Date réception', 'Email', 'Prénom', 'Entreprise', 'Fonction', 'Source', 'Échange demandé (oui/non)', 'Notice version', 'Statut', 'Dernière interaction du prospect', 'Prochaine action', 'Échéance action', 'Échéance suppression', 'Notes utiles']],
    'Oppositions': [['Email', 'Date opposition', 'Échéance suppression (3 ans)', 'Effacement prestataires demandé le', 'Effacement confirmé le']],
    'Guide': [
        ['Règle', 'Application'],
        ['Traitement quotidien', 'Reporter les demandes reçues ; dédupliquer par identifiant puis email. Archiver les emails utiles en .eml dans emails/.'],
        ['Sans échange demandé', 'Ne pas prospecter. Supprimer sous 30 jours dans le tableau et la messagerie, y compris corbeille.'],
        ['Échange demandé', 'Contacter sous deux jours ouvrés. Supprimer après 12 mois sans interaction du prospect, sauf relation contractuelle.'],
        ['Statuts', 'nouveau | à contacter | échange engagé | opportunité | clos'],
        ['Opposition', 'Inscrire uniquement les informations minimales dans Oppositions. Vérifier cet onglet avant toute relance et après restauration.'],
        ['Web3Forms', 'Le prestataire peut conserver les demandes jusqu’à trois ans. Traiter séparément les suppressions auprès de lui.'],
        ['Texte non fiable', 'Coller les champs en texte uniquement. Ne pas autoriser de formule, macro ou lien externe issu d’un formulaire.'],
        ['Sauvegardes', 'Consulter procedures/UTILISATION.md. Aucun backup automatique actif avant configuration et premier test de restauration.'],
    ],
}
def cell(value):
    return '<table:table-cell office:value-type="string"><text:p>' + escape(value) + '</text:p></table:table-cell>'
body = ''.join('<table:table table:name="' + title + '"><table:table-column table:number-columns-repeated="' + str(len(rows[0])) + '"/>' + ''.join('<table:table-row>' + ''.join(map(cell, row)) + '</table:table-row>' for row in rows) + '</table:table>' for title, rows in tables.items())
content = '<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2"><office:body><office:spreadsheet>' + body + '</office:spreadsheet></office:body></office:document-content>'
ods = root / 'prospects.ods'
if not ods.exists():
    with ZipFile(ods, 'x') as archive:
        archive.writestr('mimetype', 'application/vnd.oasis.opendocument.spreadsheet', compress_type=ZIP_STORED)
        archive.writestr('content.xml', content, compress_type=ZIP_DEFLATED)
        archive.writestr('META-INF/manifest.xml', '<?xml version="1.0"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/></manifest:manifest>')

write_new(root / 'backup.json', json.dumps({
    'source': str(root), 'mount': '', 'repository': '',
    'password_file': '', 'restic_binary': 'restic',
}, ensure_ascii=False, indent=2) + '\n')
write_new(root / 'procedures/UTILISATION.md', '''# Suivi des demandes du livre blanc

Ouvrir `prospects.ods` avec LibreOffice. Ce fichier est la base de travail ; les emails sont les pièces de réception. Aucun contact réel n’est préchargé.

## Chaque jour

1. Lire la boîte liée à Web3Forms et son dossier spam. Une réponse API positive confirme la prise en charge par le service, pas la livraison effective du mail.
2. Copier les données utiles en **texte uniquement**, dédupliquer par identifiant de demande puis email et vérifier l’onglet Oppositions.
3. Cocher « oui » uniquement si l’email reçu indique explicitement une demande d’échange. Ne pas déduire un accord de l’existence d’un téléchargement.
4. Calculer l’échéance : réception + 30 jours sans échange ; dernière interaction du prospect + 12 mois avec échange. Une relance sortante ne réinitialise pas cette durée.
5. Enregistrer puis fermer le tableur avant la sauvegarde. Les relances sont individuelles ; aucune liste de diffusion automatique.

## Sauvegarde et restauration

Les scripts versionnés sont dans `qognito-site/scripts/`. `crm-backup.py` refuse de fonctionner si aucun dépôt et support monté ne sont configurés. Il utilise Restic, chiffre les sauvegardes et conserve un historique maximal de 90 jours. Ne pas sauvegarder sur le même disque que le PC.

Configurer `backup.json` selon `docs/publication-livre-blanc.md`. Garder le mot de passe dans un gestionnaire de mots de passe et une copie de récupération séparée du PC et des disques. Le fichier de mot de passe ne doit pas être inclus dans la sauvegarde.

Tester une restauration initiale, puis chaque trimestre dans un dossier neuf. Vérifier que LibreOffice ouvre le fichier et comparer le nombre de lignes. Avant tout usage commercial, réappliquer les suppressions et oppositions intervenues après la date restaurée, en consultant le registre courant ou les demandes récentes conservées séparément. Une restauration ne doit pas réactiver une personne opposée.

Une deuxième sauvegarde hebdomadaire doit être conservée sur un autre support, dans un autre lieu. Si aucun deuxième support n’est configuré, le dispositif n’est pas redondant.

## Chaque mois

Filtrer les échéances de suppression ; traiter le tableau, les emails locaux, le webmail et les corbeilles. Demander les suppressions nécessaires à Web3Forms et noter leur confirmation. Vérifier la dernière sauvegarde réussie et les erreurs du journal système.

## Confidentialité

Ce dossier reste hors Git. Les permissions locales restreignent l’accès mais ne chiffrent pas le disque du PC : activer le chiffrement du disque ou d’un volume privé avant d’y stocker de vrais contacts si ce n’est pas déjà fait. Ne jamais publier le tableur, les emails ni les oppositions dans GitHub.
''')
print(f'Suivi local prêt : {ods}')
print('Sauvegarde non activée : renseigner backup.json et effectuer un test de restauration.')
