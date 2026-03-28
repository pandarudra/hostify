# Backend container for Hostify (local/dev friendly build)

FROM node:20-bookworm AS base
WORKDIR /app

# Install dependencies first for better caching
COPY be/package*.json ./
RUN npm install

# Build stage
COPY be/tsconfig*.json ./
COPY be/src ./src
COPY be/local ./local
RUN npm run build

# Runtime image
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only keep production dependencies
COPY --from=base /app/package*.json ./
RUN npm install --omit=dev

# Copy built output and local assets
COPY --from=base /app/dist ./dist
COPY --from=base /app/local ./local

EXPOSE 8000
CMD ["node", "dist/server.js"]
