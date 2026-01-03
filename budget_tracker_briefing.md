# Budget Tracker Web App - Complete Development Brief

## Project Overview
Create a modern, visually appealing personal budget tracking web application with smooth animations, gradients, and a polished UI. Users can log in, track expenses by category, and maintain a wishlist with product links and prices. Built with FastAPI backend (using uv + pyproject.toml) for full control and Python-based logic.

---

## Core Features

### 1. User Authentication
- User registration (email/password)
- Login/logout functionality (JWT tokens)
- Password reset capability
- Secure session management
- Token refresh mechanism

### 2. Expense Tracking
- Add expense entries with:
  - Amount
  - Category (dropdown selection)
  - Date
  - Description/notes (optional)
- View all expenses in a list/table
- Edit existing expenses
- Delete expenses
- Filter expenses by:
  - Date range
  - Category
- Display total spending overall and by category

### 3. Categories
- Pre-set categories: Food, Transport, Shopping, Bills, Entertainment, Health, Other
- Ability to add custom categories
- Edit/delete custom categories

### 4. Wishlist
- Add wishlist items with:
  - Item name
  - Price
  - Product URL/link
  - Notes (optional)
- View all wishlist items
- Mark items as purchased (moves to expenses)
- Edit wishlist items
- Delete wishlist items
- Display total wishlist value

### 5. Dashboard
- Overview showing:
  - Total expenses this month
  - Spending by category (chart/graph)
  - Recent transactions (last 5-10)
  - Wishlist total

---

## Technical Stack

### Frontend
- **Framework:** React 18+
- **Styling:** Tailwind CSS
- **Icons:** Lucide React or Heroicons
- **Animations:** Framer Motion
- **Charts:** Recharts or Chart.js
- **HTTP Client:** Axios
- **Build Tool:** Vite
- **Hosting:** Vercel

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Package Manager:** uv (modern, fast Python package manager)
- **Project Config:** pyproject.toml
- **ORM:** SQLAlchemy 2.0+
- **Migrations:** Alembic
- **Validation:** Pydantic v2
- **Authentication:** Python-Jose (JWT)
- **Password Hashing:** Passlib + Bcrypt
- **Database Driver:** Asyncpg (async PostgreSQL)
- **ASGI Server:** Uvicorn
- **Hosting:** Render or Railway

### Database
- **Database:** PostgreSQL 15+
- **Hosting:** Render or Railway (free tier)

---

## Backend Project Structure

```
backend/
├── pyproject.toml           # Project dependencies and config
├── uv.lock                  # Lock file (auto-generated)
├── .env                     # Environment variables (not in git)
├── .env.example             # Example env file
├── .gitignore
├── README.md
├── alembic/                 # Database migrations
│   ├── env.py
│   ├── versions/
│   └── alembic.ini
└── app/
    ├── __init__.py
    ├── main.py              # FastAPI app entry point
    ├── config.py            # Settings (from .env)
    ├── database.py          # Database connection & session
    ├── models.py            # SQLAlchemy models
    ├── schemas.py           # Pydantic schemas
    ├── auth.py              # JWT utilities
    ├── dependencies.py      # Dependency injection (get_current_user)
    ├── utils.py             # Helper functions
    └── routers/
        ├── __init__.py
        ├── auth.py          # Authentication endpoints
        ├── expenses.py      # Expense CRUD
        ├── categories.py    # Category CRUD
        ├── wishlist.py      # Wishlist CRUD
        └── dashboard.py     # Dashboard aggregations
```

---

## Backend Setup with uv

### pyproject.toml Configuration

```toml
[project]
name = "budget-tracker-api"
version = "0.1.0"
description = "Budget tracking API with FastAPI"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "sqlalchemy>=2.0.25",
    "alembic>=1.13.1",
    "asyncpg>=0.29.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.6",
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "httpx>=0.26.0",
    "black>=24.1.0",
    "ruff>=0.1.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 88
target-version = "py311"

[tool.black]
line-length = 88
target-version = ['py311']
```

