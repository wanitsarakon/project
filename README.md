# Thai Festival Project

Thai Festival Project is a multiplayer festival game platform with a React + Phaser frontend and a Go backend. Players can create or join rooms, wait in a realtime lobby, move through a festival map, play a sequence of mini games, and finish with a score summary and prize flow.

## Highlights

- Host and player flow from landing page to lobby, festival map, and summary
- Realtime room updates over WebSocket
- Host-selectable booth sequence for each session
- Score tracking, room progress, and final summary endpoints
- Optional private rooms and editable prize lists

## Tech Stack

- Frontend: React 18, Vite 5, Phaser 3
- Backend: Go 1.23, Gin, Gorilla WebSocket
- Database: PostgreSQL

## Project Structure

```text
project/
|- Frontend/            # React + Vite + Phaser client
|- backend/             # Go API + WebSocket + PostgreSQL
|- package.json         # Repository metadata only
`- README.md
```

## Mini Games

- `FishScoopingScene`
- `HorseDeliveryScene`
- `BoxingGameScene`
- `CookingGameScene`
- `BalloonShootScene`
- `DollGameScene`
- `FlowerGameScene`
- `HauntedHouseScene`
- `TugOfWarScene`
- `WorshipBoothScene`

`WorshipBoothScene` is treated as the closing booth and is automatically appended to the selected booth sequence.

## Prerequisites

- Node.js 18+
- Go 1.23+
- PostgreSQL

## Getting Started

### 1. Create the database schema

Apply the SQL files in `backend/migrations` in order:

```bash
psql -U postgres -d thai_festival -f backend/migrations/001_create_tables.sql
psql -U postgres -d thai_festival -f backend/migrations/002_update_players_table.sql
```

### 2. Start the backend

Examples below use PowerShell.

```powershell
Set-Location backend
go mod download
$env:DATABASE_URL="postgres://postgres:password@localhost:5432/thai_festival?sslmode=disable"
$env:PORT="18082"
go run .
```

Notes:

- If `PORT` is not set, the backend defaults to `18082`.
- If `DATABASE_URL` is not set, the backend falls back to `postgres://postgres:1111@localhost:5432/thai_festival?sslmode=disable`.
- CORS currently allows `localhost` and `127.0.0.1` origins.

### 3. Start the frontend

```powershell
Set-Location Frontend
npm install
$env:VITE_API_URL="http://127.0.0.1:18082"
npm run dev
```

Notes:

- The frontend also falls back to `http://127.0.0.1:18082` when `VITE_API_URL` is not set in the main game pages.
- You can keep local frontend env values in `Frontend/.env.local`.

## Useful Commands

### Frontend

```powershell
Set-Location Frontend
npm run dev
npm run build
npm run preview
npm run crop:horse
```

### Backend

```powershell
Set-Location backend
go run .
go test ./...
```

## API Overview

### REST

- `GET /health`
- `POST /rooms`
- `GET /rooms`
- `GET /rooms/:code`
- `GET /rooms/:code/progress`
- `GET /rooms/:code/summary`
- `POST /rooms/join`
- `POST /rooms/:code/start`
- `POST /rooms/:code/finalize`
- `POST /rooms/:code/games/:game_key/complete`
- `PATCH /rooms/:code/prizes`
- `POST /rooms/:code/round/start`
- `POST /rounds/:round_id/submit`
- `POST /rounds/:round_id/end`

### WebSocket

- `GET /ws/global`
- `GET /ws/:room_code`

## Development Notes

- `Frontend/src/games/festivalBooths.js` is the main booth catalog and sequence source.
- `Frontend/src/App.jsx` supports scene previews through query params such as `?scene=festival-map` and `?scene=horse`.
- Room creation, room browsing, lobby sync, score submission, and summary fetching are wired through the frontend pages in `Frontend/src/pages`.
- The root `package.json` is not the main app entry point. Day-to-day development happens inside `Frontend/` and `backend/`.
