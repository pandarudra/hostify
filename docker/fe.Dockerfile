# Frontend container for Hostify (SvelteKit)

FROM node:20-bookworm AS build
WORKDIR /app

COPY fe/package*.json ./
RUN npm install

COPY fe/. ./
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
# Keep dev deps because Vite preview relies on them
RUN npm install

COPY --from=build /app/build ./build
COPY --from=build /app/.svelte-kit ./.svelte-kit
COPY --from=build /app/static ./static
COPY --from=build /app/svelte.config.js ./svelte.config.js
COPY --from=build /app/vite.config.ts ./vite.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/src ./src

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]
