# PathPilot — Technical Overview

## Purpose

PathPilot helps learners organize career exploration into an assessment, recommendations, learning roadmaps, practical evidence, skill checks, interview practice and an application tracker.

## High-level architecture

```text
React + Vite (client)
        |
        | HTTPS JSON requests (Axios + bearer JWT)
        v
Express API (server)
        |
        +---- Authentication middleware (JWT)
        |
        +---- Controllers
        |       +---- Mongoose models -> MongoDB Atlas
        |       +---- Shared AI service -> Groq API
        |       +---- GitHub service -> GitHub public API
        |
        v
JSON response -> React page state -> UI
```

## Main backend responsibilities

- `src/app.js`: creates Express, registers security middleware, API routes and JSON error handling.
- `src/server.js`: starts the local server after MongoDB connects and exports the Express app that Vercel detects.
- `src/app.js`: creates Express, connects to MongoDB before serving routes, and registers security middleware, API routes and JSON error handling.
- `src/middleware/authMiddleware.js`: verifies the bearer JWT and attaches the authenticated user ID to `req.user`.
- `src/middleware/securityMiddleware.js`: configures Helmet, CORS and process-local rate limits.
- `src/controllers/`: contains request validation, database operations and API responses for each feature.
- `src/models/`: defines MongoDB document structures and validation rules.
- `src/services/aiService.js`: centralizes Groq client access, model selection, timeout configuration and JSON response parsing.

## Main frontend responsibilities

- `src/main.jsx`: mounts React, BrowserRouter and AuthProvider.
- `src/App.jsx`: declares public and protected routes.
- `src/context/AuthContext.jsx`: restores and manages the signed-in user state.
- `client/src/api/axios.js`: centralizes API base URL, bearer token attachment and 401 handling.
- `src/pages/`: feature-level screens and their user interactions.

## Data ownership

Protected controllers use the authenticated `req.user.userId` when querying or mutating user-owned documents. They should not trust a user ID supplied by the browser. Continue preserving this rule for new endpoints.

## Trust and product limitations

- AI output is generated guidance and is not independently fact-checked by PathPilot.
- Interview fallback feedback is heuristic/rule-based and must be distinguished from Groq feedback.
- Skill checks are short foundational multiple-choice checks, not certifications.
- Project evidence is user-entered and is not independently verified.
- Coding challenges execute in the browser and are not trusted server-side assessments.
- Opportunity cards link to external search pages, not verified individual vacancies.
- The readiness/alignment indicators are product heuristics, not hiring predictions or proof of proficiency.

## Authentication note

The current implementation uses a one-day HS256 JWT stored in browser `localStorage` and sent as an Authorization bearer header. The backend excludes password hashes from ordinary user queries and explicitly selects the hash only for login. The localStorage design has an XSS exposure trade-off; an HttpOnly-cookie migration with CSRF protection should be treated as a coordinated future change, not a partial patch.
