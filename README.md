# PathPilot — AI Career Counselor

PathPilot is a full-stack career planning application that helps early-career learners turn their interests and goals into actionable learning plans. It combines a React frontend, an Express API, MongoDB persistence and Groq-powered AI workflows.

## Features

- Account registration, login and protected user data
- Career assessment and AI-generated career recommendations
- Personalized career roadmaps with milestone tracking
- Progress analytics and evidence-aware career intelligence
- Career opportunity search links (external search pages, not verified live vacancies)
- GitHub portfolio analysis
- Project evidence records
- Foundational skill checks
- Browser-based coding challenges (results are explicitly unverified by a trusted server runner)
- Application tracker
- Interview practice with AI feedback and a rule-based fallback

## Repository structure

```text
PathPilot/
├── client/                 # React + Vite frontend
│   ├── src/
│   ├── .env.example
│   └── vercel.json
├── server/                 # Express API
│   ├── src/server.js       # Local server + Vercel Express entry point
│   ├── src/app.js          # Express app and routes
│   ├── src/
│   ├── tests/
│   └── .env.example
├── docs/
├── .gitignore
└── README.md
```

## Run locally

Prerequisites: Node.js 20 or newer, npm, a MongoDB database, and a Groq API key for AI features.

### 1. Configure the backend

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env` and fill in `MONGO_URI`, `JWT_SECRET`, and `GROQ_API_KEY`. Keep `.env` private; it is ignored by Git.

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 2. Configure the frontend

Open a second terminal:

```bash
cd client
npm install
```

The local frontend defaults to `http://localhost:5000/api`. If your API uses another URL, copy `client/.env.example` to `client/.env` and set `VITE_API_URL`.

Start Vite:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Deploy to Vercel

PathPilot uses **one GitHub repository and two Vercel projects**. This keeps the frontend and Express API independently deployable while preserving a single codebase.

### A. Prepare MongoDB Atlas

1. Create or select a MongoDB Atlas cluster.
2. Create a database user with a strong password.
3. Allow network access from your deployment environment. For a portfolio deployment, use the narrowest network access configuration supported by your hosting setup; avoid leaving broad access enabled longer than necessary.
4. Copy the application connection string and replace its username, password and database name.

### B. Deploy the backend

1. Push this repository to GitHub.
2. In Vercel, create a new project and import the repository.
3. Set **Root Directory** to `server`.
4. Vercel should detect the Express app exported from `src/server.js` (the recognized Express entry point). It runs as a Vercel Function; no separate API catch-all file is required.
5. Add these Environment Variables in Vercel:
   - `MONGO_URI`
   - `JWT_SECRET` (at least 32 characters; use a cryptographically random value)
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (optional; defaults to `openai/gpt-oss-20b`)
   - `CORS_ORIGINS` (temporarily include your local origin and add the exact deployed frontend origin after frontend deployment)
   - `NODE_ENV=production`
6. Deploy and note the backend domain, for example `https://pathpilot-api.vercel.app`.
7. Test `https://<backend-domain>/api/health`. A successful response includes `database: "connected"`.

### C. Deploy the frontend

1. Create a second Vercel project using the same GitHub repository.
2. Set **Root Directory** to `client`.
3. Select the Vite framework preset. Build command: `npm run build`. Output directory: `dist`.
4. Add the environment variable:
   - `VITE_API_URL=https://<backend-domain>/api`
5. Deploy and note the frontend domain, for example `https://pathpilot.vercel.app`.

### D. Finalize CORS

1. Return to the backend Vercel project.
2. Set `CORS_ORIGINS` to the exact frontend origin, such as `https://pathpilot.vercel.app`. Add additional preview origins only when needed, separated by commas.
3. Redeploy the backend so the updated environment variable is applied.
4. Open the frontend, register a test account and verify login, profile, assessment, roadmaps and the AI workflows.

### E. GitHub push commands

Run these from the extracted repository root:

```bash
git init
git add .
git status
git commit -m "Prepare PathPilot for production deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repository>.git
git push -u origin main
```

Before committing, inspect `git status` and confirm that no `.env`, API key, `node_modules`, Playwright auth state or test artifacts are staged.

## Testing

Frontend unit tests and production build:

```bash
cd client
npm install
npm test
npm run lint
npm run build
```

Frontend browser tests (requires the app and API running, plus Playwright browser installation):

```bash
npx playwright install chromium
npm run test:e2e
```

Backend API regression tests (run only against a development or staging database you control):

```bash
cd server
npm install
npm run test:api
```

Set `PATHPILOT_API_URL` before running the API suite if the API is not at `http://localhost:5000`. The suite creates test accounts and assessment data in the connected database.

## Important production notes

- Never commit `.env` files or share live JWTs. If a token or secret is exposed, rotate the relevant credential and invalidate affected sessions where possible.
- The current browser authentication design stores a bearer JWT in `localStorage`. This is convenient for the current application but means successful cross-site scripting could expose the token. A future security iteration should migrate the complete frontend/backend flow to secure HttpOnly cookies with CSRF protection.
- Express rate limits currently use the process-local in-memory store. On serverless infrastructure, instances may not share counters. For stronger production abuse protection, configure a shared rate-limit store (for example Redis) before treating these limits as globally enforced.
- Browser coding challenge results are not server-verified. Do not represent them as proof of proficiency.
- Career opportunity links open external search pages. PathPilot does not currently verify individual vacancies or guarantee that a listing is current.
- AI recommendations and interview feedback are guidance, not professional certification or a hiring prediction.
- Vercel Functions are request-driven/serverless. Do not rely on in-memory application state persisting between invocations. MongoDB is the durable data store.

## Documentation

See `docs/DEPLOYMENT.md` for the deployment checklist and `docs/PROJECT_OVERVIEW.md` for the high-level architecture and feature limitations.

See `docs/KNOWN_LIMITATIONS.md` for the current security, AI, evidence and serverless limitations that should be understood before presenting the application as production-grade.
