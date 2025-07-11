# --- Base image for both build and dev ---
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

# --- Development image (hot-reload) ---
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# --- Production build ---
FROM base AS builder
RUN npm ci --only=production
COPY . .
RUN npm run build

# --- Production nginx image ---
FROM nginx:alpine AS prod
WORKDIR /app
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"] 