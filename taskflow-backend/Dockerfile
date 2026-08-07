# ---- deps stage: install ALL deps (incl. dev) so nothing needed at build time is missing ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- production stage: copy source + only prod dependencies, discard devDependencies ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads

# Run as a non-root user — never run a Node process as root in production,
# it's the default first thing security reviewers check for.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3500
CMD ["node", "server.js"]
