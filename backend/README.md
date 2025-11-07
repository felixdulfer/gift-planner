# Gift Planner Backend

A Go backend API for the Gift Planner application using Gin framework, PostgreSQL with GORM, and WebAuthn authentication.

## Features

- RESTful API with Gin framework
- PostgreSQL database with GORM ORM
- WebAuthn passwordless authentication
- Automatic database migrations
- Docker support

## Prerequisites

- Go 1.23 or later
- PostgreSQL 16 or later
- Docker and Docker Compose (for containerized setup)

## Setup

### Local Development

1. Install dependencies:
```bash
go mod tidy
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Ensure PostgreSQL is running and accessible

4. Run the server:
```bash
go run main.go
```

The server will start on port 8080 by default.

### Docker Setup

See the main `docker-compose.yml` in the project root for running the full stack.

## API Endpoints

### Authentication (WebAuthn)

- `POST /api/auth/register/begin` - Begin WebAuthn registration
- `POST /api/auth/register/finish` - Complete WebAuthn registration
- `POST /api/auth/login/begin` - Begin WebAuthn login
- `POST /api/auth/login/finish` - Complete WebAuthn login

### Users

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### Groups

- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create a group
- `GET /api/groups/:id` - Get group by ID
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Group Members

- `GET /api/groups/:groupId/members` - List group members
- `POST /api/groups/:groupId/members` - Add member to group
- `DELETE /api/groups/:groupId/members/:memberId` - Remove member from group

### Events

- `GET /api/groups/:groupId/events` - List events in a group
- `POST /api/groups/:groupId/events` - Create an event
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Receivers

- `GET /api/events/:eventId/receivers` - List receivers for an event
- `POST /api/events/:eventId/receivers` - Create a receiver
- `GET /api/receivers/:id` - Get receiver by ID
- `PUT /api/receivers/:id` - Update receiver
- `DELETE /api/receivers/:id` - Delete receiver

### Wishlists

- `GET /api/receivers/:receiverId/wishlists` - List wishlists for a receiver
- `POST /api/receivers/:receiverId/wishlists` - Create a wishlist
- `GET /api/wishlists/:id` - Get wishlist by ID
- `PUT /api/wishlists/:id` - Update wishlist
- `DELETE /api/wishlists/:id` - Delete wishlist

### Gifts

- `GET /api/wishlists/:wishlistId/gifts` - List gifts in a wishlist
- `POST /api/wishlists/:wishlistId/gifts` - Create a gift
- `GET /api/gifts/:id` - Get gift by ID
- `PUT /api/gifts/:id` - Update gift
- `DELETE /api/gifts/:id` - Delete gift

### Gift Assignments

- `GET /api/gifts/:giftId/assignments` - List assignments for a gift
- `POST /api/gifts/:giftId/assignments` - Create a gift assignment
- `PUT /api/assignments/:id` - Update gift assignment
- `DELETE /api/assignments/:id` - Delete gift assignment

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 8080)
- `ENVIRONMENT` - Environment (development/production)
- `WEBAUTHN_RP_ID` - WebAuthn Relying Party ID
- `WEBAUTHN_RP_ORIGIN` - WebAuthn Relying Party Origin
- `WEBAUTHN_RP_NAME` - WebAuthn Relying Party Name
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)

## Project Structure

```
backend/
├── main.go                 # Application entry point
├── internal/
│   ├── auth/              # Authentication (WebAuthn)
│   ├── config/            # Configuration management
│   ├── database/         # Database models and migrations
│   ├── handlers/         # HTTP request handlers
│   └── router/            # Route setup
└── Dockerfile             # Docker build file
```

## Development

### Running Tests

```bash
go test ./...
```

### Building

```bash
go build -o backend main.go
```

### Database Migrations

Migrations are handled automatically by GORM's AutoMigrate feature. For production, consider using a dedicated migration tool like `golang-migrate`.

## License

See main project LICENSE file.

