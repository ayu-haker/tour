# Docker Image Building Instructions

This document provides step-by-step instructions for building and deploying the TOUR application using Docker.

## Prerequisites

- **Docker** (version 20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (optional, for multi-container setups)
- **Git** (to clone the repository)

## Quick Start

### 1. Clone or Pull the Repository

```bash
git clone https://github.com/ayu-haker/tour
cd tour
```

### 2. Create .env File

```bash
cp .env.example .env
```

Or create `.env` with these values:

```env
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root123
DB_NAME=tour_app
PORT=8080
NODE_ENV=production
```

### 3. Build and Start with Docker Compose (Recommended)

```bash
docker compose down -v
docker compose up --build
```

### 4. Verify Services

```bash
docker compose ps
```

You should see:

- `tour-mysql` - MySQL 8.0 database
- `tour-app` - Node.js application

### 5. Check Logs

```bash
docker compose logs -f
```

The app will be available at:

- **Frontend:** `http://localhost:8080`
- **Health Check:** `http://localhost:8080/health`
- **API:** `http://localhost:8080/api`

## Standalone Docker Build

### Build the Image Only

```bash
docker build -t tour-app:latest .
```

### Run the Container (Standalone)

```bash
docker run -p 8080:8080 \
  -e DB_HOST=mysql \
  -e DB_PORT=3306 \
  -e DB_USER=root \
  -e DB_PASSWORD=root123 \
  -e DB_NAME=tour_app \
  tour-app:latest
```

Note: For standalone mode, you need MySQL running separately.

## Docker Compose Commands

### Start Services

```bash
docker compose up -d
```

### Stop Services

```bash
docker compose down
```

### Stop and Remove Volumes (Fresh Start)

```bash
docker compose down -v
```

### Rebuild and Start

```bash
docker compose down -v
docker compose up --build
```

### View Logs

```bash
docker compose logs -f app
docker compose logs -f mysql
```

### Execute Command in Container

```bash
docker compose exec app sh
docker compose exec mysql mysql -u root -proot123
```

## MySQL Database

### Default Credentials

```yaml
MYSQL_ROOT_PASSWORD: root123
MYSQL_DATABASE: tour_app
MYSQL_USER: tour_user
MYSQL_PASSWORD: tour_pass123
```

### Initialize Database

Tables are auto-created via `init.sql`. If you need to manually initialize:

```bash
docker compose exec app npx tsx server/init-db.ts
```

### Access MySQL

```bash
docker compose exec mysql mysql -u root -proot123 tour_app
```

### Backup Database

```bash
docker compose exec mysql mysqldump -u root -proot123 tour_app > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker compose exec -T mysql mysql -u root -proot123 tour_app
```

## Default Admin User

```
Username: admin
Password: admin@1234
Email: admin@tour.local
```

### Test Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin@1234"}'
```

## Troubleshooting

### Build Fails

```bash
docker builder prune
docker compose build --no-cache
```

### Container Exits Immediately

```bash
docker compose logs app
```

### MySQL Connection Issues

The app has automatic retry logic (10 attempts, 5s delay).

```bash
docker compose ps mysql
docker compose logs mysql
docker compose exec mysql mysql -u root -proot123 -e "SELECT 1;"
```

### Port Already in Use

```bash
netstat -ano | findstr :8080
```

Or change port in docker-compose.yml:

```yaml
ports:
  - "3000:8080"
```

## Environment Variables

### App Configuration

| Variable    | Default    | Description      |
| ----------- | ---------- | ---------------- |
| PORT        | 8080       | Application port |
| NODE_ENV    | production | Environment mode |
| DB_HOST     | mysql      | MySQL hostname   |
| DB_PORT     | 3306       | MySQL port       |
| DB_USER     | root       | MySQL user       |
| DB_PASSWORD | root123    | MySQL password   |
| DB_NAME     | tour_app   | Database name    |

### API Keys (Optional)

```env
VITE_PUBLIC_BUILDER_KEY=__BUILDER_PUBLIC_KEY__
SUPABASE_URL=
SUPABASE_ANON_KEY=
OPENAI_API_KEY=
AVIATIONSTACK_KEY=
RAPIDAPI_KEY=
```

## Image Tags and Versioning

```bash
docker build -t tour-app:latest .
docker build -t tour-app:v1.0.0 .
docker build -t myregistry.azurecr.io/tour-app:latest .
```

## Push to Container Registry

### Docker Hub

```bash
docker login
docker tag tour-app:latest username/tour-app:latest
docker push username/tour-app:latest
```

### Azure Container Registry

```bash
az acr login --name myregistry
docker tag tour-app:latest myregistry.azurecr.io/tour-app:latest
docker push myregistry.azurecr.io/tour-app:latest
```

## Cleanup

```bash
docker container prune
docker image prune
docker system prune -a
```

## File Structure

```
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Service orchestration
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Environment template
├── init.sql             # Database initialization
├── .dockerignore        # Excluded files from build
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   └── node-build.ts    # Production build entry
└── client/              # React frontend
```

---

**Last Updated**: 2025
**Dockerfile Location**: `./Dockerfile`
**Docker Compose**: `./docker-compose.yml`
**Application Port**: 8080
