# Web URL Validation and Phishing Detection System

A full-stack educational project that validates URLs using regular expressions and deterministic rule-based analysis. It classifies submitted URLs as **Valid**, **Suspicious**, or **Invalid**, explains the reasons, and stores analysis history in MongoDB when configured.

## Technology
- React + Vite (frontend)
- Node.js + Express (REST API)
- MongoDB + Mongoose (persistent history)
- JavaScript regular expressions and a deterministic finite-state scanner

## Run in GitHub Codespaces

1. Open the repository in a Codespace.
2. In the terminal:
   ```bash
   npm run install:all
   ```
3. Copy `server/.env.example` to `server/.env`.
4. Add your MongoDB connection string to `MONGO_URI` (MongoDB Atlas is suitable). If omitted, the app uses temporary in-memory history for demonstration.
5. Start both applications:
   ```bash
   npm run dev
   ```
6. Open the forwarded port **5173** (Vite frontend). The API runs on port **5000**.

## Production deployment
Deploy `server` as a Node web service and `client` as a static site. Set the frontend environment variable `VITE_API_URL` to the deployed backend URL plus `/api`. Set `MONGO_URI` on the backend. Configure the backend `CLIENT_ORIGIN` to the deployed frontend origin.

## API
- `GET /api/health` – API status
- `POST /api/analyze` – analyze `{ "url": "https://example.com" }`
- `GET /api/history` – latest analysis records
- `DELETE /api/history/:id` – delete a saved record (MongoDB records)

## Important
This is a classroom demonstration and heuristic checker, not a commercial anti-phishing service. It does not browse to submitted URLs or guarantee that a URL is safe. A result of **Valid** means the URL passed the implemented format and heuristic checks, not that the website is trustworthy.
