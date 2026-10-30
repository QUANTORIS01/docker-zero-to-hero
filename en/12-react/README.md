[🇮🇷 فارسی](/fa/12-react/README.md)

# Lesson 12 — React with Docker

## Introduction

In previous lessons, we built three backend-focused projects:

- **Lesson [09](/en/09-django-docker/README.md):** An API with Django + PostgreSQL
- **Lesson [10](/en/10-celery-redis/README.md):** A URL Monitor with Celery + Redis
- **Lesson [11](/en/11-nginx/README.md):** A photo gallery with Nginx and HTML/CSS

All three had one thing in common: **a Python backend**. Even the photo gallery rendered its HTML from Django.

Now we enter the world of **modern frontend**. A world where Django is not involved. Where HTML does not come from the server. Everything is built inside the **browser**. The language is **JavaScript**, and the framework is **React**.

This is a major shift. In this lesson:

- We work with an entirely new technology (Node.js instead of Python)
- We work with a new language (JavaScript instead of Python)
- We work with a new mental model (Components instead of Views)

But do not worry. The goal of this lesson is **not** to teach React from scratch. The goal is:

1. To understand how a React project is structured
2. To understand how to run it inside Docker
3. To understand the famous `node_modules` challenge

We will explain every line of React code, but the main focus is **Docker**.

The complete project code is in `projects/12-react-kanban/` in the repository.

---

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain what React is and how it differs from Django
- Build a React project using Vite
- Explain the directory structure of a React project
- Understand the difference between a dev server and a production build
- Write a Dockerfile for a Node.js project
- Understand what `node_modules` is and why it must not be shared with the host
- Use the "two-volume" pattern
- Get hot reload working inside Docker

---

## Prerequisites

- Everything from Lessons 09 through 11 (Dockerfile, compose, volumes)
- Node.js installed on your system (version 18 or higher)
- Basic familiarity with JavaScript (variables, functions, arrays, objects) — if not, you can still follow along; every line is explained

**No React knowledge is required.** We will explain the main concepts with examples.

---

## First, a Simple Explanation of React

Before we touch any code, let me explain React with an analogy.

### What is React?

**React is a JavaScript library for building User Interfaces (UIs).**

In Django, we built HTML pages **on the server**. The user sent a request, Django returned a ready-made HTML page, and the browser displayed it.

In React, HTML is built **in the browser**. That means:

- Once, we get an empty page (with a JavaScript file)
- JavaScript fills that page
- When the user clicks a button, JavaScript updates **the same page** instead of fetching a new page from the server

**Real-life analogy:**

- **Django** = a restaurant that brings a full new plate every time. If you just needed a bit more salt, it still replaces the whole plate.
- **React** = a restaurant that brings one big plate, and if you need salt, it just adds salt.

**The term "Single Page Application" (SPA) comes from this.** One page, but with many interactions.

### Four Core React Concepts

**1. Component**

A small piece of UI. Like a Lego brick. By combining small components, you build a large page.

In our project:
- `TaskCard` is a component (a task card)
- `Column` is a component (a column)
- `TaskModal` is a component (add/edit window)
- `App` is also a component (the whole page)

**2. Props**

Data that a component receives from its parent. Like function arguments.

For example, `TaskCard` needs to know **which task** to display. It receives that via the `task` prop.

**3. State**

Data that changes inside a component. Such as:

- Is the modal open?
- What filter has the user selected?
- What is the task list?

When State changes, React automatically updates the UI.

**4. Hooks**

Special functions that let Function-Based components have State.

- `useState` — for State
- `useEffect` — for actions triggered when something changes (e.g., save to localStorage)
- `useLocalStorage` — a custom hook we will build

**About JSX:** In React, we write HTML inside JavaScript. This combination is called **JSX**. For example:

```jsx
const element = <h1>Hello</h1>
```

This looks a lot like HTML, but it is JavaScript. Vite transforms it into plain JavaScript that browsers understand.

### What is Vite?

**Vite is a build tool for modern JavaScript projects.**

Its jobs:

- Start a dev server (for development)
- Build the code for production (for real-world use)
- Provide hot reload (show changes without reloading the page)

`Create React App` (CRA) used to be popular, but Vite is now the industry standard because it is 10-100x faster.

---

## The Project — Kanban Board

**Story:**

