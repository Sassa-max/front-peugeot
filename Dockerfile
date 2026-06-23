# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files first (cache layer)
COPY package.json package-lock.json* ./

RUN npm ci

# Inject API URL at build time (Vite bakes VITE_* vars into the bundle)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .

RUN npm run build

# Runtime stage - serve static dist with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
