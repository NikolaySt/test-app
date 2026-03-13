# ─────────────────────────────────────────────
# Stage 1: Build the React client
# ─────────────────────────────────────────────
FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json* ./
RUN npm ci

COPY client/ ./
# Build args for Vite env vars (can be overridden at build time)
ARG VITE_SUPABASE_URL=YOUR_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Build the Express server
# ─────────────────────────────────────────────
FROM node:20-alpine AS server-builder

WORKDIR /app/server

COPY server/package.json server/package-lock.json* ./
RUN npm ci

COPY server/ ./
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3: Production image
# Serves static client via nginx (port 80)
# Runs Express API server (port 3001)
# nginx proxies /api/* → Express
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

# Install nginx and supervisor to run both processes
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# --- Server ---
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/package.json ./server/package.json

# --- Client static files ---
COPY --from=client-builder /app/client/dist /usr/share/nginx/html

# --- nginx config ---
COPY nginx.conf /etc/nginx/http.d/default.conf

# --- Supervisor config (manages nginx + node) ---
COPY supervisord.conf /etc/supervisord.conf

# --- Entrypoint script (runtime env injection) ---
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]