# Parent–Child Bonding Game

Learning and party games for friends, parents, and children.

- [Product plan](docs/PRODUCT_PLAN.md)
- [Progress tracker: what is built, what is open](docs/PROGRESS.md)
- [FastAPI authentication backend: setup, routes, testing, and email limitations](backend/README.md)

## Frontend

UI screens for the learning app and the Splash party game live on the `user_interface_v1` branch.
They run on mock data and are not yet connected to the backend. See [docs/PROGRESS.md](docs/PROGRESS.md)
for the screen list, where the mock data lives, and open gaps.

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
