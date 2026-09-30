import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from xml.etree import ElementTree
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]

class CRMTests(unittest.TestCase):
    def test_private_workbook_and_existing_data_preserved(self):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp) / 'CRM'
            command = ['python3', str(ROOT / 'scripts/init-crm.py'), '--directory', str(directory)]
            subprocess.run(command, check=True, capture_output=True)
            workbook = directory / 'prospects.ods'
            self.assertEqual(directory.stat().st_mode & 0o777, 0o700)
            self.assertEqual(workbook.stat().st_mode & 0o777, 0o600)
            with ZipFile(workbook) as z:
                self.assertIsNone(z.testzip())
                root = ElementTree.fromstring(z.read('content.xml'))
                tables = root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table')
                self.assertEqual(len(tables), 3)
            workbook.write_bytes(b'Existing user data')
            subprocess.run(command, check=True, capture_output=True)
            self.assertEqual(workbook.read_bytes(), b'Existing user data')

    def test_unconfigured_backup_refuses_to_write(self):
        with tempfile.TemporaryDirectory() as tmp:
            config = Path(tmp) / 'backup.json'
            config.write_text(json.dumps({'source': tmp, 'mount': '', 'repository': '', 'password_file': ''}))
            result = subprocess.run(['python3', str(ROOT / 'scripts/crm-backup.py'), 'backup', '--config', str(config)], capture_output=True, text=True, env={**os.environ, 'QOGNITO_NO_NOTIFY': '1'})
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('non configurée', result.stderr)
            self.assertEqual(len(list(Path(tmp).iterdir())), 1)

if __name__ == '__main__':
    unittest.main()
