# 1️⃣ Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2️⃣ Production stage
FROM nginx:alpine
# Copy Vite SPA build only (client-side)
COPY --from=builder /app/dist/spa/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
