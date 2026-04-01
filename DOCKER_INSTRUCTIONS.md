# Docker Image Building Instructions

This document provides step-by-step instructions for DevOps engineers to build and deploy the Docker image for the TOUR application.

## Prerequisites

Before building the Docker image, ensure you have the following installed:

- **Docker** (version 20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (optional, for multi-container setups)
- **Git** (to clone the repository)
- A terminal/command prompt with Docker access

## Quick Start

### 1. Clone or Pull the Repository

```bash
git clone <repository-url>
cd tour
```

### 2. Build the Docker Image

Build the image with a descriptive tag:

```bash
docker build -t tour-app:latest .
```

**Alternative tags for versioning:**

```bash
docker build -t tour-app:v1.0.0 .
docker build -t tour-app:staging .
docker build -t myregistry.azurecr.io/tour-app:latest .  # For Azure Container Registry
docker build -t gcr.io/my-project/tour-app:latest .     # For Google Container Registry
```

### 3. Verify the Build

Check if the image was created successfully:

```bash
docker images | grep tour-app
```

You should see output similar to:

```
tour-app     latest     abc123def456    5 minutes ago    450MB
```

### 4. Initialize Database & Admin User (First Time Only)

After starting the containers, initialize the database with all required tables and seed the default admin user:

```bash
# Using Docker Compose
docker-compose exec app npx tsx server/init-db.ts

# Or standalone container
docker exec tour-app npx tsx server/init-db.ts
```

This creates:
- Database tables (users, bookings, sessions, transactions, api_logs)
- Default admin user with credentials:
  - **Username:** `admin`
  - **Password:** `admin@1234`
  - **Role:** Admin

After initialization, you should see:
```
✓ MySQL Database connected successfully
✓ Table 'users' created/verified
✓ Table 'sessions' created/verified
✓ Table 'bookings' created/verified
✓ Table 'transactions' created/verified
✓ Table 'api_logs' created/verified
✓ Admin user created
```

## Running the Container

### Basic Execution

```bash
docker run -p 8080:8080 tour-app:latest
```

The application will be available at:
- **Frontend:** `http://localhost:8080`
- **API:** `http://localhost:8080/api`
- **Auth API:** `http://localhost:8080/api/auth/login`

### With Environment Variables

```bash
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  tour-app:latest
```

### Detached Mode (Background)

```bash
docker run -d \
  -p 8080:8080 \
  --name tour-container \
  tour-app:latest
```

View logs:

```bash
docker logs tour-container
docker logs -f tour-container  # Follow logs in real-time
```

## Container Management

### List Running Containers

```bash
docker ps
```

### Stop Container

```bash
docker stop tour-container
```

### Remove Container

```bash
docker rm tour-container
```

### View Container Logs

```bash
docker logs tour-container
docker logs --tail 100 tour-container  # Last 100 lines
```

### Execute Command in Running Container

```bash
docker exec -it tour-container /bin/sh
```

## MySQL Database Setup

### Database Configuration

The application now includes **MySQL 8.4** database support with the following features:

**Environment Variables for MySQL Connection:**

```bash
DB_HOST=localhost          # MySQL hostname
DB_PORT=3306              # MySQL port
DB_USER=root              # Database user
DB_PASSWORD=tourapp123    # Database password
DB_NAME=tour_app          # Database name
```

### Quick Start with Docker Compose (Recommended)

The easiest way to run the app with MySQL is using Docker Compose:

```bash
# 1. Start both app and MySQL
docker-compose up -d

# 2. Wait for MySQL to be ready (check logs)
docker-compose logs -f mysql
# Watch for: "ready for connections"

# 3. Initialize database and create admin user (one-time)
docker-compose exec app npx tsx server/init-db.ts

# 4. Check application logs
docker-compose logs -f app

# 5. Access the application
# Frontend: http://localhost:8080
# Login with: admin / admin@1234
```

**Management Commands:**
```bash
# View logs
docker-compose logs -f app      # App logs
docker-compose logs -f mysql    # MySQL logs

# Stop services
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Restart services
docker-compose restart

# Check running containers
docker-compose ps
```

**What gets created:**
- MySQL database at `localhost:3306` (user: root / pass: tourapp123)
- Tour app at `http://localhost:8080`
- Admin user: `admin` / `admin@1234`
- Persistent volume for database data (`mysql_data`)

### Manual MySQL Setup (If Not Using Docker Compose)

If you prefer to run MySQL separately:

#### Option 1: MySQL Docker Container Only

```bash
docker run -d \
  --name tour-mysql \
  -e MYSQL_ROOT_PASSWORD=tourapp123 \
  -e MYSQL_DATABASE=tour_app \
  -p 3306:3306 \
  -v mysql_data:/var/lib/mysql \
  mysql:8.4-alpine
```

#### Option 2: Local MySQL Installation

If you have MySQL installed locally:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tour_app;"

# (Optional) Create user
mysql -u root -p -e "CREATE USER 'tour_user'@'localhost' IDENTIFIED BY 'tour_pass123';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON tour_app.* TO 'tour_user'@'localhost';"
```

### Initialize Database Tables

After setting up MySQL, initialize the database schema:

```bash
# Using Node.js directly
npx tsx server/init-db.ts

# Or if npm script is available
npm run db:init
```

This creates the following tables:
- **users** - User profiles and authentication
- **bookings** - Flight, train, hotel, cab, food bookings
- **transactions** - Payment transactions
- **api_logs** - API call logging and monitoring

### Verify MySQL Connection

Check if MySQL is running and accessible:

```bash
# Using docker-compose
docker-compose ps

# Direct MySQL connection test
mysql -h 127.0.0.1 -u root -ptourapp123 -e "SELECT 1;"

# From within Docker
docker exec tour-mysql mysql -u root -ptourapp123 -e "SHOW DATABASES;"
```

### Database Backup and Restore

**Backup MySQL data:**

```bash
docker exec tour-mysql mysqldump -u root -ptourapp123 tour_app > backup.sql

# Or with docker-compose
docker-compose exec mysql mysqldump -u root -ptourapp123 tour_app > backup.sql
```

**Restore MySQL data:**

```bash
# From file
docker exec -i tour-mysql mysql -u root -ptourapp123 tour_app < backup.sql

# Or with docker-compose
docker-compose exec -T mysql mysql -u root -ptourapp123 tour_app < backup.sql
```

### Access MySQL Command Line

Connect to MySQL directly from the container:

```bash
# Using docker-compose
docker-compose exec mysql mysql -u root -ptourapp123

# Or standalone container
docker exec -it tour-mysql mysql -u root -ptourapp123

# Once inside MySQL CLI
USE tour_app;
SHOW TABLES;
SELECT * FROM users;
```

## Authentication System

### Default Admin User Credentials

When database is initialized, the following admin account is automatically created:

```
Username: admin
Password: admin@1234
Email: admin@tour.local
Role: Admin
```

### Authentication API Endpoints

After starting the Docker containers, you can test the authentication system:

#### Login Endpoint
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin@1234"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

#### Get Current User
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

#### Register New User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepass123",
    "name": "John Doe"
  }'
```

#### Verify Token
```bash
curl -X GET http://localhost:8080/api/auth/verify \
  -H "Authorization: Bearer <your-token>"
```

### Change Admin Password (Production)

To change the admin password, connect to MySQL and update directly:

```bash
# Using docker-compose
docker-compose exec mysql mysql -u root -ptourapp123 tour_app

# Then run SQL to change password (use proper bcrypt hashing in production):
# UPDATE users SET password_hash = '<new-bcrypt-hash>' WHERE username = 'admin';
```

Or use Node.js script:
```bash
docker-compose exec app node -e "
const bcrypt = require('bcrypt');
const password = 'newpassword@1234';
bcrypt.hash(password, 10).then(hash => console.log(hash));
"
```

### Security Environment Variables

Set these in `docker-compose.yml` or via Docker environment:

```yaml
environment:
  JWT_SECRET: your-super-secure-secret-key-change-in-prod
  JWT_EXPIRY: 7d
```

For Docker run:
```bash
docker run -p 8080:8080 \
  -e JWT_SECRET=your-secure-key \
  tour-app:latest
```

### Database Tables for Authentication

Three main authentication tables are created:

**users table:**
```sql
- id (Primary Key)
- username (Unique)
- email (Unique)
- password_hash (bcrypt)
- name
- phone
- role (user, admin, moderator)
- is_active (boolean)
- last_login (timestamp)
- created_at
- updated_at
```

**sessions table:**
```sql
- id (Primary Key)
- user_id (Foreign Key)
- token (JWT token)
- expires_at
- created_at
```

### Manage Users via Docker

**View all users:**
```bash
docker-compose exec mysql mysql -u root -ptourapp123 tour_app \
  -e "SELECT id, username, email, role, is_active FROM users;"
```

**Disable user account:**
```bash
docker-compose exec mysql mysql -u root -ptourapp123 tour_app \
  -e "UPDATE users SET is_active = FALSE WHERE username = 'john_doe';"
```

**Promote user to admin:**
```bash
docker-compose exec mysql mysql -u root -ptourapp123 tour_app \
  -e "UPDATE users SET role = 'admin' WHERE username = 'john_doe';"
```

**Delete user:**
```bash
docker-compose exec mysql mysql -u root -ptourapp123 tour_app \
  -e "DELETE FROM users WHERE username = 'john_doe';"
```

## Multi-Stage Build Benefits

The Dockerfile uses a **multi-stage build** to optimize image size:

- **Build Stage**: Installs all dependencies (dev + prod) and builds the application
- **Production Stage**: Only copies production dependencies and built files

**Result**: Final image size is ~450MB instead of ~900MB

## Image Size Optimization

### View Image Layers

```bash
docker history tour-app:latest
```

### Reduce Image Size Further

If you need a smaller image, use `node:20-slim` instead of `node:20-alpine`:

```dockerfile
FROM node:20-slim AS builder
# ... rest of Dockerfile
```

## Pushing to Container Registry

### Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag the image
docker tag tour-app:latest yourusername/tour-app:latest

# Push the image
docker push yourusername/tour-app:latest
```

### Azure Container Registry (ACR)

```bash
# Login to ACR
az acr login --name myregistry

# Tag the image
docker tag tour-app:latest myregistry.azurecr.io/tour-app:latest

# Push the image
docker push myregistry.azurecr.io/tour-app:latest
```

### Google Container Registry (GCR)

```bash
# Configure authentication
gcloud auth configure-docker

# Tag the image
docker tag tour-app:latest gcr.io/my-project/tour-app:latest

# Push the image
docker push gcr.io/my-project/tour-app:latest
```

### AWS Elastic Container Registry (ECR)

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag the image
docker tag tour-app:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/tour-app:latest

# Push the image
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/tour-app:latest
```

## Kubernetes Deployment

### Create Kubernetes Manifests

**deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tour-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tour-app
  template:
    metadata:
      labels:
        app: tour-app
    spec:
      containers:
      - name: tour-app
        image: tour-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
```

**service.yaml:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: tour-app-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: tour-app
```

### Deploy to Kubernetes

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

## Docker Compose (Multi-Container Setup)

Create a `docker-compose.yml` if you need additional services (database, redis, etc.):

```yaml
version: '3.8'

services:
  tour-app:
    build: .
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

Run with Docker Compose:

```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

## Troubleshooting

### Authentication Issues

**"Admin user not found" or login fails:**

```bash
# Check if admin user exists
docker-compose exec mysql mysql -u root -ptourapp123 tour_app \
  -e "SELECT username, role FROM users WHERE username = 'admin';"

# If empty, reinitialize:
docker-compose exec app npx tsx server/init-db.ts

# Verify tables exist
docker-compose exec mysql mysql -u root -ptourapp123 tour_app \
  -e "SHOW TABLES;"
```

**"Database initialization script failed":**

```bash
# Ensure MySQL is healthy
docker-compose logs mysql

# Check MySQL container is running
docker-compose ps mysql

# If not running, start it:
docker-compose up -d mysql

# Wait a few seconds for MySQL to start
sleep 10

# Then run init script
docker-compose exec app npx tsx server/init-db.ts
```

**"Invalid token" on authentication:**

- Token has expired (default: 7 days)
- JWT_SECRET changed after token creation
- Token corrupted during transmission

Solution:
```bash
# Login again to get new token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin@1234"}'
```

### Build Fails with "pnpm-lock.yaml" Not Found

Ensure you have the `pnpm-lock.yaml` file in your repository. If it's missing:

```bash
pnpm install
```

Then commit it to the repository.

### Container Exits Immediately

Check the logs:

```bash
docker logs tour-container
```

Common issues:
- Missing environment variables
- Incorrect port configuration
- Node.js startup errors

### Port Already in Use

If port 8080 is already in use, map to a different port:

```bash
docker run -p 3000:8080 tour-app:latest
```

Access the app at `http://localhost:3000`

### MySQL Connection Errors

**Error: "Cannot connect to MySQL server"**

Check MySQL container is running:

```bash
docker ps | grep mysql
```

If not running, start it:

```bash
docker-compose up -d mysql
```

Verify connection:

```bash
docker exec tour-mysql mysql -u root -ptourapp123 -e "SELECT 1;"
```

**Error: "Database does not exist"**

Initialize database:

```bash
npx tsx server/init-db.ts
```

Or manually create:

```bash
docker exec tour-mysql mysql -u root -ptourapp123 -e "CREATE DATABASE tour_app;"
```

**Error: "Access denied for user"**

Verify environment variables in docker-compose.yml or Dockerfile match:

```yaml
DB_USER: root
DB_PASSWORD: tourapp123
DB_NAME: tour_app
```

Reset MySQL container:

```bash
docker-compose down -v
docker-compose up -d mysql
npx tsx server/init-db.ts
```

### High Memory Usage

Monitor container resource usage:

```bash
docker stats tour-container
```

Limit memory:

```bash
docker run -p 8080:8080 -m 1g --memory-swap 1g tour-app:latest
```

For MySQL:

```bash
docker-compose exec mysql mysql -u root -ptourapp123 -e "SHOW STATUS LIKE 'Threads%';"
```

## Security Best Practices

### Run Container as Non-Root User

Update the Dockerfile:

```dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### Scan Image for Vulnerabilities

```bash
docker scan tour-app:latest
```

### Use Specific Base Image Versions

Avoid `latest` tag:

```dockerfile
FROM node:20.10-alpine
```

## Performance Monitoring

### Set Resource Limits

```bash
docker run -p 8080:8080 \
  -m 1g \
  --cpus="2.0" \
  tour-app:latest
```

### Monitor Running Container

```bash
docker stats tour-container
```

## Cleanup

### Remove Unused Images

```bash
docker image prune
```

### Remove All Stopped Containers

```bash
docker container prune
```

### Full Cleanup (Be Careful!)

```bash
docker system prune -a
```

## Environment Variables Reference

### Database Configuration

```bash
DB_HOST=mysql                    # MySQL hostname
DB_PORT=3306                     # MySQL port
DB_USER=root                     # MySQL user
DB_PASSWORD=tourapp123           # MySQL password
DB_NAME=tour_app                 # Database name
```

### Authentication Configuration

```bash
JWT_SECRET=your-secret-key       # JWT signing secret (CHANGE IN PRODUCTION!)
JWT_EXPIRY=7d                    # Token expiration time
```

### External APIs

```bash
SUPABASE_URL=https://...         # Supabase URL (for requests)
SUPABASE_ANON_KEY=...            # Supabase anon key
OPENAI_API_KEY=sk-...            # OpenAI API key (for AI assistant)
AVIATIONSTACK_KEY=...            # Aviation API key
RAPIDAPI_KEY=...                 # RapidAPI key (for trains)
```

### Example .env File

```bash
# Server
NODE_ENV=production
PORT=8080

# Database
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tourapp123
DB_NAME=tour_app

# Authentication
JWT_SECRET=your-very-secure-secret-key-change-this
JWT_EXPIRY=7d

# External Services
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-key
AVIATIONSTACK_KEY=your-key
RAPIDAPI_KEY=your-key
```

## Additional Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/README.md)

## Support

For issues or questions about this Docker setup, contact the development team or refer to the project's main README.

---

**Last Updated**: 2024  
**Dockerfile Location**: `./Dockerfile`  
**Application Port**: 8080