A Kanban board (like Trello). Three columns: **To Do**, **In Progress**, **Done**. Drag task cards with the mouse and drop them between columns.

**Features:**

- Three Kanban columns
- Drag and drop cards between columns
- Create, edit, and delete tasks
- Priority (Low / Medium / High) with different colors
- Filter by priority
- Automatic save to `localStorage` (browser)
- Dark theme with gradients

**Important note:** This project has **no backend**. Everything runs in the browser. Data is stored in `localStorage`.

**Why no backend?**

Because the goal of this lesson is **learning Docker for React**, not building a full system. We add a backend in the next lesson (a completely new project).

**Stack:**

- Node.js 22 (Alpine) — JavaScript runtime
- React 19 — UI library
- Vite 8 — build tool
- Tailwind CSS 4 — styling
- `@dnd-kit` — drag and drop
- `lucide-react` — icons

---

## Directory Structure

The complete project structure:

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
│   ├── favicon.svg
│   └── icons.svg
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

**Note:** A `.gitignore` exists at the repository root covering all projects. That is why this project does not have its own `.gitignore`.

**Directories:**

| Directory | What it is |
|-----------|------------|
| `public/` | Static files that are copied as-is (favicon, icons) |
| `src/` | Main project code |
| `src/components/` | React components |
| `src/hooks/` | Custom hooks |
| `src/data/` | Initial data and constants |

---

## Step 1 — `package.json`

The `package.json` file is the heart of any Node.js project. It is like `requirements.txt` in Python, but more complete.

```json
{
  "name": "12-react-kanban",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@tailwindcss/vite": "^4.3.3",
    "lucide-react": "^1.64.0",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "tailwindcss": "^4.3.3"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "eslint": "^10.13.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.7",
    "globals": "^17.13.0",
    "vite": "^8.3.5"
  }
}
```

### What is each part?

**`name`** — Project name.

**`private: true`** — This project will not be published to npm. For personal projects, always `true`.

**`type: "module"`** — This project uses **ES Modules** (the modern JavaScript module system). This enables `import`/`export`. In old Node.js, you had to use `require()`.

**`scripts`** — Shortcuts run with `npm run <name>`:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Starts the dev server (port 3000) |
| `npm run build` | Builds for production (output in `dist/`) |
| `npm run lint` | Checks code with ESLint |
| `npm run preview` | Tests the production build locally |

**`dependencies`** — Packages needed in **production**:

- **`react`, `react-dom`** — React itself
- **`@dnd-kit/*`** — Three packages for drag and drop
- **`tailwindcss`, `@tailwindcss/vite`** — Styling
- **`lucide-react`** — Icons

**`devDependencies`** — Packages needed only in **development**:

- **`vite`, `@vitejs/plugin-react`** — Build tool
- **`eslint` and its plugins** — Code quality checks

**Important note:** The difference between `dependencies` and `devDependencies` matters in production. If you run `npm install --omit=dev`, only `dependencies` are installed. This makes the Image much smaller.

---

## Step 2 — `vite.config.js`

File `vite.config.js` holds Vite configuration:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
```

### What is each part?

**`plugins: [react(), tailwindcss()]`**

Plugins. `react()` tells Vite "this is a React project, process JSX". `tailwindcss()` enables Tailwind.

**`server.host: '0.0.0.0'`**

**This is the most important line for Docker.** It tells Vite "listen on all network interfaces".

Without this line, Vite would listen only on `localhost` inside the container. That means it would not be reachable from outside the container (even from Windows).

**`server.port: 3000`**

Changes Vite's default port (5173) to 3000. Port 3000 is the standard React port.

**Note:** Each project in this course has its own port:

| Lesson | Port |
|--------|------|
| 09 (TaskFlow) | 8000 |
| 10 (URL Monitor) | 9000 |
| 11 (Photo Gallery) | 8080 |
| **12 (Kanban)** | **3000** |

This means all four can run at the same time.

---

## Step 3 — `index.html`

This is the entry point for the browser. It sits at the project root.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kanban Board</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Line by line

**`<div id="root"></div>`** — An empty `<div>`. React builds all content inside this `<div>`. Its name is `root` (root).

**`<script type="module" src="/src/main.jsx"></script>`** — Loads the main JavaScript file. `type="module"` means ES Modules.

**Note:** This file **in development** is served by Vite. In production, Vite builds a final HTML where JavaScript is bundled into one big file.

**Difference from Django:**

In Django, we built HTML with a template engine:

```django
<h1>{{ title }}</h1>
{% for task in tasks %}
  <div>{{ task.title }}</div>
{% endfor %}
```

In React, HTML is **empty**, and React builds everything with JavaScript. That is the fundamental difference.

---

## Step 4 — `src/main.jsx`

This is the JavaScript entry point:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### Line by line

**`import { StrictMode } from 'react'`**

`StrictMode` is a special React component that surfaces certain common bugs in development. It runs code twice to catch bugs early.

**`import { createRoot } from 'react-dom/client'`**

The function that connects React to a `<div>` in HTML.

**`import './index.css'`**

Imports the CSS file. Vite adds it to HTML automatically.

**`import App from './App.jsx'`**

Imports the main component of the app.

**`createRoot(document.getElementById('root')).render(...)`**

Creates a React root on `<div id="root">`, then renders `<App />` inside it.

**What does the last line mean?**

It means: "From now on, whatever `<App />` returns should be displayed inside `<div id="root">` in `index.html`."

---

## Step 5 — `src/index.css`

The main CSS file:

```css
@import "tailwindcss";

