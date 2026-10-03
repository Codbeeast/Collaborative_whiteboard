# 🎨 Real-Time Collaborative Whiteboard

A high-performance, multi-user real-time collaborative whiteboard built with **Next.js**, **HTML5 Canvas**, **WebSockets (Socket.io)**, **Redis**, and **PostgreSQL**.

---

## 🏗️ Architecture Overview

The system is engineered using a **two-tier state architecture**:
- **Hot Ephemeral Layer (Redis)**: Sub-millisecond element state caching, atomic updates, presence tracking (live cursors), and multi-instance Pub/Sub broadcasting.
- **Cold Durable Layer (PostgreSQL)**: Permanent relational storage for user profiles, boards, and versioned canvas snapshots stored in native indexed `JSONB`.

```
┌────────────────────────────────────────────────────────┐
│               Browser Clients (Next.js)                │
│  - 60fps Canvas Loop (World vs Screen Matrix)          │
│  - Remote Cursor Interpolation (Throttled 30Hz)        │
│  - Local Undo/Redo Action Manager                      │
└──────────────────────────┬─────────────────────────────┘
                           │ WebSockets (Socket.io)
┌──────────────────────────▼─────────────────────────────┐
│          Modular Real-Time Gateway (Node.js)           │
│  - Room Management & Client Onboarding                 │
│  - Drawing Event Ingestion & Broadcaster               │
│  - Debounced Snapshot Flush Service (Write-Behind)     │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
┌──────────────▼─────────────┐   ┌────────▼──────────────┐
│       Redis (Docker)       │   │  PostgreSQL (Docker)  │
│  - Hot Element Hashes      │   │  - Users & Boards     │
│  - Ephemeral Cursors (TTL) │   │  - JSONB Snapshots    │
│  - Cross-Worker Pub/Sub    │   │  - GIN Deep Indexing  │
└────────────────────────────┘   └───────────────────────┘
```

---

## 🧩 Single Responsibility Principle (SRP) Module Design

Every module in this codebase has a **single responsibility** and **one reason to change**:

### Backend Modules (`server/`)
| Module | File | Single Responsibility | Reason to Change |
| :--- | :--- | :--- | :--- |
| **Config Loader** | `server/config/env.ts` | Validates and exports typed environment variables | Environment variable schema changes |
| **Redis Connection** | `server/redis/client.ts` | Manages Redis connection lifecycle & reconnection | Redis host/auth/reconnect policy changes |
| **Redis Board Store** | `server/redis/boardStore.ts` | Performs atomic element CRUD on Redis hashes | Redis data structure or serialization changes |
| **PostgreSQL Client** | `server/db/client.ts` | Connection pool lifecycle for Postgres | Database driver or pool sizing changes |
| **Board Repository** | `server/db/boardRepository.ts` | SQL queries for boards & JSONB snapshots | Database schema or snapshot query changes |
| **Snapshot Service** | `server/services/snapshotService.ts` | Debounced flush of Redis elements to PostgreSQL | Snapshot interval or persistence trigger rules change |
| **Room Handler** | `server/socket/handlers/roomHandler.ts` | Manages user join/leave lifecycle & room state dispatch | Room onboarding or initial state flow changes |
| **Drawing Handler** | `server/socket/handlers/drawingHandler.ts` | Ingests element creation/mutations and broadcasts to peers | Element action types or validation changes |
| **Presence Handler** | `server/socket/handlers/presenceHandler.ts` | Tracks cursor positions and user selection awareness | Ephemeral cursor throttle or presence data structure changes |
| **Yjs CRDT Handler** | `server/socket/handlers/yjsHandler.ts` | Exchanges state vectors and broadcasts binary diff updates | Yjs sync protocol step handling changes |
| **Yjs Server Store** | `server/crdt/crdtStore.ts` | Persists Y.Doc binary states to Redis and PostgreSQL | CRDT serialization or storage format changes |
| **Yjs Doc Manager** | `server/crdt/serverDocManager.ts` | Maintains authoritative in-memory room Y.Docs | Room CRDT document lifecycle changes |
| **Socket Gateway** | `server/socket/socketServer.ts` | Initializes Socket.io server and attaches handlers | WebSocket transport middleware or CORS changes |

