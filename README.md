# Commercial Account Opening

React UI for a commercial entity account opening workflow, connected to a Node.js
backend.

## Frontend

- `npm install`
- `npm run dev`
- `npm run build`

The Vite dev server proxies `/api` requests to `http://localhost:8080`.

## Node Backend

The backend lives in [server/index.js](/Users/530175/Documents/New project/server/index.js)
and uses Node's built-in HTTP server with SQLite persistence.

Run it with:

- `npm run dev:api`

Available endpoints:

- `GET /api/account-opening/workspace`
- `PUT /api/account-opening/workspace`
- `GET /api/account-opening/health`

The live database is stored in `server/data/corporate-account-opening.sqlite`.
If `server/data/workspace-store.json` exists, the server uses it only as a one-time seed
when the SQLite database is empty.