@theme {
  --color-bg: #0a0a0f;
  --color-surface: #16162a;
  --color-surface-hover: #1c1c33;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-text: #f5f5f7;
  --color-text-muted: #8b8b9e;
  --color-accent: #7c3aed;
  --color-accent-2: #06b6d4;

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
}

html, body, #root {
  height: 100%;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

### What is each part?

**`@import "tailwindcss";`**

Loads all of Tailwind. In Tailwind v4, this one line enables everything.

**`@theme { ... }`**

This is a new Tailwind v4 feature. It lets you define **custom variables** that can be used in every component.

**Colors we chose:**

| Variable | Color code | What it is |
|----------|-----------|------------|
| `bg` | `#0a0a0f` | Deep navy-black background |
| `surface` | `#16162a` | Cards |
| `accent` | `#7c3aed` | Purple (high priority, buttons) |
| `accent-2` | `#06b6d4` | Cyan |

**Note:** These are the same colors as the Lesson 11 gallery. This way, the projects share a visual identity.

**`html, body, #root { height: 100%; }`**

Stretches the page to full height. Without this, a white strip appears at the bottom.

**`body { ... }`**

Default body styles. `-webkit-font-smoothing: antialiased` smooths fonts on Mac and iOS.

---

## Step 6 — `src/data/initialData.js`

The initial data file. It defines three things:

```js
export const columns = [
  { id: 'todo', title: 'To Do', accent: 'text-slate-400' },
  { id: 'in-progress', title: 'In Progress', accent: 'text-amber-400' },
  { id: 'done', title: 'Done', accent: 'text-emerald-400' },
]

export const priorities = {
  low: {
    label: 'Low',
    pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  medium: {
    label: 'Medium',
    pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  high: {
    label: 'High',
    pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
}

export const initialTasks = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create a modern landing page with hero section and features.',
    priority: 'high',
    status: 'todo',
    createdAt: Date.now() - 100000,
  },
  // ... more sample tasks
]
```

### What is each part?

**`columns`** — Three Kanban columns:

- `id` — Identifier (matches the task's `status`)
- `title` — Display name
- `accent` — Tailwind color class for the column header

**`priorities`** — Three priority levels:

- `label` — Display name
- `pill` — Tailwind classes for the pill's look

**`initialTasks`** — A few sample tasks:

If the user opens the app for the first time (i.e., `localStorage` is empty), these tasks appear. If the user already has tasks, these are ignored.

---

## Step 7 — `src/hooks/useLocalStorage.js`

This is a **custom hook**. Like React's own `useState`, but it stores data in `localStorage`.

```js
import { useEffect, useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }, [key, value])

  return [value, setValue]
}
```

### What is `localStorage`?

A storage space inside the browser. Like a simple cache that survives closing the browser.

- `localStorage.setItem('key', 'value')` — save
- `localStorage.getItem('key')` — read
- `localStorage.removeItem('key')` — delete

**Limitation:** It only accepts strings. To store arrays or objects, you must convert them to JSON first (`JSON.stringify`) and parse on read (`JSON.parse`).

### Line by line

**`useState(() => { ... })`**

This is a "lazy initializer". It runs only **once** on mount.

- Try to read from `localStorage`
- If something was there, parse and return it
- If nothing was there or there was an error, return `initialValue`

**`useEffect(() => { ... }, [key, value])`**

Every time `key` or `value` changes, this effect runs. It converts `value` to JSON and writes it to `localStorage`.

**`return [value, setValue]`**

Exactly like `useState`. Returns an array: `[current_value, setter]`. The consumer can destructure:

```js
const [tasks, setTasks] = useLocalStorage('kanban-tasks', initialTasks)
```

**Result:** Every change to `tasks` is automatically saved to `localStorage`. Without this, tasks would disappear on every reload.

---

## Step 8 — `src/components/TaskCard.jsx`

The task card component. It exports two things:

- `TaskCardVisual` — appearance only
- `TaskCard` — wrapper that adds drag behavior

```jsx
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import { priorities } from '../data/initialData'

export function TaskCardVisual({ task, onEdit, onDelete }) {
  const priority = priorities[task.priority]

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
      {/* Title, description, priority pill */}
    </div>
  )
}

export function TaskCard({ task, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <TaskCardVisual task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}
```

### Why two components?

`TaskCardVisual` builds only the appearance. `TaskCard` adds the drag logic.

**Why separate?** Because inside `DragOverlay` (which we will see in `App.jsx`) we need a **visual copy** of the card that is not draggable (since the original is being dragged).

### What is `useDraggable`?

A dnd-kit hook that tells a component "you can be dragged".

- **`id`** — Unique identifier (the task)
- **`data`** — Extra information (for future)
- **`setNodeRef`** — Connects to the DOM
- **`listeners`** — Event handlers
- **`isDragging`** — Is it currently being dragged?

### Why `opacity-30`?

When a card is dragged, a **copy** of it moves with the mouse inside `DragOverlay`. The original card becomes faded so the user knows this one is being dragged.

### `onPointerDown={e => e.stopPropagation()}` on buttons

Without this, when you click the Edit button, dnd-kit thinks you are dragging the card and starts a drag. With `stopPropagation`, dnd-kit does not see it, but `onClick` still fires.

---

## Step 9 — `src/components/Column.jsx`

The Kanban column component:

```jsx
import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { TaskCard } from './TaskCard'

export function Column({ column, tasks, onEdit, onDelete, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col ... ${
        isOver ? 'border-violet-500/50 bg-violet-500/5' : 'border-[var(--color-border)]'
      }`}
    >
      {/* Title, task count, + button */}
      {/* List of TaskCards */}
    </div>
  )
}
```

### What is `useDroppable`?

A dnd-kit hook that tells a component "you can be a drop target".

- **`id: column.id`** — The column's identifier. In `onDragEnd`, `over.id` will equal this.
- **`isOver`** — Is a card currently being dragged over this column?

### Dynamic classes

When `isOver=true` (i.e., a card is being dragged over this column), the border turns purple and the background gets a purple tint. This gives **visual feedback** to the user.

---

## Step 10 — `src/components/TaskModal.jsx`

The add/edit task window. A form with title, description, priority, and status:

```jsx
export function TaskModal({ isOpen, onClose, onSave, task, defaultStatus }) {
  const [title, setTitle] = useState('')
  // ... other state

  useEffect(() => {
    if (task) {
      // If editing, populate the form
    } else {
      // If new task, clear the form
    }
  }, [task, defaultStatus, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title, description, priority, status })
  }

  return (
    <div className="fixed inset-0 ..." onClick={onClose}>
      <div className="..." onClick={e => e.stopPropagation()}>
        {/* Form */}
      </div>
    </div>
  )
}
```

### Key points

**`useEffect` for populating the form:**

When the modal opens or `task` changes, the form is populated with the relevant data. If `task` is null (new task), the form is cleared.

**`if (!isOpen) return null`**

If the modal is closed, render nothing.

**`onClick={e => e.stopPropagation()}` on the modal content:**

The outer div (`fixed inset-0`) has `onClick={onClose}` to close the modal. Without `stopPropagation`, every click inside the modal would close it.

**`e.preventDefault()` in `handleSubmit`:**

Prevents the form's default behavior (which would reload the page).

---

## Step 11 — `src/App.jsx`

The heart of the app. It wires everything together:

```jsx
export default function App() {
  const [tasks, setTasks] = useLocalStorage('kanban-tasks', initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filterPriority, setFilterPriority] = useState('all')
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return
    const task = tasks.find(t => t.id === active.id)
    if (!task || task.status === over.id) return
    setTasks(tasks.map(t =>
      t.id === active.id ? { ...t, status: over.id } : t
    ))
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {/* Header with filter and "New task" button */}
      {/* Three columns */}
      <DragOverlay>{activeTask && <TaskCardVisual task={activeTask} />}</DragOverlay>
    </DndContext>
  )
}
```

### State

| State | What it is |
|-------|-----------|
| `tasks` | Array of all tasks (saved via `useLocalStorage`) |
| `isModalOpen` | Is the modal open? |
| `editingTask` | Task being edited (if `null`, it is a new task) |
| `filterPriority` | Current filter |
| `activeTask` | Task currently being dragged |

### What is `sensors`?

dnd-kit input sensors:

- **`PointerSensor`** — For mouse and touch. `activationConstraint: { distance: 5 }` means "the card must move 5 pixels before drag starts". Without this, every click would start a drag.
- **`KeyboardSensor`** — For accessibility. Users can drag via `Tab` + `Space` + arrow keys.

### `handleDragEnd` — the most important function

```jsx
const { active, over } = event
```

- `active` — What was dragged (a task)
- `over` — What it was dropped on (a column), or `null` if dropped outside

```jsx
if (!over) return
```

If dropped outside, do nothing.

```jsx
if (task.status === over.id) return
```

If dropped in the same column, do nothing.

```jsx
setTasks(tasks.map(t => t.id === active.id ? { ...t, status: over.id } : t))
```

Find the task, change its `status`. `useLocalStorage` saves it automatically.

### `DndContext` and `DragOverlay`

**`DndContext`** — The drag environment. Every draggable and droppable must be inside it.

**`DragOverlay`** — A visual copy of the card being dragged. `rotate-3`, `shadow-2xl`, and `opacity-95` make it look like it is floating in the air.

---

## Step 12 — Dockerfile.dev

Now the Docker part. File `Dockerfile.dev`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Line by line

**`FROM node:22-alpine`**

The base Image. `node:22` = Node.js version 22 (LTS), `alpine` = small OS layer (~50 MB, versus ~900 MB for the full version).

**`WORKDIR /app`**

The working directory inside the container.

**`COPY package.json package-lock.json ./`**

We copy **only** these two files. A deliberate decision.

Why? Because if we copied all code first, **any** code change would invalidate the `npm ci` layer and force a full reinstall. That is very slow.

By copying only `package*.json` first, the `npm ci` layer stays cached until `package.json` itself changes.

**`RUN npm ci`**

Like `npm install`, but:

- Uses only `package-lock.json` (not `package.json`)
- Faster
- More reproducible (exact versions are installed)
- Removes `node_modules` first, so it starts clean

**`COPY . .`**

Copies the rest of the code. In development, this line is effectively useless (because the bind mount will hide it), but we keep it so the Image is complete.

**`EXPOSE 3000`**

Declares the port. Remember: it does **not** publish the port, only documents it.

**`CMD ["npm", "run", "dev"]`**

The default command. Starts Vite's dev server.

### Why `Dockerfile.dev` and not `Dockerfile`?

Because this Dockerfile is **for development**:

- Dev server (slow, memory-heavy, but with hot reload)
- Unminified code
- Debugging tools

In **a real project**, you would usually have two Dockerfiles:

- `Dockerfile.dev` — for development
- `Dockerfile.prod` — for production (multi-stage, small, optimized)

**This project only has `Dockerfile.dev`** because Lesson 12 focuses on the development environment. Production builds with multi-stage Docker are covered as a **separate project** in Lesson 13.

---

## Step 13 — `.dockerignore`

```text
node_modules/
dist/
dist-ssr/
*.local
.git/
.gitignore
.vscode/
.idea/
.DS_Store
Thumbs.db
README.md
```

### The most important line

**`node_modules/`**

Without this line, every `docker build` would send ~200 MB of `node_modules` to the Docker daemon. Very slow and pointless.

### The rest

- `dist/` — `vite build` output; not needed in dev
- `.git/` — Git history; not needed
- `.vscode/`, `.idea/` — IDE settings
- `README.md` — not needed inside the Image

---

## Step 14 — `compose.yaml`

File `compose.yaml`:

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
    restart: unless-stopped
```