### Frontend Modules (`src/`)
| Module | File | Single Responsibility | Reason to Change |
| :--- | :--- | :--- | :--- |
| **Types Contract** | `src/types/canvas.ts`, `socket.ts` | Canonical TypeScript interfaces for elements & events | Domain data model changes |
| **Viewport Math** | `src/canvas/viewport.ts` | Screen-to-world & world-to-screen coordinate math | Pan/zoom transform formulas change |
| **Element Renderer** | `src/canvas/renderer.ts` | Pure rendering functions for vector shapes on 2D context | Visual styling or shape drawing logic changes |
| **History Manager** | `src/canvas/historyManager.ts` | Per-user undo/redo stack calculation | History limit or action inversion rules change |
| **Tool Interface** | `src/canvas/tools/BaseTool.ts` | Tool contract defining mouse/pointer lifecycle | Common tool lifecycle methods change |
| **Tool Implementations** | `src/canvas/tools/*.ts` | Specific behavior for Hand, Pencil, Rect, Diamond, Circle, Arrow, Text, Sticky, Eraser | Individual tool interaction behavior changes |
| **Yjs Client Manager**| `src/crdt/yDocManager.ts` | Manages local Y.Doc, elements Y.Map, and Y.UndoManager | Local CRDT transaction/undo rules change |
| **Yjs Sync Hook** | `src/hooks/useYjsWhiteboard.ts` | Binds Y.Doc with Socket.io 2-step sync and awareness | Real-time CRDT sync handshake changes |
| **Socket Hook** | `src/hooks/useWhiteboardSocket.ts` | Manages Socket.io client connection & room events | Client-server communication event handling changes |
| **Presence Component**| `src/components/canvas/RemoteCursors.tsx` | Smoothly renders collaborator cursors & name tags | Remote cursor visual appearance changes |
| **Toolbar Component** | `src/components/toolbar/Toolbar.tsx` | Floating tool selector with keyboard shortcuts and context hints | Tool actions or layout changes |
| **Controls Component**| `src/components/footer/CanvasControls.tsx` | Bottom-left zoom controls and undo/redo pill widgets | Zoom or undo/redo controls change |

---

## 🐳 Docker Setup (Redis & PostgreSQL)

Both databases run in lightweight Docker containers with data persistence:

### 1. Start Services
```bash
docker compose up -d
```

### 2. Verify Containers
```bash
docker compose ps
```
- **PostgreSQL**: `localhost:5433` (Database: `whiteboard_db`, User: `postgres`, Password: `postgres`)
- **Redis**: `localhost:6379` (Password: `redispassword`)

