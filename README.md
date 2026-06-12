# ermes_llm_fe — ShopperGPT frontend

React + Vite webapp for the RRG conversational assistant. The chat panel streams orchestration progress from the **ermes_llm** backend (`ui_mirror_server`) and renders the final answer in a split layout ([`shoppergpt-layout`](https://www.npmjs.com/package/shoppergpt-layout)).

## Stack

| Layer | Tech |
|-------|------|
| UI | React 18, MUI 5, Framer Motion |
| Build | Vite 4, TypeScript |
| Layout | `shoppergpt-layout` (chat / results split) |
| API client | `fetch` + SSE (`eventsource-parser`) |

## Project structure

```
src/
├── ShopperChat.tsx          # Root shell: layout, API wiring, results pane
├── components/
│   ├── ChatUI.tsx           # Chat panel (messages, thinking steps, input)
│   ├── OrchestrationResultView.tsx
│   └── LoaderDots/
├── hooks/
│   ├── useOrchestratorAnswer.ts   # SSE client for POST /answer
│   └── useChatInit.ts             # GET /init session bootstrap
├── utils/
│   ├── apiConfig.ts         # hostEnv → API URL resolution
│   ├── formatting.ts        # Orchestration result → markdown
│   └── modules/markDown.tsx   # Markdown + thinking-step renderer
└── dev/main.tsx             # Local dev entrypoint
```

## Prerequisites

- **Node.js 18+** (recommended; `shoppergpt-layout` warns on Node 16)
- **ermes_llm** backend running the chat API (see below)

## Quick start (local)

### 1. Start the backend

From the `ermes_llm` repo:

```bash
# Option A — Docker
docker compose up -d
docker exec -it <container> bash
make start-chat-api

# Option B — bare metal
cd ermes_llm
pip install -e .
make start-chat-api
```

The API listens on **`http://0.0.0.0:8000`** inside the container. From your host machine use **`http://localhost:8000`** (requires `8000:8000` in `docker-compose.yml`).

Health check:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### 2. Configure the frontend

```bash
cd ermes_llm_fe
cp .env.example .env
```

Set in `.env`:

```env
VITE_API_URL=http://localhost:8000
```

> **Do not commit `.env`** — it may contain secrets. Only `.env.example` is tracked.

### 3. Run the dev server

```bash
npm install
npm run dev
```

Opens **http://localhost:5173** (or the next free Vite port).

Production build:

```bash
npm run build
npm run preview
```

## Connecting to the backend

### API URL resolution

`ShopperChat` resolves the API base URL in this order:

1. `apiUrl` prop (explicit)
2. `hostEnv` prop → `resolveApiUrl()` in `src/utils/apiConfig.ts`
3. `import.meta.env.VITE_API_URL`
4. Fallback: `http://localhost:8000`

| `hostEnv` | Default URL |
|-----------|-------------|
| `local` | `http://localhost:8000` |
| `preprod` | `https://shopper-gateway-dev.redpill.paris` |
| `prod` | `https://shopper-gateway.redpill.paris` |

Example — embed with a custom API:

```tsx
<ShopperChat
  TypoComponent={Typography}
  apiUrl="http://localhost:8000"
/>
```

Example — environment switch:

```tsx
<ShopperChat TypoComponent={Typography} hostEnv="preprod" />
```

### Backend endpoints used

The frontend talks to **`ermes_llm/jobs/ui_mirror_server.py`** (Gradio `ui.py` mirror):

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Health check |
| `GET` | `/init?force=true` | Create session; returns `X-Session-Token` header |
| `POST` | `/tracking/session` | Session tracking (best-effort) |
| `POST` | `/answer` | SSE stream for orchestration + final answer |

#### Session init (`useChatInit`)

```http
GET /init?force=true
Authorization: Bearer <token|empty>
X-Client-Id: shoppergpt
```

Response: `{ "session_id": "..." }` + header `X-Session-Token`.

#### Chat / orchestration (`useOrchestratorAnswer`)

```http
POST /answer
Content-Type: application/json
Authorization: Bearer <session_token>
x-client-id: shoppergpt

{
  "query": "user message",
  "client_id": "shoppergpt"
}
```

**SSE events** (newline escapes use `__NEWLINE__`):

| Event | Payload | Frontend handler |
|-------|---------|------------------|
| `progress` | Cumulative orchestration steps (`_Planification…_`, etc.) | Left panel thinking steps |
| `answer` | Final markdown string | Committed as assistant message |
| `result` | JSON (`final_answer`, `agent_data`, `trace`, …) | Right panel `OrchestrationResultView` |
| `done` | empty | Stream end |

### Request flow

```
User sends message (ChatUI)
        ↓
setQuestion() → useOrchestratorAnswer
        ↓
POST /answer (SSE)
        ↓
progress events → orchestrationProgress → ChatUI thinking steps (left)
        ↓
answer event → answer state → message bubble
        ↓
result event → orchestrationResult → results pane (right)
```

Progress strings are produced server-side in `ermes_llm/orchestration/scheduler.py` (`_Planification…_`, `_Exécution de l'agent …_`).

## UI behaviour

### Split layout

- **Left (chat):** `ChatUI` — conversation, compact “Réflexion…” thinking steps, input.
- **Right (results):** Welcome hero → final orchestration markdown (`OrchestrationResultView`). Vehicle cards / lead forms when tool components are wired.

On mobile, `shoppergpt-layout` can inline results into the chat stream.

### Thinking steps (left panel)

Rendered by `parseOrchestrationProgress(text, "thinking")` in `markDown.tsx`:

- Splits cumulative progress on `\n\n`
- Strips `_italic_` and `` `agent` `` markers for readable labels
- Small muted text (Cursor-style), not shown on the right panel

### Markdown rendering

`parseSimpleMarkdown()` supports: headings, bold/italic, links, bullets, blockquotes, fenced code blocks. Used for chat messages and the results pane.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No (defaults to `http://localhost:8000`) | Base URL of `ui_mirror_server` |

Vite only exposes variables prefixed with `VITE_`. Restart `npm run dev` after changing `.env`.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `Failed to reach API at …/init` | API running? `curl localhost:8000/health`. Docker port `8000:8000` mapped? |
| CORS errors | `ui_mirror_server` enables `allow_origins=["*"]` — if using another API, add CORS |
| Thinking steps on wrong panel | Progress must flow via `orchestrationProgress` → `ChatUI`, not `answer` during load |
| Empty results pane | Wait for `result` SSE event; check browser Network tab for `/answer` stream |
| `0.0.0.0:8000` in browser | Use **`localhost:8000`** — `0.0.0.0` is a bind address, not a client URL |

### Useful logs

**Browser console:** `[ShopperChat] Initializing session…`, `POST …/answer`

**API server:** `make start-chat-api` logs `orchestration.progress`, `orchestration.answer`, etc.

## Related backend commands

```bash
# Gradio UI (reference, port 7860) — not used by this frontend
make start-ui

# HTTP API for this frontend (port 8000)
make start-chat-api
```

## License

MIT
