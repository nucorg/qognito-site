"""Store a Stripe live server key locally without echoing it or using shell history."""
from getpass import getpass
from pathlib import Path
import os
import re

target = Path(__file__).resolve().parent.parent / ".env.stripe-live"
if target.exists():
    raise SystemExit("Le fichier .env.stripe-live existe déjà ; aucune modification effectuée.")
key = getpass("Collez la clé serveur Stripe LIVE (saisie masquée), puis Entrée : ").strip()
if not re.fullmatch(r"(?:sk|rk)_live_[A-Za-z0-9]+", key):
    raise SystemExit("Clé refusée : une clé serveur live sk_live_… ou rk_live_… est attendue.")
fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w") as out:
    out.write("STRIPE_SECRET_KEY=" + key + "\n")
print("Clé enregistrée dans .env.stripe-live (privé, ignoré par Git). Aucune requête Stripe effectuée.")
