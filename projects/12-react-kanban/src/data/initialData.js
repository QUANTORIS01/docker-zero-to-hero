// The three columns of the board. Order matters: it's the display order.
export const columns = [
  { id: 'todo', title: 'To Do', accent: 'text-slate-400' },
  { id: 'in-progress', title: 'In Progress', accent: 'text-amber-400' },
  { id: 'done', title: 'Done', accent: 'text-emerald-400' },
]

// Priority options. Each one has a label and a Tailwind class string
// for its pill styling.
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

// Sample tasks so the board is not empty on first launch.
// These are only used if localStorage does not have any tasks yet.
export const initialTasks = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create a modern landing page with hero section and features.',
    priority: 'high',
    status: 'todo',
    createdAt: Date.now() - 100000,
  },
  {
    id: '2',
    title: 'Write API documentation',
    description: 'Document all endpoints with request and response examples.',
    priority: 'medium',
    status: 'todo',
    createdAt: Date.now() - 80000,
  },
  {
    id: '3',
    title: 'Set up CI/CD pipeline',
    description: 'GitHub Actions for automated testing and deployment.',
    priority: 'low',
    status: 'todo',
    createdAt: Date.now() - 60000,
  },
  {
    id: '4',
    title: 'Implement user authentication',
    description: 'JWT-based auth with refresh tokens.',
    priority: 'high',
    status: 'in-progress',
    createdAt: Date.now() - 40000,
  },
  {
    id: '5',
    title: 'Build task list component',
    description: 'Reusable list with sorting and filtering.',
    priority: 'medium',
    status: 'in-progress',
    createdAt: Date.now() - 20000,
  },
  {
    id: '6',
    title: 'Set up project structure',
    description: 'Vite + React + Tailwind + Docker.',
    priority: 'high',
    status: 'done',
    createdAt: Date.now() - 5000,
  },
]
