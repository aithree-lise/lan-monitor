# Deployment Guide — LAN Monitor

## Was läuft wo?

| Service | Host | Port | Container | Image | Volume |
|---------|------|------|-----------|-------|--------|
| LAN Monitor | DGX Spark (192.168.27.30) | 8080 | lan-monitor | lan-monitor:latest | lan-monitor-data |

## Aktuelle Version prüfen

```bash
curl http://192.168.27.30:8080/api/version
```

Liefert: Version, Commit, Build-Zeit, Node-Version.

## Deployment

### Standard (empfohlen)

```bash
ssh andre@192.168.27.30
cd /home/andre/repos/lan-monitor
git pull
./deploy.sh
```

Das Script:
1. Erkennt die Version automatisch (Git-Tag oder Commit)
2. Stoppt den alten Container
3. Baut ein neues Image mit Version-Metadata
4. Startet den neuen Container
5. Prüft per Healthcheck ob alles läuft
6. Zeigt die deployed Version an

### Mit expliziter Version

```bash
./deploy.sh v1.2.0
```

### Manuell (Notfall)

```bash
docker rm -f lan-monitor
docker build -t lan-monitor .
docker run -d --name lan-monitor --runtime=nvidia -p 8080:8080 -v lan-monitor-data:/app/data lan-monitor
```

## Rollback

```bash
# Verfügbare Versionen anzeigen
docker images lan-monitor --format '{{.Tag}} {{.CreatedAt}}'

# Auf bestimmte Version zurückrollen
docker rm -f lan-monitor
docker run -d --name lan-monitor --runtime=nvidia -p 8080:8080 -v lan-monitor-data:/app/data lan-monitor:<version>
```

## Datenbank

SQLite unter `/app/data/lan-monitor.db` (im Docker Volume `lan-monitor-data`).

Backup:
```bash
docker cp lan-monitor:/app/data/lan-monitor.db ./backup-$(date +%Y%m%d).db
```

## Architektur

- **Frontend:** React (Vite), gebaut als statische Files
- **Backend:** Express.js, Port 8080
- **GPU:** NVIDIA Runtime für GPU-Monitoring
- **DB:** SQLite (better-sqlite3) für Tickets, Ideas, Agent-Status, Uptime
