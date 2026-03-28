# Combined image (backend + frontend) mainly for demos

FROM node:20-bookworm AS build
WORKDIR /app

# Backend build
COPY be/package*.json ./
RUN npm install
COPY be/tsconfig*.json ./
COPY be/src ./src
RUN npm run build

# Frontend build
WORKDIR /app/fe
COPY fe/package*.json ./
RUN npm install
COPY fe/. ./
RUN npm run build

# Runtime image bundles both apps
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Backend runtime
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

# Frontend static output
COPY --from=build /app/fe/build ./fe-build

EXPOSE 8000
ENV PORT=8000

# Simple runner serves backend; frontend can be served by a static file server if needed
CMD ["node", "dist/server.js"]
