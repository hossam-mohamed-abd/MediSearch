# ==========================
# Stage 1: Build Angular App
# ==========================
FROM node:22-alpine AS builder


WORKDIR /app


# Copy dependency files first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build the production application
RUN npm run build

# ==========================
# Stage 2: Serve with Nginx
# ==========================
FROM nginx:1.29-alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular build output
# Replace "the-silence-depi-project-web-front" if your angular.json outputPath differs.
# COPY --from=builder /app/dist/the-silence-depi-project-web-front/browser/ /usr/share/nginx/html/

# Expose HTTP port
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
