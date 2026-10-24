# Parent–Child Bonding Game — Features / Frontend

Learning and party games for friends, parents, and children. This repository owns the Next.js
frontend, UI assets, and product feature plan.

- [Product and feature plan](docs/PRODUCT_PLAN.md)
- [Backend repository](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend)
- [API documentation](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend/blob/main/API.md)

## Run the frontend

```sh
npm ci
cp .env.example .env.local   # AUTH_API_URL and LEARNING_API_URL (server-side only)
npm run dev
```

Open http://localhost:3000. Start both backend services from the
[backend repository](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend) first:

| Service | Default URL | Start (from the backend repo) |
| --- | --- | --- |
| Auth API (`app/`) | `http://127.0.0.1:8000` | `cp .env.demo.example .env` then `uv run uvicorn app.main:create_app --factory --port 8000` |
| Learning service (`learning-service/`) | `http://127.0.0.1:8001` | `uv run serve.py --local --port 8001` (it defaults to 8000, so move it) |

The browser only talks to this Next.js app. Route handlers proxy to the services, so no CORS
setup is needed and auth tokens stay in httpOnly cookies:

- `/api/auth/*` → auth API (login, register, verify, resend, logout, me, demo-accounts)
- `/api/learn/*` → learning service `/api/*` (materials, lessons, quiz, flashcards, tournament); signed-in users only

### Pages, in flow order

| Route | Screen | Data |
| --- | --- | --- |
| `/` | Landing | static |
| `/register` → `/verify` | Create account (role, date of birth, age-based email rules), then the emailed code | auth API |
| `/login` | Username/email + password, parent or student tab | auth API |
| `/home` | Dashboard | local + recent lessons |
| `/learn/new` | Choose subject, upload pages or type a topic | learning API |
| `/learn/material/[id]` | Check what was read, pick chapter/pages, preview | learning API |
| `/learn/lesson/[id]` | Lesson, diagrams, key points | learning API |
| `/learn/quiz/[id]` | Practice quiz, weak-spot follow-up and mistake cards | learning API |
| `/learn/flashcards/[id]` | Flashcard review loop | learning API |
| `/learn` | My lessons, practice and uploads | local list of server ids |
| `/play`, `/play/duel` | Games; pass-the-phone duel on the tournament API | learning API |
| `/base`, `/shop`, `/quests`, `/friends`, `/profile`, `/settings` | Rewards, looks, quests, people, preferences | local prototype state |

Layouts are responsive: phone tab bar below 768 px, tablet side rail from 768 px, desktop
sidebar from 1280 px.

### Known gaps (need backend work)

- **Username sign-in:** the auth API signs in by email. The login field accepts a username,
  but only emails work until the backend adds a username lookup.
- **Under-16 accounts** are registered to the parent's email, so the parent receives the code.
  A parent can't also use that email for their own account; guardian links need an API.
- Date of birth and username aren't stored by the auth API (extra fields are rejected); age is
  kept in the browser for lesson reading level.
- Coins, base, quests, looks, friends and settings live in `localStorage` until there are APIs.
  Lessons, quizzes and decks live in the learning service's memory and vanish when it restarts.
- Party games other than the family duel are listed as "coming soon".

## Backend ownership

FastAPI, Supabase authentication, environment templates, Python dependencies, backend tests,
CI, and backend setup documentation are maintained in the separate backend repository.
Follow its README to run the API locally. Implement new endpoints and persistence there.
