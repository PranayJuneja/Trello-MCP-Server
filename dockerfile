# ---- Builder ----
    FROM node:22-alpine AS builder

    # Enable pnpm via corepack and pin the project version
    RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
    
    WORKDIR /app
    
    # Only copy manifest files first for better layer caching
    COPY package.json pnpm-lock.yaml tsconfig.json ./
    
    # Install all deps (dev + prod) and build
    RUN pnpm install --frozen-lockfile
    
    # Copy source and build
    COPY src ./src
    COPY README.md ./README.md
    RUN pnpm build
    
    # Prune to production deps only
    RUN pnpm prune --prod
    
    
    # ---- Runner ----
    FROM node:22-alpine AS runner
    
    ENV NODE_ENV=production
    WORKDIR /app
    
    # Optional: curl for HEALTHCHECK
    RUN apk add --no-cache curl
    
    # Copy only what we need at runtime
    COPY --from=builder /app/package.json ./
    COPY --from=builder /app/pnpm-lock.yaml ./
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/dist ./dist
    
    # TrelloMCP defaults to port 8787
    EXPOSE 8787
    
    # Health check hits /health
    HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:8787/health || exit 1
    
    # Start HTTP server (SSE endpoint at /mcp/sse)
    CMD ["node", "dist/index.js"]