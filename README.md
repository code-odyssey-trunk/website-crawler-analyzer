# Website Crawler & Analyzer

A full-stack web application that crawls websites and provides detailed analysis including HTML version, heading statistics, link analysis, and more.

---

## Features
- User authentication (JWT)
- Add, view, and manage URLs
- Real-time crawl status updates (WebSocket)
- Dashboard with statistics and search
- Detailed per-URL analysis
- Responsive React frontend
- Go (Gin) backend, MySQL database
- Dockerized for easy setup

---

## Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- (For manual/local dev) Node.js 18+, Go 1.21+, MySQL 8+

---

## Quick Start (Recommended: Docker Compose)

1. **Copy and configure environment variables:**
   ```sh
   cp .env.example .env
   # Edit .env and set strong secrets/passwords
   ```

2. **Build and start all services:**
   ```sh
   docker-compose up --build
   ```
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - MySQL: localhost:3306

3. **Login:**
   - Default admin user: `admin@example.com`
   - Password: set by `ADMIN_PASSWORD` in your `.env` file

---

## Development
- Hot-reload for frontend (Vite) and backend (rebuild required for Go changes)
- Source code is mounted into containers for live editing

---

## Production Build

1. **Build production images:**
   - Update `docker-compose.yml` to use the `prod` target for the frontend (see Dockerfile comments)
   - Set `VITE_API_URL` to the deployed backend URL

2. **Run with Docker Compose:**
   ```sh
   docker-compose -f docker-compose.yml up --build
   ```
   - Frontend will be served by Nginx on port 5173 (update ports as needed)

---

## Manual Local Development (without Docker)

1. **Backend:**
   ```sh
   cd backend
   cp ../.env .env
   go run ./cmd/server/main.go
   ```
2. **Frontend:**
   ```sh
   cd frontend
   cp ../.env .env
   npm install
   npm run dev
   ```
3. **MySQL:**
   - Start MySQL 8+ with credentials from `.env`

---

## Environment Variables
- See `.env.example` for all required variables.
- **Never commit real secrets to git!**
- Add `.env`, `backend/.env`, and `frontend/.env` to your `.gitignore`.

---

## Security Notes
- Change all default passwords and secrets before deploying.
- Use strong, unique values for `JWT_SECRET` and `ADMIN_PASSWORD`.
- For production, do not expose database ports to the public.

---

## Testing
- Frontend: `cd frontend && npm run test`
- Backend: Add Go tests as needed (see `*_test.go` files)

---

## License
MIT