### Line by line

**`build.context: .` and `build.dockerfile: Dockerfile.dev`**

Build from `Dockerfile.dev` in the current directory.

**`ports: "127.0.0.1:3000:3000"`**

Maps port 3000 on `127.0.0.1` (only from this machine) to port 3000 inside the container.

**`volumes: - .:/app`**

The entire project folder from the host appears in `/app` in the container. This is what makes hot reload possible.

**`volumes: - /app/node_modules`**

**This is the most important line in this lesson.** It is an **anonymous volume**. It hides the host's `node_modules` from the container.

### Why is this line critical? (the most important concept in the lesson)

**Imagine this scenario:**

1. On Windows, you ran `npm install` in your project. `node_modules/` is full of packages **compiled for Windows** (`.node` files, `.dll` files).

2. Now Docker wants to run your project inside a **Linux** container.

3. If the Windows `node_modules/` were mounted into the container via bind mount, Linux's Node.js could not read them. You would get errors like `Error: Cannot find module` or `invalid ELF header`.

**The solution:**

```yaml
volumes:
  - .:/app              # Bring code from host
  - /app/node_modules   # But do NOT bring node_modules from host!
```

**What exactly does the second line do?**

- Creates an empty space called `/app/node_modules`
- Fills it **from the Image** (because the Dockerfile says `npm ci`)
- The host has no access to it
- The container can write to it

