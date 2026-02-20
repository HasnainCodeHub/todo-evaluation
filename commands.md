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
uv run uvicorn backend.app.main:app --reload --port 8000
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

## AI Chatbot Integration

The application includes an AI chatbot that allows natural language task management using Gemini 2.5 Flash.

### Chat Endpoint

Send chat messages to the AI agent:
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "message": "Add a task to buy groceries",
    "conversation_id": null
  }'
```

### Example Chat Operations

#### Create a task
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "message": "Add a task to buy groceries",
    "conversation_id": null
  }'
```

#### List tasks
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "message": "What tasks do I have?",
    "conversation_id": null
  }'
```

#### Complete a task
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "message": "Mark task 1 as completed",
    "conversation_id": null
  }'
```

#### Update a task
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "message": "Change task 1 to buy organic groceries",
    "conversation_id": null
  }'
```

#### Delete a task
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "message": "Delete task 1",
    "conversation_id": null
  }'
```

### Conversation Management

#### List all conversations for a user
```bash
curl -X GET http://localhost:8000/api/conversations \
  -H "Authorization: Bearer <jwt_token>"
```

#### Delete a conversation
```bash
curl -X DELETE http://localhost:8000/api/conversations/<conversation_id> \
  -H "Authorization: Bearer <jwt_token>"
```

## Authentication

### Get JWT Token from Session

Convert Better Auth session to JWT for API calls:
```bash
curl -X GET http://localhost:8000/api/auth/jwt \
  -H "Cookie: better-auth.session-token=<session_cookie>"
```

## Testing

### Run Backend Tests

```bash
cd backend && pytest
```

### Run Specific Test Files

```bash
cd backend && pytest tests/test_auth.py
cd backend && pytest tests/test_task_service.py
cd backend && pytest tests/integration/
```

### Curl Tests for Task Management

#### Traditional Task API (Direct CRUD)
```bash
# Create task
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"title": "Test task", "description": "Test description"}'

# List tasks
curl -X GET http://localhost:8000/api/tasks \
  -H "Authorization: Bearer <jwt_token>"

# Update task
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"title": "Updated task", "description": "Updated description"}'

# Complete task
curl -X PATCH http://localhost:8000/api/tasks/1/complete \
  -H "Authorization: Bearer <jwt_token>"

# Delete task
curl -X DELETE http://localhost:8000/api/tasks/1 \
  -H "Authorization: Bearer <jwt_token>"
```

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with:

```env
DATABASE_URL=postgresql://username:password@localhost/dbname
JWT_SECRET=your-jwt-secret-key
JWT_ALGORITHM=HS256
GOOGLE_API_KEY=your-google-api-key
CHAT_MODEL=gemini-2.5-flash
CHAT_CONTEXT_LIMIT=20
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-jwt-secret-key
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=your-postgresql-connection-string
```

**Note**: `BETTER_AUTH_SECRET` must match the `JWT_SECRET` in the backend for token verification.

## Database Operations

### Initialize Database Tables

The application automatically initializes database tables on startup via the lifespan context manager.

### Migration Commands (if using Alembic)

```bash
# Create migration
cd backend && alembic revision --autogenerate -m "migration message"

# Apply migrations
cd backend && alembic upgrade head
```