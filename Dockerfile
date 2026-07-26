# syntax=docker/dockerfile:1
#
# Local preview / self-host image. Vercel does not use this — it builds from
# source — so nothing here changes how the site deploys.
#
# Debian slim rather than Alpine: glibc keeps sharp and the SWC binaries on
# their prebuilt paths instead of compiling from source.

# ── dependencies ──────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS deps
WORKDIR /app
RUN npm install --global pnpm@11.17.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── build ─────────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@11.17.0
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── runtime ───────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@11.17.0 \
    && useradd --system --uid 1001 --create-home nextjs

COPY --chown=nextjs:nextjs package.json pnpm-lock.yaml pnpm-workspace.yaml next.config.ts ./
COPY --from=deps --chown=nextjs:nextjs /app/node_modules ./node_modules
# Owned by the runtime user because Next writes its prerender cache back into
# .next at request time. Root-owned here means EACCES on every on-demand render.
COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
# The resume routes read this off disk at request time, so it has to be a real
# file in the image — not just something the build traced.
COPY --chown=nextjs:nextjs public ./public

USER nextjs
EXPOSE 3000
CMD ["pnpm", "exec", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
