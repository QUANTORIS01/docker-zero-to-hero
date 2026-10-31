# ============================================================
# Stage 1: Build the React app
# ============================================================
# We use a full Node.js image here because we need `npm` and `vite`.
# This stage is thrown away when the build finishes.
FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifests first so `npm ci` is cached.
COPY package.json package-lock.json ./

RUN npm ci

# Copy the rest of the source and build.
COPY . .

RUN npm run build
# Result: /app/dist/ contains static HTML, CSS, JS.

# ============================================================
# Stage 2: Serve the built files with Nginx
# ============================================================
# This is a tiny image (~50 MB) with no Node.js, no npm, no source code.
# Only Nginx + the built files.
FROM nginx:1.27-alpine

# Copy ONLY the build output from stage 1.
# Everything else (source, node_modules, package.json) is left behind.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
