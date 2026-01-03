# Budget Tracker API

Backend API for the Budget Tracker application built with FastAPI and PostgreSQL.

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- uv package manager

### Installation

1. Install uv (if not already installed):
```bash
# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your database credentials and settings.

4. Install dependencies:
```bash
uv sync
```

5. Run database migrations:
```bash
uv run alembic upgrade head
```

### Running the Development Server

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

Alternative API documentation (ReDoc): `http://localhost:8000/redoc`

## Database Migrations

### Create a new migration

```bash
uv run alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations

```bash
uv run alembic upgrade head
```

### Rollback migrations

```bash
uv run alembic downgrade -1
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/password-reset` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset

### Expenses
- `GET /api/expenses/` - Get all expenses (with filters)
- `POST /api/expenses/` - Create new expense
- `GET /api/expenses/stats` - Get expense statistics
- `GET /api/expenses/{id}` - Get single expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense

### Categories
- `GET /api/categories/` - Get all categories
- `POST /api/categories/` - Create custom category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Wishlist
- `GET /api/wishlist/` - Get all wishlist items
- `POST /api/wishlist/` - Create wishlist item
- `GET /api/wishlist/total` - Get wishlist total
- `GET /api/wishlist/{id}` - Get single item
- `PUT /api/wishlist/{id}` - Update item
- `DELETE /api/wishlist/{id}` - Delete item
- `POST /api/wishlist/{id}/purchase` - Mark as purchased

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard summary

## Development

### Code Formatting

```bash
uv run black .
```

### Linting

```bash
uv run ruff check .
```

## Deployment

### Using Render

1. Create a PostgreSQL database on Render
2. Create a new Web Service
3. Set build command: `uv sync && uv run alembic upgrade head`
4. Set start command: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.example`

## License

MIT
