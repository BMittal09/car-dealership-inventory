# AutoVault Frontend

The React frontend for **AutoVault**, a full-stack car dealership inventory management application.

Built with React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router, and TanStack Query.

## Live Application

https://car-dealership-inventory-kappa.vercel.app

## Features

**Public pages**

- Responsive homepage
- Vehicle inventory browsing
- Search, filtering, and pagination
- Individual vehicle details
- User registration and login

**Administrator pages**

- Protected dashboard with inventory statistics
- Vehicle management table
- Add vehicle form
- Edit vehicle form
- Vehicle availability management
- Delete confirmation dialog
- Success and error notifications

**Authentication**

- JWT-based sessions
- Protected administrator routes
- Backend administrator verification
- Automatic session expiration
- Authentication cache cleanup on logout

## Technology Stack

| Technology            | Purpose                           |
| --------------------- | --------------------------------- |
| React                 | User interface                    |
| TypeScript            | Type safety                       |
| Vite                  | Development and production builds |
| Tailwind CSS          | Responsive styling                |
| React Router          | Client-side routing               |
| TanStack Query        | API data fetching and caching     |
| Lucide React          | Icons                             |
| Vitest                | Automated testing                 |
| React Testing Library | Component testing                 |
| Oxlint                | Static analysis                   |

## Local Development

### Prerequisites

- Node.js and npm
- AutoVault backend running on `http://localhost:3000`

### Install Dependencies

From the `frontend` directory:

```bash
npm install
```

### Start the Development Server

```bash
npm run dev
```

Open:

http://localhost:5173

The Vite development server forwards `/api/*` requests to the local Express backend.

## Available Commands

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start the development server        |
| `npm run build`      | Type-check and build for production |
| `npm run preview`    | Preview the production build        |
| `npm run lint`       | Run Oxlint                          |
| `npm test`           | Run automated tests                 |
| `npm run test:watch` | Run tests in watch mode             |

## Testing

Run:

```bash
npm test
npm run build
npm run lint
```

The frontend includes **32 automated tests** across six test files, covering authentication, session management, protected routes, API requests, and delete dialog behavior.

## Production Deployment

The frontend is deployed on **Vercel**.

The `vercel.json` configuration handles two routing requirements:

1. Forward `/api/*` requests to the Express backend hosted on Render.
2. Serve `index.html` for client-side routes such as `/cars`, `/login`, and `/admin`.

The frontend does not contain database credentials or JWT signing secrets.

## Backend

The Express backend and PostgreSQL database are documented in the [root README](../README.md).

## Author

**Bhavya Mittal**

GitHub: https://github.com/BMittal09
