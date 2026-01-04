from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Determine connect_args based on database type
# For PostgreSQL with asyncpg: disable prepared statements for pgBouncer compatibility
# For SQLite: no special connect_args needed
connect_args = {}
if settings.DATABASE_URL.startswith("postgresql"):
    connect_args = {
        "statement_cache_size": 0,  # Disable prepared statements for pgBouncer
        "prepared_statement_cache_size": 0,
    }

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    future=True,
    connect_args=connect_args,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db():
    """Dependency for getting async database sessions"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
