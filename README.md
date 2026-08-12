# GrantWeave

A team of six autonomous agents that finds, screens, and drafts federal grant applications for under-resourced nonprofits.

## The agent team

Each agent owns one responsibility and hands off to the next. All six live in [`backend/agents/`](backend/agents/) and stream their reasoning to the UI live, attributed by agent.

| Agent | Responsibility |
|---|---|
| **Planner** ([`planner.ts`](backend/agents/planner.ts)) | Interprets the org's funding goal and produces a multi-angle search plan, informed by what the Learning Agent recorded last run |
| **Discovery** ([`discovery.ts`](backend/agents/discovery.ts)) | Executes the plan across two real sources in parallel — the live Grants.gov API and a FAISS semantic index — then de-duplicates |
| **Eligibility** ([`eligibility.ts`](backend/agents/eligibility.ts)) | Pulls each opportunity's **real structured record** and applies deterministic rules before any LLM judgement |
| **Application** ([`application.ts`](backend/agents/application.ts)) | Maps the profile onto the actual SF-424 federal fields, drafts the narrative, and flags what it cannot derive |
| **Recovery** ([`recovery.ts`](backend/agents/recovery.ts)) | Diagnoses *why* a round underperformed and chooses a fix: broaden, relax budget, switch source, or accept |
| **Learning** ([`learning.ts`](backend/agents/learning.ts)) | Converts the run into reusable advice so the next Planner run starts smarter |

Orchestrated by [`orchestrator.ts`](backend/agents/orchestrator.ts):
`Planner → Discovery → Eligibility → (Recovery ⟲ re-plan) → Application → Learning`

## LLM providers

The agents are provider-agnostic (`backend/agents/llm.ts`). A full run costs ~4 requests.
Set one key in `backend/.env`; the first provider with credentials wins, or pin one with `LLM_PROVIDER`.

| Provider | Free tier | Speed (full run) | Notes |
|---|---|---|---|
| **Groq** (recommended) | ~1k–14k req/day **per key** | ~10–20s | Fastest. Free key at [console.groq.com](https://console.groq.com/keys) |
| OpenRouter | varies, `:free` models | ~30s | Many models behind one key |
| Cerebras | free tier | fast | — |
| Ollama | unlimited, local | ~3–5 min | No key, fully offline; slow on laptop hardware |
| Gemini | **20 req/day per model** | ~60–90s | Runs out after ~3 runs; best judgement quality |

Within a provider the client walks a (key × model) grid, so a spent key or a retired model id
falls through to the next pair instead of failing the run.

**Quality tradeoff worth knowing:** Gemini scores grant relevance more strictly than the Groq
models, which tend to cluster scores near the top. Two mitigations run regardless of provider:
scoring is **batched** (8 grants per call — large batches make models collapse onto one score),
and a **deterministic category guard** caps any score where the funder's own Grants.gov activity
categories don't overlap the organization's domain. A typical run caps ~12 such scores.

## What makes the screening real

Eligibility is **not** an LLM guessing. The Grants.gov detail API returns structured fields, so these checks are deterministic and auditable:

- **Applicant type** — the org's category is matched against the funder's actual `applicantTypes` codes
- **Award floor / ceiling** — screened against the org's real budget capacity
- **Deadline** — closed opportunities are rejected
- **Staleness** — notices posted years ago with no close date are treated as dormant
- **Cost sharing** — flagged as a matching-funds obligation

Only candidates that survive these rules are sent to the LLM for mission-fit scoring. A typical run disqualifies ~40% of candidates on hard rules alone, with the reason stated ("award floor too high × 10").

## What this system does *not* do

It does not submit to Grants.gov. Federal submission requires an authenticated Grants.gov Workspace tied to your SAM.gov registration and UEI, certified by your Authorized Organization Representative. GrantWeave prepares the package and tells you exactly which fields only a human can supply (UEI, EIN, AOR signature, congressional district) rather than inventing them. Export the package and submit it from your own Workspace.

Frontend (Vite + React) and backend (Express + WebSocket) in separate folders.

## Project structure

- **`frontend/`** – Vite + React app (port 5173 in dev)
- **`backend/`** – Express API + WebSocket server (port 3001); the six agents live in `backend/agents/`
- **`ml/`** – FastAPI + FAISS semantic matcher (port 8000) over ~1,000 **currently-open** opportunities. `build_index.py` filters out anything already closed, so the Discovery Agent never surfaces a grant you can't apply to. Rebuild with `python build_index.py` after updating `funding-opportunities.csv`.

## Run locally

**Prerequisites:** Node.js, Python 3

1. **Install dependencies**
   ```bash
   npm run install:all
   python3 -m venv ml/venv && ml/venv/bin/pip install -r ml/requirements.txt
   ```

2. **Environment**
   - **Backend:** copy `backend/.env.example` → `backend/.env` and set one LLM key
     (`GROQ_API_KEY` recommended — see the provider table above).
   - **Frontend:** copy `frontend/.env.example` → `frontend/.env` and add your Firebase config.

3. **Build the semantic index** (once, and again whenever `funding-opportunities.csv` changes):
   ```bash
   npm run build:index
   ```

4. **Start everything** — one command, starts all three services and frees stale ports first:
   ```bash
   npm run dev          # → http://localhost:5173  (Ctrl-C stops all three)
   ```

   | Command | Purpose |
   |---|---|
   | `npm run dev` | ML (:8000) + backend (:3001) + frontend (:5173) |
   | `npm run stop` | Kill anything left on those ports |
   | `npm run dev:ml` / `dev:backend` / `dev:frontend` | Run one service alone |
   | `npm run build:index` | Rebuild the FAISS index from the CSV |

   If you see `EADDRINUSE`, a previous run is still holding the port — `npm run stop` clears it.

5. **Production**
   - Build frontend: `npm run build` (output in `frontend/dist/`)
   - Run backend with `NODE_ENV=production`; it serves `frontend/dist` and handles `/api` and WebSocket on one port.

## Scripts (root)

| Script           | Description                          |
|------------------|--------------------------------------|
| `npm run dev`    | Run backend + frontend together     |
| `npm run dev:backend`  | Run backend only (port 3001)  |
| `npm run dev:frontend` | Run frontend only (port 5173) |
| `npm run build`  | Build frontend to `frontend/dist`   |
| `npm run start`  | Run backend only (for production)   |
