# Arbeitspakete — LAN Monitor Erweiterungen

## AP1: DGX Spark GPU Monitor (Prio: Hoch)

**Ziel:** GPU-Daten vom Spark im Dashboard anzeigen.

**Umsetzung:**
1. Neuen Service-Typ `ssh-command` in `server/checks.js` hinzufügen
2. Per SSH `nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader` auf 192.168.27.30 ausführen
3. Neues API-Endpoint: `GET /api/gpu`
4. Neue Frontend-Komponente `GpuCard.jsx` — zeigt GPU Usage %, Temperatur, VRAM als Balken
5. Card im Dashboard-Grid einbauen

**Hinweis:** SSH-Key muss im Docker-Container verfügbar sein (Volume Mount).

---

## AP2: Ollama Model Status (Prio: Hoch)

**Ziel:** Zeigen welche Modelle geladen sind.

**Umsetzung:**
1. Zusätzlicher Check in `checks.js`: `GET http://192.168.27.30:11434/api/ps` (laufende Modelle)
2. Ollama-Service-Card erweitern: neben Status auch geladene Modelle anzeigen
3. Modellname + VRAM-Verbrauch pro Modell

---

## AP3: Uptime History (Prio: Mittel)

**Ziel:** Statusverlauf der letzten 24h pro Service.

**Umsetzung:**
1. `server/history.js` erstellen — speichert Check-Ergebnisse in JSON-Datei
2. Jeder Check-Zyklus schreibt Timestamp + Status
3. Neues Endpoint: `GET /api/services/:id/history?hours=24`
4. Frontend: Mini-Balkendiagramm unter jeder ServiceCard (grün/rot Segmente)
5. Persistentes Volume im Docker für die History-Daten

---

## AP4: Alerts bei Ausfall (Prio: Mittel)

**Ziel:** Matrix-Nachricht in #lise wenn ein Service ausfällt.

**Umsetzung:**
1. `server/alerts.js` — vergleicht aktuellen Status mit vorherigem
2. Bei Statuswechsel up → down: Matrix-Nachricht an #lise senden
3. Conduit API: `POST /_matrix/client/v3/rooms/{roomId}/send/m.room.message`
4. Config: Matrix-Token als ENV-Variable im Container

---

## AP5: Docker Container Overview (Prio: Niedrig)

**Ziel:** Alle Docker-Container auf dem Spark anzeigen.

**Umsetzung:**
1. Neuer Check-Typ `docker` in `checks.js`
2. Per SSH: `docker ps --format json` auf dem Spark
3. Eigene Section im Dashboard unter den Service-Cards

---

## Reihenfolge

AP1 → AP2 → AP3 → AP4 → AP5

## Rollen

- **Siegbert Schnösel 🎩** — Architektur, Review, PO
- **Eugene Krabs 🦀** — Implementation
- **Bubble Bass 🥒** — Support/Dev (nach Zuweisung)
