#!/bin/sh
# This file is part of pi-appliance-pwa <https://github.com/gmoulard/pi-appliance-pwa>.
# Copyright (c) 2026 Guillaume Moulard.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, version 3.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

# Met à jour pi-appliance sur le Pi depuis une session SSH : cherche la
# dernière version publiée sur GitHub, télécharge son archive, la vérifie avec
# sa somme SHA-256, puis l'installe comme le fait la console (« Mon Pi » →
# Mises à jour) : par /usr/local/lib/pi-appliance/updates.sh, qui remet
# l'ancienne version si la nouvelle ne démarre pas dans les 2 minutes.
#
#   sudo sh mettre-a-jour-pi.sh [version] [--forcer]
#
#   version    version à installer, par exemple v0.1.6 (ou 0.1.6) ; sans elle,
#              la dernière version stable publiée. Une version plus ancienne
#              que celle installée est acceptée quand elle est donnée ici.
#   --forcer   réinstaller même si cette version est déjà installée
#
# Pour l'avoir sur le Pi :
#   curl -fsSLO https://raw.githubusercontent.com/gmoulard/pi-appliance-pwa/main/outils/mettre-a-jour-pi.sh
#   sudo sh mettre-a-jour-pi.sh

set -eu

DEPOT=${DEPOT:-gmoulard/pi-appliance}
API=${API:-https://api.github.com/repos/$DEPOT}
UPDATES=${UPDATES:-/usr/local/lib/pi-appliance/updates.sh}
CONSOLE=${CONSOLE:-/usr/local/bin/pi-appliance}
PI_STATE=${PI_STATE:-/var/lib/pi-appliance/system}
ATTENTE=${ATTENTE:-360} # secondes, au plus, pour l'installation
UPGRADE_DIR=$PI_STATE/upgrade
UPGRADE_FILE=$PI_STATE/upgrade.json

dire() { printf '%s\n' "$*"; }
echec() { printf 'Erreur : %s\n' "$*" >&2; exit 1; }

version_voulue=""
forcer=0
while [ $# -gt 0 ]; do
	case "$1" in
	--version) [ $# -ge 2 ] || echec "--version demande un numéro, par exemple v0.1.6."; version_voulue=$2; shift 2 ;;
	--forcer | --force) forcer=1; shift ;;
	-h | --aide | --help) sed -n '/^# Met à jour/,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
	-*) echec "option inconnue : $1 (voir --aide)." ;;
	*)
		[ -z "$version_voulue" ] || echec "une seule version à la fois (« $version_voulue » et « $1 »)."
		version_voulue=$1
		shift
		;;
	esac
done

if [ "$(id -u)" != 0 ]; then
	command -v sudo >/dev/null 2>&1 || echec "lancez ce script en root (sudo)."
	exec sudo DEPOT="$DEPOT" API="$API" UPDATES="$UPDATES" CONSOLE="$CONSOLE" PI_STATE="$PI_STATE" ATTENTE="$ATTENTE" sh "$0" "$@"
fi

for outil in curl jq sha256sum tar; do
	command -v "$outil" >/dev/null 2>&1 || echec "il manque l'outil « $outil » sur ce Pi."
done
[ -x "$UPDATES" ] || echec "pi-appliance n'est pas installé sur ce Pi ($UPDATES introuvable)."
case "$(uname -m)" in
aarch64 | arm64) ;;
*) [ -n "${ARCHI_ESSAI:-}" ] || echec "ce Pi n'est pas en 64 bits (arm64) : pi-appliance ne s'y installe pas." ;;
esac

installee=$("$CONSOLE" -version 2>/dev/null || true)
dire "Version installée : ${installee:-inconnue}"

if [ -n "$version_voulue" ]; then
	saisie=$version_voulue
	case "$version_voulue" in v*) ;; *) version_voulue=v$version_voulue ;; esac
	printf '%s' "$version_voulue" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$' ||
		echec "« $saisie » n'est pas un numéro de version (exemple : v0.1.6)."
	chemin=/releases/tags/$version_voulue
else
	chemin=/releases/latest
fi
dire "Recherche de la version sur GitHub…"
json=$(curl -fsSL --retry 3 --max-time 60 -H "Accept: application/vnd.github+json" -H "User-Agent: pi-appliance" "$API$chemin") ||
	echec "GitHub ne répond pas, ou cette version n'existe pas. Vérifiez la connexion du Pi à internet."