### 3. Stop Services
```bash
docker compose down
```

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` (pre-configured for Docker defaults):
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📝 Project Summary & Change Log

All modifications to this project are systematically tracked below:

| Timestamp (UTC) | Category | Summary of Changes | Modules Affected |
| :--- | :--- | :--- | :--- |
| 2026-10-02 Initial | Infrastructure | Added `docker-compose.yml` for Redis 7 and PostgreSQL 16 with healthchecks and persistent volumes. | `docker-compose.yml` |
| 2026-10-02 Initial | Database | Created `init-db.sql` schema with JSONB snapshot storage, UUID primary keys, and GIN index. | `init-db.sql` |
| 2026-10-02 Initial | Environment | Created `.env.example` and `.env` template with decoupled Redis and PostgreSQL connection variables. | `.env.example`, `.env` |
| 2026-10-02 Initial | Documentation | Established Single Responsibility Principle (SRP) module directory and architecture specification. | `README.md` |
| 2026-10-02 Completed | Domain Types | Defined TypeScript contracts for elements, tools, viewport coordinates, and Socket.io events. | `src/types/canvas.ts`, `src/types/socket.ts`, `src/types/user.ts` |
| 2026-10-02 Completed | Server Database | Implemented PostgreSQL pool manager and BoardRepository with JSONB snapshot persistence. | `server/db/client.ts`, `server/db/boardRepository.ts` |
| 2026-10-02 Completed | Server Redis | Implemented Redis connection manager with in-memory fallback and atomic element hash store. | `server/redis/client.ts`, `server/redis/boardStore.ts` |
| 2026-10-02 Completed | Background Service | Created debounced write-behind snapshot service flushing Redis board states to PostgreSQL. | `server/services/snapshotService.ts` |
| 2026-10-02 Completed | WebSocket Gateway | Built Socket.io handlers for room lifecycle, element mutations, and live presence. | `server/socket/handlers/`, `server/socket/socketServer.ts` |
| 2026-10-02 Completed | Master Server | Bootstrapped Next.js HTTP server + Socket.io with graceful shutdown hooks. | `server/server.ts` |
| 2026-10-02 Completed | Canvas Engine | Implemented infinite world-to-screen viewport matrix and pure 2D CanvasRenderer. | `src/canvas/viewport.ts`, `src/canvas/renderer.ts` |
| 2026-10-02 Completed | Canvas Tools | Created modular tools: `PencilTool`, `ShapeTool`, `SelectTool`, `EraserTool`, `BaseTool`. | `src/canvas/tools/*.ts` |
| 2026-10-02 Completed | History & Undo | Implemented user-scoped `HistoryManager` with Undo (Ctrl+Z) and Redo (Ctrl+Y). | `src/canvas/historyManager.ts` |
| 2026-10-02 Completed | Real-time Sync | Built `useWhiteboardSocket` client hook and 30Hz throttled cursor presence broadcaster. | `src/hooks/useWhiteboardSocket.ts` |
| 2026-10-02 Completed | UI Components | Built `WhiteboardCanvas`, `RemoteCursors`, `Toolbar`, `StylePanel`, and `RoomHeader`. | `src/components/*` |
| 2026-10-02 Completed | App Router Pages | Created landing dashboard (`/`) and dynamic collaborative room (`/board/[roomId]`). | `src/app/page.tsx`, `src/app/board/[roomId]/page.tsx` |
| 2026-10-02 Completed | Security / Auth | Configured Redis authentication with `--requirepass redispassword`, updated docker healthchecks, and wired `REDIS_PASSWORD` in configs. | `docker-compose.yml`, `.env`, `.env.example`, `server/config/env.ts` |
| 2026-10-02 Completed | CRDT (Yjs) | Integrated Yjs CRDT engine with binary 2-step state vector sync, transactional `Y.Map`, `Y.UndoManager`, and Redis update persistence. | `src/crdt/*`, `src/hooks/useYjsWhiteboard.ts`, `server/crdt/*`, `server/socket/handlers/yjsHandler.ts` |
| 2026-10-02 Fixed | Canvas Viewport | Fixed vertical/horizontal stroke offset bug on high-DPI and Windows-scaled displays by incorporating `devicePixelRatio` into `ViewportTransform.applyTransform`. | `src/canvas/viewport.ts`, `src/components/canvas/WhiteboardCanvas.tsx` |
| 2026-10-02 Redesigned | UI & Clean Aesthetics | Complete UI redesign matching reference design: light aesthetic, responsive non-overlapping layout, floating toolbar with shortcut keys (`V`, `R`, `D`, `O`, `A`, `L`, `P`, `T`, `N`, `E`), dedicated **Text tool (`T`)** with inline text editor, diamond shape, hand pan tool, bottom-left zoom & undo/redo pills, and light-theme style panel. | `src/components/toolbar/*`, `src/components/header/*`, `src/components/footer/*`, `src/canvas/tools/TextTool.ts`, `src/components/canvas/WhiteboardCanvas.tsx` |
| 2026-10-03 Configured | Docker & DB Connectivity | Booted Docker Desktop, mapped PostgreSQL to port `5433:5432` to resolve Windows host service collision, and verified live connection to Docker PostgreSQL and Redis containers. | `docker-compose.yml`, `.env`, `.env.example`, `server/config/env.ts` |
| 2026-10-03 Cleaned | Git Ignore & Repository | Configured production `.gitignore` excluding `.next/`, `node_modules/`, `.env`, log files, and TypeScript build cache, and purged cached build artifacts from the repository index. | `.gitignore` |