**Result:**

- `node_modules` inside the container: Linux-native, independent
- Code from the host (so hot reload works)

**This pattern is the standard way to run Node.js in Docker during development.** If you only remember one thing from this lesson, remember this.

### Why `CHOKIDAR_USEPOLLING=true`?

On Windows + WSL2, Vite's file watcher sometimes misses file changes because filesystem events cross the WSL boundary. This variable forces Chokidar (Vite's watching library) to use **polling** (periodic checks) instead of native events.

Polling uses a bit more CPU but is **reliable**.

On Linux and macOS, it is not needed. For Windows development, it is recommended.

---

## Step 15 — Run

From inside `projects/12-react-kanban/`:

```bash
docker compose up --build
```

### What you should see

**Build stage:**

```text
 => [1/5] FROM node:22-alpine
 => [2/5] WORKDIR /app
 => [3/5] COPY package.json package-lock.json ./
 => [4/5] RUN npm ci
 => [5/5] COPY . .
 => exporting to image
```

**Start stage:**

```text
 ✔ Container 12-react-kanban-frontend-1  Started
```

**Logs:**

```text
frontend-1  | > 12-react-kanban@0.0.0 dev
frontend-1  | > vite
frontend-1  |
frontend-1  |   VITE v8.3.5  ready in 250 ms
frontend-1  |
frontend-1  |   ➜  Local:   http://localhost:3000/
frontend-1  |   ➜  Network: http://172.18.0.2:3000/
```

If you see `Local: http://localhost:3000/`, Vite is listening on `0.0.0.0`. That is what lets Docker bridge the port.

---

## Step 16 — Testing

### Test 1 — Open the app

```text
http://localhost:3000/
```

You should see the Kanban page:

- Header with logo
- Three columns: To Do (3 tasks), In Progress (2 tasks), Done (1 task)
- Cards with title, description, priority pill

### Test 2 — Drag and Drop

1. Drag a card from "To Do" and drop it in "In Progress"

2. **You should see:**
- The target column highlights purple
- The original card fades
- A copy of the card moves with the mouse at an angle
- The card appears in the new column

3. Reload the page. The card stays in its new column.

### Test 3 — Add, edit, delete

1. Click "New task". Create a new task.

2. Click the Edit icon on a card. Change the title. Save.

3. Click the Delete icon. Confirm.

All should work.

### Test 4 — Hot Reload (the most important Docker test)

**This test confirms the bind mount works correctly.**

1. Open `src/App.jsx` in VS Code

2. Change the title from `Kanban Board` to `Kanban Board (Docker)`

3. **Save**

4. Go to the browser. **No reload.** You should see the new title.