### Backend Setup Commands

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create backend project
mkdir budget-tracker-backend
cd budget-tracker-backend

# Initialize uv project
uv init

# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Create database migrations
uv run alembic revision --autogenerate -m "Initial migration"
uv run alembic upgrade head

# Run with production server
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create new user
  - Request: `{ email, password, full_name? }`
  - Response: `{ id, email, full_name, created_at }`
  
- `POST /login` - Login and get JWT tokens
  - Request: `{ email, password }`
  - Response: `{ access_token, refresh_token, token_type: "bearer" }`
  
- `POST /refresh` - Refresh access token
  - Request: `{ refresh_token }`
  - Response: `{ access_token, token_type: "bearer" }`
  
- `POST /password-reset` - Request password reset
  - Request: `{ email }`
  - Response: `{ message }`
  
- `POST /password-reset/confirm` - Confirm password reset
  - Request: `{ token, new_password }`
  - Response: `{ message }`

### Expenses (`/api/expenses`)
- `GET /` - Get all user expenses
  - Query params: `date_from?, date_to?, category?, skip?, limit?`
  - Response: `[{ id, amount, category, date, description, created_at }]`
  
- `POST /` - Create new expense
  - Request: `{ amount, category, date, description? }`
  - Response: `{ id, amount, category, date, description, created_at }`
  
- `GET /{expense_id}` - Get single expense
  - Response: `{ id, amount, category, date, description, created_at }`
  
- `PUT /{expense_id}` - Update expense
  - Request: `{ amount?, category?, date?, description? }`
  - Response: `{ id, amount, category, date, description, updated_at }`
  
- `DELETE /{expense_id}` - Delete expense
  - Response: `{ message }`
  
- `GET /stats` - Get expense statistics
  - Query params: `date_from?, date_to?`
  - Response: `{ total, by_category: { category: total }, count }`

### Categories (`/api/categories`)
- `GET /` - Get all categories (default + user custom)
  - Response: `[{ id, name, icon, color, is_custom }]`
  
- `POST /` - Create custom category
  - Request: `{ name, icon, color }`
  - Response: `{ id, name, icon, color, is_custom: true }`
  
- `PUT /{category_id}` - Update category
  - Request: `{ name?, icon?, color? }`
  - Response: `{ id, name, icon, color, is_custom }`
  
- `DELETE /{category_id}` - Delete custom category
  - Response: `{ message }`

### Wishlist (`/api/wishlist`)
- `GET /` - Get all wishlist items
  - Response: `[{ id, item_name, price, url, notes, created_at }]`
  
- `POST /` - Create wishlist item
  - Request: `{ item_name, price, url, notes? }`
  - Response: `{ id, item_name, price, url, notes, created_at }`
  
- `GET /{item_id}` - Get single item
  - Response: `{ id, item_name, price, url, notes, created_at }`
  
- `PUT /{item_id}` - Update item
  - Request: `{ item_name?, price?, url?, notes? }`
  - Response: `{ id, item_name, price, url, notes, updated_at }`
  
- `DELETE /{item_id}` - Delete item
  - Response: `{ message }`
  
- `POST /{item_id}/purchase` - Mark as purchased
  - Request: `{ purchase_date?, category? }`
  - Response: `{ expense_id, message }`
  
- `GET /total` - Get total wishlist value
  - Response: `{ total, count }`

### Dashboard (`/api/dashboard`)
- `GET /overview` - Get dashboard summary
  - Response: `{ 
      total_expenses_month, 
      expenses_by_category: [{ category, total, percentage }],
      recent_transactions: [...],
      wishlist_total,
      wishlist_count
    }`

---

## Database Schema (SQLAlchemy Models)

### User Model
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    wishlist_items = relationship("Wishlist", back_populates="user", cascade="all, delete-orphan")
```

### Expense Model
```python
class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    category = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="expenses")
    
    # Indexes
    __table_args__ = (
        Index('ix_expenses_user_date', 'user_id', 'date'),
        Index('ix_expenses_user_category', 'user_id', 'category'),
    )
