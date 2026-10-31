# Budget Tracker - Personal Finance Management App

A full-stack web application for tracking expenses and monthly bills. Built with FastAPI (Python) backend and React (TypeScript) frontend.

## Features

- **User Authentication** - Secure JWT-based authentication with password hashing
- **Expense Tracking** - Add, edit, delete, and filter expenses by category and date
- **Categories** - Grouped presets (Home & bills, Everyday, Car, Health & you, Fun & life, Other), e.g. Rent, Electricity, Water, Internet, Mobile, Fuel, Gifts
- **Overview** - What is left to spend this month, spending by category, and a 6-month trend
- **Quick add** - Add an expense from any page, with one-tap shortcuts for your most-used categories
- **Trips** - Create a trip with dates; expenses dated during it are added to it automatically, with a total and breakdown per trip (they still count in the pay period too)
- **Monthly bills** - Mark an expense as repeating every month; it counts in every month until stopped, with a checklist to tick off what you've paid
- **Responsive Design** - Works beautifully on desktop, tablet, and mobile
- **Light and dark mode** - Follows your system setting

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **JWT** - Secure authentication
- **uv** - Fast Python package manager

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Recharts** - Chart library
- **React Router** - Navigation
- **Axios** - HTTP client

## Project Structure

```
expense-tracker/
├── backend/
│   ├── app/
│   │   ├── routers/         # API endpoints
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # Authentication utilities
│   │   ├── database.py      # Database configuration
│   │   ├── config.py        # Settings
│   │   └── main.py          # FastAPI application
│   ├── alembic/             # Database migrations
│   ├── pyproject.toml       # Python dependencies
│   └── .env                 # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── contexts/        # React contexts
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json         # Node dependencies
│   └── .env                 # Environment variables
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- uv package manager (for Python)

### Backend Setup

1. **Install uv** (if not already installed):
```bash
# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. **Navigate to backend directory**:
```bash
cd backend
```

3. **Create `.env` file** from `.env.example`:
```bash
cp .env.example .env
```

4. **Update `.env`** with your database credentials:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/budget_tracker
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

5. **Install dependencies**:
```bash
uv sync
```

6. **Create database** (using PostgreSQL):
```bash
createdb budget_tracker
```

7. **Run migrations**:
```bash
uv run alembic upgrade head
```

8. **Start the development server**:
```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be running at `http://localhost:8000`

API docs available at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create `.env` file** from `.env.example`:
```bash
cp .env.example .env
```

4. **Update `.env`** if needed:
```env
VITE_API_URL=http://localhost:8000/api
```

5. **Start the development server**:
```bash
npm run dev
```

Frontend will be running at `http://localhost:5173`

## Usage

1. **Create your account** (sign-up is closed; this is a single-user app):
   `cd backend && uv run python -m app.manage set-password you@example.com --name "Your Name"`.
   Run the same command to set a new password if you forget it.
   Once logged in, change it any time from the key icon in the top bar.
2. **Log in** at `/login`
3. **Overview** shows what is left in the current pay period; add income with **Manage**.
   Periods follow the salary, paid on the last working day (Mon to Fri) of each month: a period runs from one payday to the day before the next and is named after the following month (paid Fri 30 Oct, "November" is 30 Oct to 29 Nov). Public holidays are not taken into account.
4. **Add expense** (top right, or the + button on mobile) logs a purchase
5. Turn on **Repeats every month** for rent, subscriptions and bills, then tick them off in **Monthly bills**
6. **Expenses** lists the month's transactions and bills

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/change-password` - Change the logged-in user's password (needs the current one)
- `POST /api/auth/refresh` - Refresh access token

### Expenses
- `GET /api/expenses/` - Get all expenses (with filters); `?month=YYYY-MM-DD` returns that pay period with recurring expenses included
- `GET /api/periods/current`, `GET /api/periods/{YYYY-MM-DD}` - Pay period dates
- `GET /api/expenses/recurring` - Recurring expenses that still apply
- `PUT /api/expenses/{id}/paid` - Tick or untick a recurring expense as paid for a month
- `POST /api/expenses/` - Create expense
- `GET /api/expenses/stats` - Get expense statistics
- `GET /api/expenses/{id}` - Get single expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense

### Categories
- `GET /api/categories/` - Get all categories
- `POST /api/categories/` - Create custom category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Trips
- `GET /api/trips/`, `POST /api/trips/` - List (with totals) and create trips
- `GET|PUT|DELETE /api/trips/{id}` - One trip; deleting keeps its expenses
- `GET /api/expenses/?trip_id={id}` - A trip's expenses

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard summary

## Development

### Backend
```bash
# Format code
uv run black .

# Lint code
uv run ruff check .

# Create new migration
uv run alembic revision --autogenerate -m "Description"

# Apply migrations
uv run alembic upgrade head
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Deployment

### Backend (Render)
1. Create PostgreSQL database on Render
2. Create Web Service
3. Set build command: `uv sync && uv run alembic upgrade head`
4. Set start command: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

### Frontend (Vercel)
1. Import project from GitHub
2. Set framework preset: Vite
3. Add environment variable: `VITE_API_URL=<your-backend-url>/api`
4. Deploy

## Security Features

- Password hashing with bcrypt
- JWT authentication with access and refresh tokens
- CORS configuration
- SQL injection protection via ORM
- Input validation with Pydantic
- Secure token storage

## Future Enhancements

- Expense reports and analytics
- Receipt uploads
- Multi-currency support
- Shared budgets for families
- Mobile app (React Native)
- Dark mode toggle
- Email notifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please open an issue on GitHub.

---

**Happy budgeting!** 💰
