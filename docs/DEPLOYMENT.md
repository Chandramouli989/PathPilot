# PathPilot Deployment Checklist

## Before GitHub

- [ ] `server/.env` and `client/.env` are not staged.
- [ ] No `node_modules`, `dist`, `.vercel`, Playwright auth state or test artifacts are staged.
- [ ] `.env.example` contains placeholders only.
- [ ] Frontend tests, lint and production build have been run locally.
- [ ] Backend API tests have been run against a disposable development/staging database.

## Vercel project 1 — Backend

- Repository: same PathPilot GitHub repository
- Root Directory: `server`
- Express entry point: `src/server.js` exports the Express app; Vercel runs it as a Function
- Environment: `MONGO_URI`, `JWT_SECRET`, `GROQ_API_KEY`, optional `GROQ_MODEL`, `CORS_ORIGINS`, `NODE_ENV`
- Verify: `https://<backend-domain>/api/health`

## Vercel project 2 — Frontend

- Repository: same PathPilot GitHub repository
- Root Directory: `client`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment: `VITE_API_URL=https://<backend-domain>/api`

## After both deployments

- [ ] Add the exact frontend origin to backend `CORS_ORIGINS` and redeploy backend.
- [ ] Register a new test account.
- [ ] Log out and log back in.
- [ ] Save and update a profile.
- [ ] Create and update a career assessment.
- [ ] Generate recommendations and a roadmap.
- [ ] Update a roadmap milestone.
- [ ] Add and edit project evidence.
- [ ] Complete a skill check.
- [ ] Save a coding challenge attempt; verify the UI labels it browser-executed/unverified.
- [ ] Create and update an application.
- [ ] Evaluate an interview answer; verify AI/fallback source is displayed.
- [ ] Check browser console and Vercel function logs for errors.

## Rollback

Vercel keeps previous deployments. If a deployment fails, promote the last known-good deployment while investigating logs. Do not delete the previous working deployment until the new one has passed the live smoke test.