```

### Category Model
```python
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Null for default categories
    name = Column(String, nullable=False)
    icon = Column(String, nullable=False)
    color = Column(String, nullable=False)
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="categories")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='uq_user_category_name'),
    )
```

### Wishlist Model
```python
class Wishlist(Base):
    __tablename__ = "wishlist"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    item_name = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="wishlist_items")
```

---

## Security Implementation

### Backend Security
1. **JWT Authentication:**
   - Access tokens (15-30 min expiry)
   - Refresh tokens (7 days expiry)
   - HS256 algorithm
   - Secure secret key from environment

2. **Password Security:**
   - Bcrypt hashing with salt
   - Minimum password length: 8 characters
   - Password complexity validation

3. **CORS Configuration:**
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://your-frontend.vercel.app"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

4. **SQL Injection Protection:**
   - Use SQLAlchemy ORM (parameterized queries)
   - Never use raw SQL with user input

5. **Rate Limiting:**
   - Implement on auth endpoints (login, register)
   - Use slowapi or similar library

6. **Input Validation:**
   - Pydantic models for all requests
   - Strict type checking
   - Length limits on strings

### Frontend Security
1. **Token Storage:**
   - Store JWT in httpOnly cookies (preferred) OR
   - LocalStorage with XSS precautions
   - Never store in plain sessionStorage

2. **API Calls:**
   - Always include Authorization header
   - Handle 401 responses (token expired)
   - Auto-refresh tokens

3. **Input Validation:**
   - Client-side validation (UX)
   - Never trust client-side only
   - Sanitize all inputs

---

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:port/dbname

# JWT
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
FRONTEND_URL=https://your-app.vercel.app

# Environment
ENVIRONMENT=development  # or production
```

### Frontend (.env)
```env
VITE_API_URL=https://your-api.onrender.com/api
```

---

## Design Requirements

### Color Palette
- **Primary Gradient:** `bg-gradient-to-r from-purple-600 to-blue-600`
- **Accent Gradient:** `bg-gradient-to-r from-pink-500 to-orange-500`
- **Success:** `#10b981` (green-500)
- **Error:** `#ef4444` (red-500)
- **Warning:** `#f59e0b` (amber-500)
- **Background (Dark):** `#0f172a` (slate-900)
- **Background (Light):** `#f8fafc` (slate-50)
- **Text (Dark):** `#1e293b` (slate-800)
- **Text (Light):** `#f1f5f9` (slate-100)

### Typography
- **Font Family:** Inter, Poppins, or Plus Jakarta Sans (from Google Fonts)
- **Headings:** 
  - H1: 2.5rem (40px), font-bold
  - H2: 2rem (32px), font-semibold
  - H3: 1.5rem (24px), font-semibold
- **Body:** 1rem (16px), font-normal
- **Small:** 0.875rem (14px), font-normal

### Icons & Categories
**Default Categories with Icons:**
- 🍔 Food - `text-orange-500`
- 🚗 Transport - `text-blue-500`
- 🛍️ Shopping - `text-pink-500`
- 💡 Bills - `text-yellow-500`
- 🎮 Entertainment - `text-purple-500`
- ❤️ Health - `text-red-500`
- 📚 Education - `text-green-500`
- ✨ Other - `text-gray-500`

### Component Styling

**Cards:**
```css
/* Glassmorphism Effect */
bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl
```

**Buttons:**
```css
/* Primary */
bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
text-white font-semibold px-6 py-3 rounded-xl
transition-all duration-200 hover:scale-105

/* Secondary */
bg-white/10 backdrop-blur-sm border border-white/20
hover:bg-white/20 text-white
```

**Inputs:**
```css
bg-white/5 border border-white/10 rounded-lg px-4 py-3
focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
transition-all duration-200
```

### Animations (Framer Motion)

**Page Transitions:**
```javascript
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};
```

