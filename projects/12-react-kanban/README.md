[🇮🇷 فارسی](/projects/12-react-kanban/README.fa.md)

# Kanban Board

> A modern, drag-and-drop task board built with React, Vite, and Tailwind CSS — fully Dockerized with hot reload.

---

## Overview

A single-page Kanban board application, inspired by Trello. Drag task cards between columns, edit details in a modal, filter by priority, and everything persists in `localStorage`.

This is the reference project for **Lesson 12** of the Docker Zero to Hero course.

The project has **no backend**. It runs entirely in the browser. This is deliberate: it lets us focus 100% on how Docker handles a modern JavaScript project, without adding API complexity.

This project focuses on the development workflow. Production builds with multi-stage Docker and Nginx are covered in Lesson 13 as a separate project.

---

## Features

- Three columns: **To Do**, **In Progress**, **Done**
- Drag and drop between columns (powered by `@dnd-kit`)
- Create, edit, and delete tasks
- Priority levels (Low, Medium, High) with color-coded pills
- Filter tasks by priority
- Task count badge per column
- Automatic persistence in `localStorage`
- Dark theme with gradient accents
- Responsive layout (three columns on desktop, stacked on mobile)
- Keyboard-accessible drag and drop
- Hot reload inside Docker

---

## Stack

| Component | Version |
|-----------|---------|
| Node.js | 22 (Alpine) |
| React | 19 |
| Vite | 8 |
| Tailwind CSS | 4 |
| dnd-kit | 6 |
| lucide-react | (icons) |

---

## Quick Start (Docker)

### 1. Clone the repository

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/12-react-kanban
```

### 2. Build and run

```bash
docker compose up --build
```

### 3. Open the app

<http://localhost:3000/>

The board comes pre-populated with sample tasks. Try dragging one!

> **Note about the port:** This project runs on port **3000**. The previous projects use 8000 (TaskFlow), 9000 (URL Monitor), and 8080 (Photo Gallery). Having unique ports means all four can run at the same time.

---

## Quick Start (Local, without Docker)

```bash
npm install
npm run dev
```

Then open <http://localhost:3000/>.

The app behaves identically with or without Docker. Docker is not required to run it — it is required to understand how to package it for teams and CI/CD.

---

## Project Structure

```text
12-react-kanban/
├── .dockerignore
├── Dockerfile.dev
├── compose.yaml
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── README.md
├── README.fa.md
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── data/
    │   └── initialData.js
    ├── hooks/
    │   └── useLocalStorage.js
    └── components/
        ├── Column.jsx
        ├── TaskCard.jsx
        └── TaskModal.jsx
```

There is a `.gitignore` at the repository root that covers all projects. That is why this project does not have one of its own.

---

## Why is the Dockerfile called `Dockerfile.dev`?

Because this is the **development** Dockerfile. It runs Vite's dev server with hot reload, source maps, and detailed error messages.

The `.dev` suffix makes the intent explicit. In a real project, you would have two Dockerfiles: one for development (fast iteration) and one for production (small, optimized, static files served by a web server).

This project deliberately focuses on the development Dockerfile only, to keep the lesson focused. Production builds with multi-stage Docker and Nginx are covered as a **separate project** in Lesson 13.

---

## How the Docker Setup Works

### The `Dockerfile.dev`

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

The key detail is that `package.json` and `package-lock.json` are copied **before** the rest of the code. This lets Docker cache the `npm ci` layer, so a small code change does not trigger a full reinstall of dependencies.

### The `compose.yaml`

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
```

Two volume lines. Let's explain them, because this is the single most important idea in this lesson.

### Why two volumes?

The first volume (`.:/app`) mounts the **source code** from the host into the container. This is what makes **hot reload** work: when you save a file, the container sees the change immediately.

The second volume (`/app/node_modules`) is an **anonymous volume**. It hides the host's `node_modules` and lets the container use its own (Linux-compatible) `node_modules`, copied from the image at build time.

Without the second volume, this would happen:

- You run `npm install` on Windows → `node_modules` gets filled with **Windows-native** binaries.
- Docker mounts that same folder into a **Linux** container.
- Node.js tries to load `.node` files, but they were built for Windows.
- You get cryptic errors like `invalid ELF header` or `Cannot find module`.

With the second volume, `node_modules` inside the container is completely independent. The container was built with `npm ci`, which installed Linux-native dependencies. The host's `node_modules` is ignored.

**This pattern is the standard way to run a Node.js app in Docker during development.** If you only remember one thing from this lesson, remember this.

### Why `CHOKIDAR_USEPOLLING=true`?

On Windows + WSL2, Vite's file watcher sometimes misses file changes because of how filesystem events cross the WSL boundary. Setting this environment variable forces Chokidar to use **polling** (checking files at regular intervals) instead of native filesystem events. Polling is slightly more CPU-intensive but reliable.

If your hot reload works without it, you can remove the line. On Linux and macOS, it is not needed.

---

## Adding a New Package

**Do it inside the container**, not on the host:

```bash
docker compose exec frontend npm install some-package
```

This updates:
- `node_modules` inside the container
- `package.json` and `package-lock.json` on the host (via the bind mount)

If you run `npm install` **on the host** instead, the container will not see the new package (because `node_modules` is isolated). To fix, run:

```bash
docker compose up --build
```

To rebuild the image with the new dependencies.

---

## Common Commands

```bash
# Start (rebuilds if needed)
docker compose up --build

# Start in background
docker compose up -d

# See container status
docker compose ps

# Follow the Vite dev server logs
docker compose logs -f frontend

# Open a shell inside the container
docker compose exec frontend sh

# Install a new package (updates node_modules inside the container)
docker compose exec frontend npm install <package-name>

# Run ESLint
docker compose exec frontend npm run lint

# Build for production (output in dist/)
docker compose exec frontend npm run build

# Stop the container (keeps the anonymous node_modules volume)
docker compose down

# Stop and remove volumes (next start will reinstall node_modules)
docker compose down -v
```

---

## Production Notes

This project is **development-only**. Do not deploy it to a production server as-is.

**Why?** Because the Vite dev server:
- Uses a lot of memory (keeps the full source tree in memory)
- Serves unminified code
- Includes debug tooling
- Has a large attack surface

A proper production setup for a React app typically includes:
- Multi-stage `Dockerfile.prod`
- `vite build` to bundle and minify
- Nginx serving the static output
- A final image under 50 MB

All of these are covered in Lesson 13 as a **separate project**, not as an upgrade of this one.

---

## Debugging Tips

### Hot reload is not working

1. Verify that `CHOKIDAR_USEPOLLING=true` is set in `compose.yaml`.
2. Restart the container: `docker compose restart frontend`.
3. As a last resort: `docker compose down -v && docker compose up --build`.

### `Cannot find module` after `npm install`

You ran `npm install` on the host instead of in the container. Rebuild:

```bash
docker compose up --build
```

### Port 3000 is in use

Change the host port in `compose.yaml`:

```yaml
ports:
  - "127.0.0.1:3001:3000"
```

Then open <http://localhost:3001/>.

### Container is running but page does not load

Check the logs:

```bash
docker compose logs frontend
```

If you see `VITE ready` with `Local: http://localhost:3000/`, the server is running. If not, there is likely a build or dependency error.

---

## Related Lessons

This project is the reference implementation for:

- [**Lesson 12 — React with Docker**](../../en/12-react/README.md)

---

## License

MIT
