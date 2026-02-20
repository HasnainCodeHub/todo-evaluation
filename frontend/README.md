# AI-Based Todo Application - Frontend

This is the frontend component of the AI-Based Todo Application, built with Next.js, TypeScript, and Tailwind CSS. It provides a modern, responsive interface for managing tasks with AI assistance.

## Features

- **User Authentication**: Sign up and sign in functionality with JWT-based authentication
- **Task Management**: Create, read, update, and delete tasks
- **Task Completion**: Mark tasks as complete/incomplete
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Immediate feedback after operations (after successful API responses)
- **Error Handling**: User-friendly error messages and validation
- **Clean UI**: Modern interface with Tailwind CSS styling

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5.6+
- **Styling**: Tailwind CSS
- **Authentication**: Better Auth
- **Icons**: Heroicons
- **State Management**: React Hooks

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with AuthProvider
│   ├── page.tsx            # Landing page
│   ├── signin/             # Authentication pages
│   │   └── page.tsx
│   └── dashboard/          # Protected dashboard page
│       └── page.tsx
├── components/             # Reusable React components
│   ├── ui/                 # Base UI components (Button, Input, etc.)
│   ├── auth/               # Authentication components
│   └── tasks/              # Task-specific components
├── lib/                    # Shared utilities and API client
│   ├── api/                # API client with JWT attachment
│   └── auth/               # Authentication utilities
├── hooks/                  # Custom React hooks (useAuth, useTasks)
├── types/                  # TypeScript type definitions
├── middleware.ts           # Route protection middleware
└── package.json            # Dependencies and scripts
```

## Environment Variables

Create a `.env.local` file in the frontend directory with the following:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend API URL
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret      # JWT secret (must match backend)
```

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your environment variables (see above)

4. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:3000

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

## API Integration

The frontend communicates with the backend API through a centralized API client that:

- Attaches JWT tokens to all requests in the Authorization header
- Handles 401/403 responses by redirecting to the sign-in page
- Provides centralized error handling
- Implements proper loading states

## Authentication Flow

1. Users sign up/sign in through the authentication pages
2. Better Auth manages the session and JWT token
3. JWT tokens are attached to all API requests automatically
4. Middleware protects routes that require authentication
5. Sessions persist across page reloads

## Security Measures

- JWT tokens are securely attached to all API requests
- Route protection middleware prevents unauthorized access
- Input validation on forms
- Proper error handling without exposing sensitive information
- CSRF protection through Better Auth

## Development Guidelines

- All UI updates occur AFTER successful API responses (no optimistic updates)
- Components are designed to be reusable and follow atomic design principles
- TypeScript is used throughout for type safety
- Tailwind CSS utility classes are preferred over custom CSS
- Hooks are used for state management and API interactions