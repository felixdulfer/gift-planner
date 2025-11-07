# Gift Planner - Full Stack Setup

This project includes a Go backend API and a React frontend, all containerized with Docker.

## Quick Start

1. **Start all services:**
```bash
docker-compose up -d
```

2. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Adminer (Database UI): http://localhost:8081

3. **Stop all services:**
```bash
docker-compose down
```

## Services

### Frontend
- **Port:** 3000
- **Technology:** React + TanStack Router + Tailwind CSS
- **Build:** Vite
- **Web Server:** Nginx

### Backend
- **Port:** 8080
- **Technology:** Go + Gin framework
- **Database:** PostgreSQL with GORM
- **Authentication:** WebAuthn

### Database
- **Port:** 5432
- **Type:** PostgreSQL 16
- **Credentials:** 
  - User: `giftplanner`
  - Password: `giftplanner`
  - Database: `giftplanner`

### Adminer
- **Port:** 8081
- **Purpose:** Database administration UI
- **Connection:** Use `postgres` as server name, `giftplanner` as username/password/database

## Development

### Backend Development

```bash
cd backend
go mod tidy
go run main.go
```

### Frontend Development

```bash
bun install
bun run dev
```

## Environment Variables

Backend environment variables can be set in `backend/.env` or via `docker-compose.yml`.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `WEBAUTHN_RP_ID` - WebAuthn Relying Party ID (use `localhost` for local dev)
- `WEBAUTHN_RP_ORIGIN` - WebAuthn origin (e.g., `http://localhost:3000`)
- `JWT_SECRET` - Secret for JWT tokens (change in production!)

## Database Migrations

Migrations run automatically on backend startup using GORM's AutoMigrate feature.

## WebAuthn Setup

For WebAuthn to work properly:

1. Ensure `WEBAUTHN_RP_ID` matches your domain (use `localhost` for local development)
2. Ensure `WEBAUTHN_RP_ORIGIN` matches your frontend URL
3. Use HTTPS in production (WebAuthn requires secure context)

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL container is healthy: `docker-compose ps`
- Check logs: `docker-compose logs postgres`

### Backend Issues
- Check logs: `docker-compose logs backend`
- Verify environment variables are set correctly

### Frontend Issues
- Check logs: `docker-compose logs frontend`
- Ensure backend is accessible from frontend container

## Production Considerations

1. Change all default passwords and secrets
2. Use environment-specific configuration
3. Enable HTTPS for WebAuthn
4. Set up proper database backups
5. Use a reverse proxy (nginx/traefik) for production
6. Set up monitoring and logging
7. Use managed database service for production

