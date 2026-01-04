# Commands

## Backend

Start the FastAPI backend server:

```bash
uvicorn backend.app.main:app --reload
```

The server will be available at `http://localhost:8000`.

### Options

- `--reload`: Auto-reload on code changes (development)
- `--host 0.0.0.0`: Bind to all interfaces
- `--port 8000`: Specify port (default: 8000)

### Example with custom port

```bash
uvicorn backend.app.main:app --reload --port 8000
```

## Frontend

Start the Next.js frontend development server:

```bash
cd frontend && npm run dev
```

The application will be available at `http://localhost:3000`.

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=your-postgresql-connection-string
```

**Note**: `BETTER_AUTH_SECRET` must match the `JWT_SECRET` in the backend for token verification.

## Full Stack Development

To run both backend and frontend together, use two terminal windows:

**Terminal 1 (Backend)**:
```bash
uvicorn backend.app.main:app --reload
```

**Terminal 2 (Frontend)**:
```bash
cd frontend && npm run dev
```