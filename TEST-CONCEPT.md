# LAN Monitor — Test Konzept

## Ziel
Sicherstellen dass der LAN Monitor korrekt funktioniert: Services werden gecheckt, Status wird angezeigt, UI ist responsive.

---

## Test-Bereiche

### 1. Backend Tests (API)

#### 1.1 Health Check Endpoint
**Endpoint:** `GET /api/health`

**Test:**
```bash
curl http://localhost:8080/api/health
```

**Erwartung:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T14:45:00Z"
}
```

**Erfolgskriterium:** Status 200, JSON mit `status: ok`

---

#### 1.2 Services List
**Endpoint:** `GET /api/services`

**Test:**
```bash
curl http://localhost:8080/api/services
```

**Erwartung:**
```json
{
  "services": [
    {
      "id": "conduit",
      "name": "Conduit",
      "url": "192.168.27.30:6167",
      "status": "online",
      "responseTime": 6,
      "lastCheck": "2026-02-10T14:45:00Z"
    },
    // ...
  ]
}
```

**Erfolgskriterium:** 
- Status 200
- Array mit allen Services
- Jeder Service hat: id, name, url, status, responseTime, lastCheck

---

#### 1.3 Service Down Detection
**Test:** Stoppe Conduit, dann:
```bash
curl http://localhost:8080/api/services
```

**Erwartung:** Conduit status = `"down"`, responseTime = `null`

**Erfolgskriterium:** API erkennt down-Services korrekt

---

### 2. Frontend Tests (UI)

#### 2.1 Rendering Test
**Test:** Browser öffnen auf `http://localhost:8080`

**Erwartung:**
- Header wird angezeigt (Titel + Timestamp)
- Service Grid mit Cards
- Alle Services sichtbar
- Status Icons korrekt (✅/❌)

**Erfolgskriterium:** UI lädt ohne Fehler, alle Elemente sichtbar

---

#### 2.2 Auto-Refresh Test
**Test:** 
1. Browser auf Dashboard lassen
2. Service stoppen (z.B. Ollama)
3. Nach 30s → UI sollte roten Status zeigen

**Erfolgskriterium:** UI aktualisiert sich automatisch alle 30s

---

#### 2.3 Manual Refresh Test
**Test:**
1. Service stoppen
2. Refresh-Button klicken
3. Status sollte sofort aktualisiert werden

**Erfolgskriterium:** Button triggert sofortigen API-Call

---

#### 2.4 Responsive Test
**Test:** Browser-Fenster verkleinern (Mobile-Size)

**Erwartung:** Grid wechselt von 3 Spalten → 1 Spalte

**Erfolgskriterium:** Layout passt sich an, keine horizontale Scrollbar

---

#### 2.5 Service Details Test
**Test:** Auf eine Service-Card klicken

**Erwartung:** Details-Panel öffnet sich mit:
- Status
- URL
- Response Time
- Uptime
- Last Check

**Erfolgskriterium:** Details werden korrekt angezeigt, Close-Button funktioniert

---

### 3. Integration Tests

#### 3.1 Full Stack Test
**Test:** Docker Container starten und alle Features durchgehen:
1. Container hochfahren: `docker-compose up`
2. Browser auf `http://192.168.27.30:8080`
3. Alle Services sollten grün sein
4. Einen Service stoppen
5. Nach 30s sollte Status rot werden
6. Service wieder starten
7. Nach 30s sollte Status grün werden

**Erfolgskriterium:** Ende-zu-Ende Flow funktioniert

---

#### 3.2 Multi-User Test
**Test:** aithree, eugene, byte öffnen gleichzeitig das Dashboard

**Erwartung:** Alle sehen die gleichen Status-Daten

**Erfolgskriterium:** Keine Race Conditions, Daten konsistent

---

### 4. Load Test (optional)

**Test:** 100 gleichzeitige API-Calls simulieren:
```bash
ab -n 1000 -c 100 http://localhost:8080/api/services
```

**Erwartung:** Server antwortet ohne Timeout

**Erfolgskriterium:** <200ms Durchschnitt, keine Errors

---

## Test-Ablauf (Checkliste)

### Phase 1: Backend
- [ ] `/api/health` returns 200
- [ ] `/api/services` returns valid JSON
- [ ] Down services are detected correctly

### Phase 2: Frontend
- [ ] UI renders correctly
- [ ] Auto-refresh works (30s)
- [ ] Manual refresh works
- [ ] Responsive layout works
- [ ] Service details work

### Phase 3: Integration
- [ ] Full stack test passes
- [ ] Multi-user test passes

### Phase 4: Edge Cases
- [ ] All services down → UI shows all red
- [ ] All services up → UI shows all green
- [ ] Mixed status → UI reflects correctly

---

## Testdurchführung

**Wer testet was:**
- **eugene** (Builder): Unit Tests + Frontend Tests während Dev
- **byte** (ich): Integration Tests + Backend Tests
- **aithree**: UI/UX Review + Responsive Test

**Tools:**
- curl (API Tests)
- Browser DevTools (Frontend Tests)
- Apache Bench (Load Test, optional)

**Timeline:**
1. eugene baut MVP
2. byte testet Backend/API
3. aithree testet Frontend/UX
4. Gemeinsamer Integration Test
5. Deploy auf Spark

---

## Success Criteria

✅ Alle Services werden korrekt gemonitort  
✅ Status-Änderungen werden erkannt (<30s)  
✅ UI ist responsive und funktional  
✅ Keine Crashes oder Errors  
✅ Multi-User ready  

Wenn alle Criteria erfüllt sind → **READY FOR PRODUCTION**
