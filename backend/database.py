# database.py
# Sets up the async SQLAlchemy database connection for FastAPI.
#
# Supported Databases:
# 1. SQLite (Default): sqlite+aiosqlite:///./spendwise.db
# 2. PostgreSQL (Cloud/Production): postgresql+asyncpg://user:pass@host/db
#
# Switching between SQLite and PostgreSQL only requires changing DATABASE_URL in .env!

import os
from typing import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

load_dotenv()

# Read DATABASE_URL from .env or default to local SQLite database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./spendwise.db")

# Automatically ensure asyncpg driver prefix for PostgreSQL URLs (e.g. from Neon / Supabase)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Clean up pgbouncer query param for asyncpg compatibility if present
if "?pgbouncer=true" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "")
elif "&pgbouncer=true" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("&pgbouncer=true", "")

# Engine connection arguments
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
elif "postgresql" in DATABASE_URL or "postgres" in DATABASE_URL:
    # Disable prepared statement cache for Supabase pooler (PgBouncer compatibility)
    connect_args = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }

# Create async SQLAlchemy engine
engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# Declarative Base for all ORM models
class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async SQLAlchemy session.
    Automatically commits/rollbacks and guarantees the session closes.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def connect_db():
    """
    Runs on FastAPI startup to automatically create all database tables
    if they do not already exist.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables initialized successfully (SQLAlchemy Async)")
    except Exception as e:
        print(f"❌ Database initialization error: {e}")


async def disconnect_db():
    """
    Runs on FastAPI shutdown to cleanly dispose of the engine connection pool.
    """
    if engine:
        await engine.dispose()
        print("✅ Database connection closed")
