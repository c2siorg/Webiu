# ──────────────────────────────────────────────────────────
# PROBLEM: The old Dockerfile installed @angular/cli globally,
# ran `ng serve` (dev server) in production, and shipped all
# devDependencies and source files in the final image (~1.2 GB).
#
# SOLUTION: Multi-stage build.
#   Stage 1 (builder): compile Angular → static files in dist/
#   Stage 2 (production): Nginx serves the static bundle — no Node,
#                         no Angular CLI, no source code in prod image.
#
# Result: image drops from ~1.2 GB → ~50 MB (nginx:alpine base).
# ──────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# npm ci is faster and reproducible vs npm install — uses package-lock.json exactly.
RUN npm ci

COPY . .

# PROBLEM: `ng serve` is a dev server — it's slow, unoptimised, and
# not designed for production traffic.
# SOLUTION: `ng build` produces a minified, tree-shaken static bundle.
RUN npm run build

# ── Stage 2: Production (Nginx) ─────────────────────────
FROM nginx:1.27-alpine AS production

# PROBLEM: Default Nginx config serves files from /usr/share/nginx/html
# but doesn't handle Angular's client-side routing — deep links return 404.
# SOLUTION: Custom config that falls back to index.html for unknown paths.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the compiled static bundle from the builder.
COPY --from=builder /usr/src/app/dist/webiu/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