etiquette=$(printf '%s' "$json" | jq -r '.tag_name // ""')
printf '%s' "$etiquette" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$' || echec "numéro de version inattendu : « $etiquette »."
if [ -z "$version_voulue" ] && printf '%s' "$json" | jq -e '.prerelease or .draft' >/dev/null; then
	echec "la dernière version publiée ($etiquette) est une préversion : donnez son numéro en paramètre pour l'installer."
fi
if [ -n "$version_voulue" ]; then dire "Version demandée : $etiquette"; else dire "Dernière version : $etiquette"; fi

if [ "$forcer" != 1 ] && [ "$etiquette" = "$installee" ]; then
	dire "Le Pi est déjà à jour. (--forcer pour réinstaller cette version.)"
	exit 0
fi
if [ "$forcer" != 1 ] && [ -z "$version_voulue" ] && [ -n "$installee" ] &&
	[ "$(printf '%s\n%s\n' "$installee" "$etiquette" | sort -V | tail -n 1)" = "$installee" ]; then
	dire "La version installée ($installee) est plus récente que la dernière publiée : rien à faire."
	exit 0
fi

if [ "$(jq -r '.state // ""' "$UPGRADE_FILE" 2>/dev/null || true)" = running ] ||
	[ "$(jq -r '.state // ""' "$UPGRADE_FILE" 2>/dev/null || true)" = starting ]; then
	echec "une installation est déjà en cours (par exemple lancée depuis la console). Attendez qu'elle finisse."
fi

nom=pi-appliance-$etiquette-arm64.tar.gz
url=$(printf '%s' "$json" | jq -r --arg n "$nom" '.assets[] | select(.name == $n) | .browser_download_url' | head -n 1)
url_somme=$(printf '%s' "$json" | jq -r --arg n "$nom.sha256" '.assets[] | select(.name == $n) | .browser_download_url' | head -n 1)
[ -n "$url" ] && [ -n "$url_somme" ] ||
	echec "la version $etiquette n'a pas encore son archive pour le Pi ($nom). Elle est peut-être encore en construction : réessayez plus tard."

mkdir -p "$UPGRADE_DIR"
archive=$UPGRADE_DIR/$nom
somme=$archive.sha256
nettoyer() { rm -f "$somme"; }
trap nettoyer EXIT
dire "Téléchargement de $nom…"
curl -fL --progress-bar --retry 3 --max-time 900 -o "$archive.part" "$url" || { rm -f "$archive.part"; echec "le téléchargement a échoué."; }
curl -fsSL --retry 3 --max-time 60 -o "$somme" "$url_somme" || { rm -f "$archive.part"; echec "la somme de contrôle n'a pas pu être téléchargée."; }
attendue=$(awk 'NR == 1 { print $1 }' "$somme")
trouvee=$(sha256sum "$archive.part" | awk '{ print $1 }')
if [ "${#attendue}" != 64 ] || [ "$attendue" != "$trouvee" ]; then
	rm -f "$archive.part"
	echec "l'archive téléchargée ne correspond pas à sa somme de contrôle. Rien n'a été changé."
fi
mv "$archive.part" "$archive"
dire "Archive vérifiée (SHA-256)."

dire "Installation de $etiquette : la console va redémarrer, les services continuent de tourner."
reponse=$("$UPDATES" appliance "$archive" "$etiquette" 2>&1) || {
	message=$(printf '%s' "$reponse" | jq -r '.message // empty' 2>/dev/null || true)
	echec "l'installation n'a pas pu démarrer : ${message:-$reponse}"
}

ecoule=0
while [ "$ecoule" -lt "$ATTENTE" ]; do
	etat=$(jq -r '.state // ""' "$UPGRADE_FILE" 2>/dev/null || true)
	case "$etat" in
	done)
		printf '\n'
		dire "Terminé : pi-appliance $("$CONSOLE" -version 2>/dev/null || echo "$etiquette") est installé."
		exit 0
		;;
	failed)
		printf '\n'
		message=$(jq -r '.message // ""' "$UPGRADE_FILE" 2>/dev/null || true)
		echec "${message:-l'installation a échoué.} Détails : $PI_STATE/upgrade.log"
		;;
	esac
	printf '.'
	sleep 3
	ecoule=$((ecoule + 3))
done
printf '\n'
echec "l'installation n'est pas finie après $ATTENTE secondes. Suivez-la dans la console (Mon Pi → Mises à jour) ou dans $PI_STATE/upgrade.log."