If hot reload works, **everything is correct.** 🎉

### Test 5 — `node_modules` isolation

**This test confirms the host and container `node_modules` are separate.**

**Step 1 — Create a test file inside the container:**

```powershell
docker compose exec frontend touch node_modules/.container-test
```

**Step 2 — Check that it does NOT appear on the host:**

```powershell
Test-Path node_modules\.container-test
```

Should return `False`. If `False`, `node_modules` isolation is working. ✅

**If `True`**, then host and container `node_modules` are the same (they should not be). Check that `volumes: - /app/node_modules` is in `compose.yaml`.

---

## Step 17 — Installing a new package (important note)

When you want to install a new package (e.g., `react-router-dom`), you have two options:

### The right way — inside the container

```bash
docker compose exec frontend npm install react-router-dom
```

**What happens?**
- `node_modules` inside the container updates
- `package.json` and `package-lock.json` on the host update (via bind mount)
- Everything is in sync automatically

**This is the correct way.** ✅

### The wrong way — on the host

```bash
npm install react-router-dom
```

**What happens?**
- `node_modules` on the host updates
- `package.json` and `package-lock.json` on the host update
- **But `node_modules` inside the container does not change** (because the volume is isolated)

**Result:** The container errors out saying `react-router-dom` is not found.

**Fix:** After installing on the host:

```bash
docker compose up --build
```

To rebuild the Image with the new dependencies.

### Recommendation

**Always install inside the container.** This is a good habit to build from day one.

---

## Common Problems

### Problem 1 — Hot reload is not working

1. Verify that `CHOKIDAR_USEPOLLING=true` is in `compose.yaml`

2. Restart the container:

```bash
docker compose restart frontend
```

3. As a last resort:

```bash
docker compose down -v
docker compose up --build
```

### Problem 2 — `Cannot find module` error after `npm install`

You installed on the host, not in the container. Rebuild:

```bash
docker compose up --build
```

### Problem 3 — Port 3000 is already in use

Change the host port:

```yaml
ports:
  - "127.0.0.1:3001:3000"
```

Then open `http://localhost:3001/`.

### Problem 4 — Container is running but the page does not load

Check the logs:

```bash
docker compose logs frontend
```

If you see `VITE ready` with `Local: http://localhost:3000/`, the server is running. If not, there is a build or dependency error.

### Problem 5 — `invalid ELF header` or binary errors

Host and container `node_modules` are mixed. Check:

```bash
grep node_modules compose.yaml
```

The line `- /app/node_modules` must be there.

---

## Exercises

1. Run `docker compose up --build` and confirm the Kanban page loads.

2. Drag a card between columns. Reload. The change should persist.

3. Modify `src/App.jsx`. See the change without reloading.

4. Run `docker compose exec frontend touch node_modules/.container-test`. Use `Test-Path` to check that it is not on the host.

5. Run `docker compose exec frontend npm install date-fns`. See `package.json` update on the host.

6. **Challenge:** Add a "Clear all tasks" button to the header that removes all tasks. In `App.jsx`, call `setTasks([])`.

---

## Summary

In this lesson, we learned:

- **What React is** and how it differs from Django (UI in the browser vs HTML from the server)
- **Component, Props, State, Hooks** — the four core React concepts
- **What Vite is** and why it replaced Create React App
- **The structure of a React project** and what each folder does
- **What Dockerfile.dev is** and why it differs from `Dockerfile.prod`
- **The two-volume pattern** — the most important concept in this lesson
- Why `node_modules` must not be shared between host and container
- How to get hot reload working inside Docker
- How to install a new package (inside the container, not on the host)

**The most important takeaway from this lesson:**

```text
volumes:
  - .:/app              ← code from host, for hot reload
  - /app/node_modules   ← node_modules from container, for Linux compatibility
```

**If you only remember one thing from this lesson, remember these two lines.**

---

## Next Lesson

**Lesson 13 — A Completely New Project: React + Django + Multi-stage Build**

In the next lesson, we build a **completely new project** that includes:

- React for the frontend
- Django for the backend
- PostgreSQL for the database
- Nginx as a reverse proxy
- **Multi-stage Docker build** for production
- `vite build` for React, then served by Nginx

From a 500 MB dev Image, to a 50 MB production Image. You will learn how to prepare a real full-stack app for production.
