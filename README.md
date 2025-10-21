# AI Model Playground

Compare large language model responses side-by-side with live streaming, latency metrics, and cost estimates. This project contains a NestJS backend and a Next.js frontend that work together to provide a responsive AI comparison experience.

## Features

- 🔁 **Session management** – Create comparison sessions that broadcast the same prompt to multiple models at once.
- ⚡ **Real-time streaming** – Responses stream chunk-by-chunk using Server Sent Events (SSE) so the UI updates instantly.
- 📊 **Metrics dashboard** – Capture completion time, token usage, and estimated costs for every model response.
- 🧰 **Pluggable model registry** – Easily configure OpenAI and Anthropic models (or extend with additional providers).
- 💾 **Session storage** – Persist prompts and results for quick retrieval during the runtime of the server.
- 🖥️ **Modern UI** – A polished Next.js frontend renders markdown responses, highlights status changes, and keeps columns aligned.

## Project structure

```
.
├── backend   # NestJS API for sessions, streaming, and provider integration
├── frontend  # Next.js application for the real-time playground UI
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18+
- pnpm, npm, or yarn package manager
- OpenAI and Anthropic API keys (for real model streaming)

### Backend setup

```bash
cd backend
cp .env.example .env
# edit .env with your API keys and desired overrides
npm install
npm run start:dev
```

The backend exposes the following primary endpoints:

- `GET /sessions/providers` – list available model providers
- `POST /sessions` – start a new comparison session
- `GET /sessions/:id` – fetch session metadata
- `GET /sessions/:id/stream` – SSE stream delivering incremental response chunks, metrics, and status updates

### Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The frontend expects the backend to be running and accessible at the URL defined by `NEXT_PUBLIC_API_BASE_URL`. Open [http://localhost:3000](http://localhost:3000) to use the playground.

### Deployment notes

- **Backend** – deploy to any Node-friendly platform (e.g., Render, Railway). Be sure to set `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `PORT`, and any default model overrides.
- **Frontend** – deploy to Vercel/Netlify. Configure `NEXT_PUBLIC_API_BASE_URL` to point at the deployed backend URL.

### Extending the playground

- Add more model entries to the registry in `backend/src/sessions/providers/providers.registry.ts`.
- Swap out the in-memory session store with a database by implementing a new storage service.
- Connect user authentication or history syncing for persistent comparisons.

## Scripts

### Backend

- `npm run start:dev` – run NestJS in watch mode
- `npm run build` – compile the backend to JavaScript
- `npm run start` – run the compiled backend

### Frontend

- `npm run dev` – start the Next.js development server
- `npm run build` – generate a production build
- `npm run start` – run the production server
- `npm run lint` – run ESLint

## License

MIT
