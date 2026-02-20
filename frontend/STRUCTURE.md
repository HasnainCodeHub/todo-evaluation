# Frontend Structure Overview

This document provides a comprehensive overview of the frontend application structure.

## Directory Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   ├── signin/                  # Authentication pages
│   │   └── page.tsx
│   └── dashboard/               # Protected dashboard page
│       └── page.tsx
├── components/                  # Reusable React components
│   ├── ui/                      # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ConfirmDialog.tsx
│   │   └── index.ts
│   ├── auth/                    # Authentication components
│   │   └── AuthProvider.tsx
│   └── tasks/                   # Task-specific components
│       ├── TaskItem.tsx
│       ├── TaskForm.tsx
│       ├── EditTaskForm.tsx
│       └── index.ts
├── lib/                         # Shared libraries/utilities
│   ├── api/                     # API client
│   │   ├── client.ts
│   │   └── index.ts
│   └── auth/                    # Authentication utilities
│       ├── better-auth.ts
│       ├── jwt.ts
│       └── index.ts
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts
│   ├── useTasks.ts
│   └── index.ts
├── types/                       # TypeScript type definitions
│   ├── task.ts
│   └── index.ts
├── middleware.ts                # Route protection middleware
├── public/                      # Static assets (to be created)
├── styles/                      # Global styles (if needed)
├── .env.example                 # Environment variable example
├── .gitignore                   # Git ignore rules
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── postcss.config.ts            # PostCSS configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Project documentation
```

## Key Components

### Authentication System
- `useAuth` hook: Manages authentication state
- `AuthProvider`: Context provider for authentication
- `better-auth.ts`: Integration with Better Auth service
- `middleware.ts`: Route protection logic

### Task Management
- `useTasks` hook: Manages task data and operations
- `api/client.ts`: Centralized API client with JWT handling
- Task components: `TaskItem`, `TaskForm`, `EditTaskForm`

### UI Components
- Base UI components with consistent styling
- Responsive design using Tailwind CSS
- Loading states and empty states
- Form validation and error handling

## API Integration

The frontend communicates with the backend through a centralized API client that:
- Attaches JWT tokens to all requests
- Handles authentication errors
- Provides consistent error handling
- Implements proper loading states

## Environment Variables

The application uses the following environment variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_JWT_SECRET`: JWT secret for validation (must match backend)

## Build and Deployment

The application is built using Next.js App Router with:
- Server-side rendering capabilities
- Client-side hydration
- Optimized bundle sizes
- SEO-friendly structure