# Parent–Child Bonding Game

Learning and party games for friends, parents, and children.

- [Product plan](docs/PRODUCT_PLAN.md)
- [FastAPI authentication backend: setup, routes, testing, and email limitations](backend/README.md)

## Frontend

The existing Next.js application is currently a starter. Frontend work is outside the authentication
backend change.

```sh
npm ci
npm run dev
```

## Backend

```sh
cd backend
cp .env.example .env
# Configure the project's Supabase URL and publishable key.
uv sync --locked
uv run uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000 --no-access-log
```

Interactive API documentation: http://localhost:8000/docs.
See the backend README before testing confirmation/recovery emails or deploying publicly.
