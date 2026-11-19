# PathPilot Frontend

React 19 + Vite frontend for PathPilot.

Run locally:

```bash
npm install
npm run dev
```

The frontend uses `VITE_API_URL` for its backend API base URL. If unset, it defaults to `http://localhost:5000/api` for local development. For Vercel deployment, configure `VITE_API_URL` in the frontend project's environment variables.

See the repository-root `README.md` and `docs/DEPLOYMENT.md` for complete setup and deployment instructions.
