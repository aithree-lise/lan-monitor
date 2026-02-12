# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-02-12

### Added
- **Infrastructure as Code (IaC Phase 1)**
  - Version endpoint: `GET /api/version` returns build metadata (version, commit, buildTime, nodeVersion)
  - Automated deployment script: `deploy.sh` with healthcheck and rollback instructions
  - Deployment documentation: `DEPLOYMENT.md` with manual and automated workflows
- **Kanban Board**
  - Full CRUD API for tickets: `/api/tickets`
  - Ticket lanes: backlog, inprogress, review, done
  - Agent assignment and status tracking
- **Ideas System**
  - Full CRUD API for ideas: `/api/ideas`
  - Idea review workflow (proposed → approved/rejected/deferred)
  - Idea-to-ticket conversion: `POST /api/ideas/:id/convert`
- **System Monitoring**
  - System info panel: Uptime, Disk Usage, RAM, CPU Load
  - Agent status reporting via Redis
- **Testing & QA**
  - E2E test suite with Playwright (43 tests: API, Dashboard, Kanban, Ideas)
  - Shell-based E2E tests for backend validation

### Changed
- Dockerfile: Now accepts build args (VERSION, COMMIT, BUILD_TIME) for version metadata
- Switched to trunk-based development (single `main` branch)

### Fixed
- Routing issues for individual ticket/idea fetches (`GET /api/tickets/:id`, `GET /api/ideas/:id`)
- SQL timestamp bug in agent reporter (`datetime("now")` instead of `datetime(now)`)

## [1.0.0] - 2026-02-10

### Added
- **Initial MVP Release**
- **Dashboard**
  - Real-time GPU monitoring (utilization, memory, temperature, power)
  - Services status display (Conduit, Ollama, Mac minis)
  - Uptime history visualization
- **Ollama Integration**
  - Model status display
  - API endpoint: `GET /api/services` for Ollama models
- **Backend API**
  - GPU data endpoint: `GET /api/gpu`
  - Services health checks: `GET /api/services`
  - Service history tracking
- **Frontend**
  - React-based dashboard with dark theme
  - Responsive design (mobile, tablet, desktop)
  - Auto-refresh (30s interval)
- **Infrastructure**
  - Docker containerization (multi-stage build)
  - NVIDIA GPU support in containers
  - SQLite database for persistent storage
  - Production-ready deployment on Spark (192.168.27.30:8080)

### Technical Stack
- **Frontend:** React, Vite
- **Backend:** Node.js 22, Express
- **Database:** SQLite (better-sqlite3)
- **Infrastructure:** Docker, NVIDIA CUDA base image
- **Deployment:** Manual Docker workflow

---

## Release Guidelines

### Versioning
- **Major (x.0.0):** Breaking changes, significant architectural shifts
- **Minor (1.x.0):** New features, backwards-compatible
- **Patch (1.1.x):** Bug fixes, minor improvements

### Release Process
1. Update this CHANGELOG.md with new version and changes
2. Create git tag: `git tag v1.x.0`
3. Push tag: `git push origin v1.x.0`
4. Deploy with: `./deploy.sh v1.x.0`
5. Verify via: `curl http://localhost:8080/api/version`
