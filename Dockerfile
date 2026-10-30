# Build in a dedicated stage. Keep development tooling out of the final image.
FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime contains only production dependencies and compiled NestJS files.
FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder --chown=node:node /app/dist ./dist

# DB/JWT variables are injected at runtime; never bake them into the image.
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
