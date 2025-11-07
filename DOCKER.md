# Gift Planner - Docker Compose Quick Reference

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Adminer**: http://localhost:8081

## Database Access (Adminer)

- **System**: PostgreSQL
- **Server**: postgres
- **Username**: giftplanner
- **Password**: giftplanner
- **Database**: giftplanner

## Backend Development

```bash
cd backend
make run
```

## Frontend Development

```bash
bun run dev
```

## Environment Variables

Edit `docker-compose.yml` or create `backend/.env` for backend configuration.