**List Animations:**
```javascript
const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const listItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};
```

**Button Hover:**
```javascript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
```

**Modal:**
```javascript
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};
```

### Responsive Breakpoints
- **Mobile:** `< 640px` (sm)
- **Tablet:** `640px - 1024px` (sm to lg)
- **Desktop:** `> 1024px` (lg+)

### Layout Specifications

**Mobile (< 640px):**
- Single column layout
- Bottom navigation bar (fixed)
- Full-width cards with 16px padding
- Stack form fields vertically
- Hide sidebar, show hamburger menu

**Tablet (640px - 1024px):**
- Two-column grid where appropriate
- Bottom navigation or compact sidebar
- Cards in grid (2 columns)

**Desktop (> 1024px):**
- Sidebar navigation (250px width, fixed)
- Multi-column layouts (3-4 columns)
- Hover effects prominent
- Larger cards with more spacing

---

## Page Specifications

### 1. Login Page (`/login`)
**Layout:**
- Centered card (max-width: 400px)
- Gradient animated background
- Logo at top
- Form fields: email, password
- "Remember me" checkbox
- Login button (full width, gradient)
- Link to register page
- "Forgot password?" link

**Animations:**
- Card slides up + fades in on mount
- Background gradient slowly animates
- Input fields: focus ring animation
- Button: hover scale + ripple on click

### 2. Register Page (`/register`)
**Layout:**
- Similar to login
- Additional field: full name
- Terms & conditions checkbox
- Register button
- Link to login page

### 3. Dashboard (`/dashboard`)
**Layout:**
- Header: "Welcome back, [Name]" with gradient text
- 4 stat cards in grid:
  - Total expenses (this month)
  - Highest category
  - Wishlist total
  - Savings (if applicable)
- Donut chart: Spending by category
- Recent transactions list (5 items)
- Quick action buttons: "Add Expense", "Add Wishlist Item"

**Animations:**
- Stat cards: counter animation (count up)
- Chart: animate draw on mount
- List items: stagger animation
- Quick action buttons: pulse animation

### 4. Expenses Page (`/expenses`)
**Layout:**
- Header with "Expenses" title
- Filter bar: Date range picker, Category dropdown
- Total expenses display (prominent)
- Expense cards/list:
  - Category icon + color badge
  - Amount (large, bold)
  - Date + description
  - Edit/delete icons (on hover)
- Floating action button (bottom right): Add expense
- Empty state: Illustration + "No expenses yet"

**Animations:**
- Filter chips: slide animation on select
- Expense cards: stagger on load, slide out on delete
- FAB: scale on hover, rotate on click
- Modal: backdrop fade + content scale

### 5. Wishlist Page (`/wishlist`)
**Layout:**
- Header with "Wishlist" title
- View toggle: Grid / List
- Total wishlist value (card at top)
- Wishlist items (grid or list):
  - Item image placeholder
  - Item name
  - Price (gradient text)
  - URL link icon
  - "Mark as purchased" button
  - Edit/delete icons
- Add button (FAB or top right)

**Animations:**
- Grid/List toggle: smooth transition
- Items: fade + scale on load
- "Mark as purchased": confetti animation
- Total value: counter animation

### 6. Categories Page (`/categories`)
**Layout:**
- Header with "Categories" title
- Default categories section (read-only)
- Custom categories section
- Each category card:
  - Large icon
  - Name
  - Color preview
  - Edit/delete (for custom only)
- Add category button

**Animations:**
- Categories: drag to reorder (with animation)
- Add/Edit modal: slide up from bottom
- Delete: shake animation + confirm dialog

### 7. Settings Page (`/settings`)
**Layout:**
- Profile section: Name, email, change password
- Preferences: Dark mode toggle, currency
- Danger zone: Delete account

**Animations:**
- Toggle switch: smooth slide
- Save button: success checkmark animation

---

## Mobile-Specific Features

### Bottom Navigation (< 1024px)
**Items:**
- Dashboard (home icon)
- Expenses (receipt icon)
- Wishlist (heart icon)
- Categories (grid icon)
- Profile (user icon)

