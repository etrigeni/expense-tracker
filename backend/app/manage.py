"""Account administration. Sign-up and password reset are closed, so the account is managed here.

Create the account, or set a new password for it:
    uv run python -m app.manage set-password you@example.com

Runs against the database in DATABASE_URL (backend/.env).
"""

import argparse
import asyncio
import getpass

from sqlalchemy import select

from app.auth import get_password_hash
from app.database import AsyncSessionLocal
from app.models import User

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 72  # bcrypt ignores anything longer


def ask_password() -> str:
    password = getpass.getpass("New password: ")
    if not MIN_PASSWORD_LENGTH <= len(password) <= MAX_PASSWORD_LENGTH:
        raise SystemExit(f"Password must be {MIN_PASSWORD_LENGTH} to {MAX_PASSWORD_LENGTH} characters.")
    if getpass.getpass("Repeat it: ") != password:
        raise SystemExit("Passwords do not match.")
    return password


async def set_password(email: str, full_name: str | None) -> None:
    password = ask_password()
    async with AsyncSessionLocal() as session:
        user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if user is None:
            session.add(User(email=email, full_name=full_name, hashed_password=get_password_hash(password)))
            action = "Created account"
        else:
            user.hashed_password = get_password_hash(password)
            action = "Password updated"
        await session.commit()
    print(f"{action} for {email}.")


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.manage", description=__doc__.splitlines()[0])
    commands = parser.add_subparsers(dest="command", required=True)
    set_pw = commands.add_parser("set-password", help="Create the account, or set a new password for it")
    set_pw.add_argument("email")
    set_pw.add_argument("--name", help="Full name, used only when creating the account")
    args = parser.parse_args()

    if args.command == "set-password":
        asyncio.run(set_password(args.email.strip(), args.name))


if __name__ == "__main__":
    main()
