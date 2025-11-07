# Development Mode

Run the development stack with hot reload:

```bash
docker compose -f docker-compose.dev.yml up
```

This will:
- Mount source code as volumes for live changes
- Use Air for Go backend hot reload
- Use Vite dev server for frontend hot reload
- Keep the same database and Adminer setup

## Differences from Production

- **Backend**: Uses `Dockerfile.dev` with Air for hot reload
- **Frontend**: Uses `Dockerfile.dev` with `bun run dev` instead of build
- **Volumes**: Source code is mounted for live editing
- **Ports**: Frontend runs on 3000 (Vite dev server) instead of 80

## Usage

1. **Start dev stack:**
   ```bash
   docker compose -f docker-compose.dev.yml up
   ```

2. **Start in background:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

3. **View logs:**
   ```bash
   docker compose -f docker-compose.dev.yml logs -f
   ```

4. **Stop:**
   ```bash
   docker compose -f docker-compose.dev.yml down
   ```

## Hot Reload

- **Backend**: Changes to `.go` files will automatically rebuild and restart
- **Frontend**: Changes to source files will trigger Vite HMR (Hot Module Replacement)

## Environment Variables

The dev compose file sets `VITE_API_URL=http://localhost:8080/api` automatically.

## Ports

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Adminer: http://localhost:8081