**Design:**
- Fixed bottom position
- Glass morphism background
- Active state: gradient background + icon scale
- Haptic feedback on tap (if available)

### Swipe Gestures
- Swipe left on expense/wishlist item: Delete
- Pull to refresh on lists
- Swipe between tabs (if applicable)

### Touch Optimizations
- Minimum tap target: 44x44px
- Larger buttons and form fields
- Bottom sheet modals (instead of centered)
- Haptic feedback for important actions

---

## Additional Features

### Loading States
**Skeleton Screens:**
- Use for lists (expenses, wishlist)
- Animated shimmer effect
- Match actual content layout

**Spinners:**
- Use for button actions
- Small, inline spinners for quick actions
- Full-page spinner for initial load

### Empty States
**Design:**
- Centered illustration (SVG)
- Friendly message: "No expenses yet. Start tracking!"
- Call-to-action button
- Subtle animation (float or pulse)

### Toast Notifications
**Types:**
- Success: Green background, checkmark icon
- Error: Red background, X icon
- Warning: Yellow background, alert icon
- Info: Blue background, info icon

**Behavior:**
- Slide in from top
- Auto-dismiss after 3 seconds
- Swipe up to dismiss
- Stack multiple toasts

### Error Handling
**API Errors:**
- Display user-friendly messages
- Log technical details to console
- Show retry button for network errors
- Redirect to login on 401 errors

**Form Validation:**
- Real-time validation (on blur)
- Display errors below field
- Shake animation on submit with errors
- Disable submit button until valid

---

## Testing Requirements

### Backend Testing
- Unit tests for auth utilities
- Integration tests for API endpoints
- Test database operations (CRUD)
- Test authentication flow
- Test error handling

### Frontend Testing (Optional)
- Component tests (Jest + React Testing Library)
- E2E tests (Playwright or Cypress)
- Test responsive layouts
- Test animations (basic functionality)

---

## Deployment Instructions

### Backend Deployment (Render)

1. **Create Render Account** (free tier)

2. **Create PostgreSQL Database:**
   - Go to "New +" → "PostgreSQL"
   - Name: `budget-tracker-db`
   - Region: Choose closest to you
   - Instance Type: Free
   - Copy internal database URL

3. **Create Web Service:**
   - Go to "New +" → "Web Service"
   - Connect GitHub repo (backend)
   - Name: `budget-tracker-api`
   - Environment: Python 3
   - Build Command: `uv sync && uv run alembic upgrade head`
   - Start Command: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Instance Type: Free

4. **Set Environment Variables:**
   ```
   DATABASE_URL=<your-postgres-internal-url>
   SECRET_KEY=<generate-random-32-char-string>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   FRONTEND_URL=https://your-app.vercel.app
   ENVIRONMENT=production
   ```

5. **Deploy:** Render will auto-deploy on git push

### Frontend Deployment (Vercel)

1. **Create Vercel Account** (free tier)

2. **Import Project:**
   - Click "New Project"
   - Import GitHub repo (frontend)
   - Framework: Vite (auto-detected)

3. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-api.onrender.com/api
   ```

4. **Deploy:** Vercel auto-deploys on git push

5. **Update CORS:** Update backend FRONTEND_URL with Vercel URL

---

## Timeline Estimate

### Week 1: Backend Foundation
- **Day 1-2:** Setup (uv, pyproject.toml, database, models)
- **Day 3:** Authentication (register, login, JWT)
- **Day 4:** Expenses CRUD endpoints
- **Day 5:** Wishlist CRUD endpoints
- **Day 6:** Categories + Dashboard endpoints
- **Day 7:** Testing & deployment

### Week 2: Frontend Core
- **Day 1-2:** Setup (React, Tailwind, routing, design system)
- **Day 3:** Authentication pages (login, register)
- **Day 4:** Dashboard page (charts, stats)
- **Day 5:** Expenses page (list, add, edit, delete)
- **Day 6:** Wishlist page
- **Day 7:** Categories page

### Week 3: Polish & Mobile
- **Day 1-2:** Animations (Framer Motion throughout)
- **Day 3:** Mobile optimization (bottom nav, responsive)
- **Day 4:** Loading states, empty states, error handling
- **Day 5:** Settings page, dark mode
- **Day 6:** Testing & bug fixes
- **Day 7:** Final deployment & documentation

**Total: 3 weeks** (can be faster with parallel work)

---

## Success Criteria

### Functionality
- ✅ Users can register and login
- ✅ Users can add, edit, delete expenses
- ✅ Expenses are filterable by date and category
- ✅ Users can manage wishlist items
- ✅ Wishlist items can be marked as purchased
- ✅ Dashboard shows accurate statistics
- ✅ Custom categories can be created
- ✅ All data is user-specific and secure

### Design
- ✅ Modern UI with gradients and glassmorphism
- ✅ Smooth animations throughout
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Dark mode support
- ✅ Consistent icon usage
- ✅ Professional typography and spacing

### Performance
- ✅ Page load time < 2 seconds
- ✅ API response time < 500ms (average)
- ✅ Smooth 60fps animations
- ✅ No layout shifts

### Security
- ✅ JWT authentication working
- ✅ Passwords securely hashed
- ✅ CORS properly configured
- ✅ SQL injection protected
- ✅ XSS protection in place

---

## Future Enhancements (Phase 2)

### Advanced Features
1. **Budget Limits:**
   - Set monthly budget per category
   - Visual progress bars
   - Alerts when nearing/exceeding

2. **Recurring Expenses:**
   - Add recurring transactions (monthly bills)
   - Auto-create on schedule
   - Manage/pause recurring items

3. **Reports & Analytics:**
   - Monthly/yearly reports
   - Spending trends (line charts)
   - Export to PDF/CSV
   - Email reports

4. **Receipt Uploads:**
   - Upload receipt images
   - OCR text extraction (optional)
   - Attach to expenses

5. **Multi-Currency:**
   - Support multiple currencies
   - Currency conversion
   - Set default currency

6. **Shared Budgets:**
   - Invite family members
   - Shared expense tracking
   - Permission levels

7. **Mobile App:**
   - React Native version
   - Push notifications
   - Offline mode

8. **AI Features:**
   - Spending predictions (ML)
   - Anomaly detection
   - Smart categorization

### Technical Improvements
- Redis caching for dashboard
- WebSocket for real-time updates
- Background jobs (Celery)
- Advanced search (Elasticsearch)
- API rate limiting (Redis)
- Monitoring (Sentry, DataDog)

---

## Resources & Documentation

### Backend
- FastAPI: https://fastapi.tiangolo.com
- uv: https://docs.astral.sh/uv/
- SQLAlchemy: https://docs.sqlalchemy.org
- Alembic: https://alembic.sqlalchemy.org
- Pydantic: https://docs.pydantic.dev

### Frontend
- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Framer Motion: https://www.framer.com/motion/
- Lucide Icons: https://lucide.dev
- Recharts: https://recharts.org

### Hosting
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs

---

## Support & Maintenance

### Monitoring
- Set up error tracking (Sentry)
- Monitor API response times
- Track user activity (basic analytics)
- Set up uptime monitoring (UptimeRobot)

### Backups
- Enable automatic database backups (Render)
- Export data regularly (CSV backups)
- Version control (Git)

### Updates
- Keep dependencies updated (uv, npm)
- Security patches (monthly)
- Feature updates (quarterly)

---

## Contact & Feedback

- **Bug Reports:** GitHub Issues
- **Feature Requests:** GitHub Discussions
- **Questions:** Email or Discord (if applicable)

---

## License

MIT License (or your preferred license)

---

**End of Brief**

This document serves as the complete specification for building the Budget Tracker Web App. All developers should refer to this as the single source of truth for project requirements, design, and implementation details.
