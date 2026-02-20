# Quickstart Guide: MCP Server for Task Management

## Prerequisites

- Python 3.13+
- Neon PostgreSQL database instance
- JWT secret for authentication
- Official MCP SDK installed

## Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   export DATABASE_URL="your_neon_postgres_url"
   export JWT_SECRET="your_jwt_secret"
   export JWT_ALGORITHM="HS256"
   ```

4. **Initialize the database**
   ```bash
   python -m app.database init
   ```

## Running the Server

```bash
python -m app.main
```

The MCP server will start and register the following tools:
- `add_task`: Create new tasks
- `list_tasks`: Retrieve user's tasks
- `complete_task`: Mark tasks as completed
- `delete_task`: Remove tasks
- `update_task`: Modify task details

## Testing the Tools

Once the server is running, MCP clients can connect and use the registered tools. Each tool call must include a valid JWT in the Authorization header for user authentication and scoping.

## Environment Configuration

- `DATABASE_URL`: Connection string for Neon PostgreSQL
- `JWT_SECRET`: Secret key for JWT validation
- `JWT_ALGORITHM`: Algorithm used for JWT signing (default: HS256)
- `RATE_LIMIT_REQUESTS`: Number of requests per user per minute (default: 100)
- `RATE_LIMIT_WINDOW`: Time window in seconds for rate limiting (default: 60)

## Development

To run tests:
```bash
pytest tests/
```

To run specific test suites:
```bash
pytest tests/unit/
pytest tests/integration/
pytest tests/contract/
```