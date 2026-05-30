import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Union

import jwt  # PyJWT or python-jose
from fastapi import Request
from fastapi.responses import RedirectResponse
from sqladmin.authentication import AuthenticationBackend
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import OperationalError, DBAPIError

from app.core.config import settings

# Setup logger for administrative operations
logger = logging.getLogger("flowerspet-admin-auth")

# Mock User class for demonstration as requested
class User:
    id: int
    username: str
    password_hash: str
    is_superuser: bool

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        # Simple secure password verification (mocked or using passlib/bcrypt)
        # For production: return pwd_context.verify(plain_password, hashed_password)
        return plain_password == hashed_password


class AdminAuth(AuthenticationBackend):
    """
    SQLAdmin Authentication Backend.
    Handles admin session state via JWT tokens stored in the request session.
    """

    def __init__(self, secret_key: str):
        super().__init__(secret_key=secret_key)
        self.secret_key = secret_key
        self.algorithm = settings.ALGORITHM

    def _create_token(self, username: str) -> str:
        """Generates a secure JWT authentication token valid for 12 hours."""
        expire = datetime.now(timezone.utc) + timedelta(hours=12)
        payload = {
            "sub": username,
            "exp": expire
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def _decode_token(self, token: str) -> Optional[str]:
        """Decodes the JWT token and returns the subject (username) if valid."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload.get("sub")
        except jwt.PyJWTError as e:
            logger.warning(f"Failed to decode admin JWT token: {e}")
            return None

    async def login(self, request: Request) -> bool:
        """
        Handles admin login request.
        Extracts credentials, queries DB with safety fallbacks, and establishes JWT session.
        """
        form = await request.form()
        username = form.get("username")
        password = form.get("password")

        if not username or not password:
            return False

        # Attempt to retrieve database session/engine if available in app state
        # In case of missing db session, we catch the exception cleanly
        db_session: Optional[AsyncSession] = request.state.db if hasattr(request.state, "db") else None
        
        try:
            if db_session:
                # Real production SQLAlchemy query
                stmt = select(User).where(User.username == username)
                result = await db_session.execute(stmt)
                user = result.scalars().first()
            else:
                # Mock fallback user if SQLAlchemy session is not yet initialized or mocked
                # Allowed for demonstration purposes per instructions
                logger.info("Database session not found in request state, using demo/mock auth.")
                if username == "admin" and password == "admin":
                    user = User(username="admin", password_hash="admin", is_superuser=True)
                else:
                    user = None

            if not user:
                logger.warning(f"Admin login failed: user '{username}' not found.")
                return False

            if not User.verify_password(password, user.password_hash):
                logger.warning(f"Admin login failed: incorrect password for user '{username}'.")
                return False

            if not user.is_superuser:
                logger.warning(f"Admin login failed: user '{username}' is not a superuser.")
                return False

            # Update session with secure JWT token
            token = self._create_token(username)
            request.session.update({"token": token})
            logger.info(f"Admin user '{username}' logged in successfully.")
            return True

        except (OperationalError, DBAPIError) as conn_err:
            logger.error(f"PostgreSQL connection error during admin login: {conn_err}")
            # Raise or handle connection error gracefully
            return False
        except Exception as e:
            logger.error(f"Unexpected error during admin login: {e}")
            return False

    async def logout(self, request: Request) -> bool:
        """
        Clears the JWT token from the session, logging the administrator out.
        """
        request.session.clear()
        logger.info("Admin session cleared (logged out).")
        return True

    async def authenticate(self, request: Request) -> Union[bool, RedirectResponse]:
        """
        Authenticates incoming admin page requests by validating the session JWT.
        """
        token = request.session.get("token")
        if not token:
            logger.debug("No token found in session. Redirecting to admin login.")
            return RedirectResponse(request.url_for("admin:login"))

        username = self._decode_token(token)
        if not username:
            logger.warning("Invalid token in session. Redirecting to admin login.")
            request.session.clear()
            return RedirectResponse(request.url_for("admin:login"))

        db_session: Optional[AsyncSession] = request.state.db if hasattr(request.state, "db") else None

        try:
            if db_session:
                stmt = select(User).where(User.username == username)
                result = await db_session.execute(stmt)
                user = result.scalars().first()
            else:
                # Mock fallback
                user = User(username="admin", is_superuser=True)

            if not user or not user.is_superuser:
                logger.warning(f"Admin verification failed for user '{username}'. is_superuser: {getattr(user, 'is_superuser', False)}")
                request.session.clear()
                return RedirectResponse(request.url_for("admin:login"))

            return True

        except (OperationalError, DBAPIError) as conn_err:
            logger.error(f"PostgreSQL connection error during admin authentication: {conn_err}")
            # Return False to deny access safely without crashing the backend
            return False
        except Exception as e:
            logger.error(f"Unexpected error during admin authentication: {e}")
            return False
