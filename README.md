# Parent–Child Bonding Game — Features / Frontend

Learning and party games for friends, parents, and children. This repository owns the Next.js
frontend, UI assets, and product feature plan.

- [Product and feature plan](docs/PRODUCT_PLAN.md)
- [Backend repository](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend)
- [API documentation](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend/blob/main/API.md)

## Run the frontend

```sh
npm ci
cp .env.example .env.local   # add the Clerk keys from the Clerk Dashboard
npm run dev
```

Open http://localhost:3000. Start the learning service from the
[backend repository](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend) first:

| Service | Default URL | Start (from the backend repo) |
| --- | --- | --- |
| Learning service (`learning-service/`) | `http://127.0.0.1:8001` | `uv run serve.py --local --port 8001` (it defaults to 8000, so move it) |

The browser only talks to this Next.js app. Route handlers proxy to the services, so no CORS
setup is needed and Clerk manages the browser session:

- `/api/auth/me` → current Clerk user data for the app
- `/api/learn/*` → learning service `/api/*` (materials, lessons, quiz, flashcards, tournament); signed-in users only

### Pages, in flow order

| Route | Screen | Data |
| --- | --- | --- |
| `/` | Landing | static |
| `/register` → `/verify` | Create account (role, date of birth, age-based email rules), then the Clerk verification link | Clerk |
| `/login` | Username/email + password, parent or student tab | Clerk |
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

- **Backend token validation:** the frontend now uses Clerk for username/email login, verification,
  and sessions. The backend must validate Clerk JWTs before accepting protected API requests.
- **Under-16 accounts** are registered to the parent's email, so the parent receives the verification link.
  A parent can't also use that email for their own account; guardian links need an API.
- Date of birth and username are stored in Clerk user metadata; age is also kept in the browser
  for lesson reading level.
- Coins, base, quests, looks, friends and settings live in `localStorage` until there are APIs.
  Lessons, quizzes and decks live in the learning service's memory and vanish when it restarts.
- Party games other than the family duel are listed as "coming soon".

## Backend ownership

FastAPI authentication integration, environment templates, Python dependencies, backend tests,
CI, and backend setup documentation are maintained in the separate backend repository.
Follow its README to run the API locally. Implement new endpoints and persistence there.

## FastAPI social connection

Friends, presence and live duels now use the FastAPI backend through the authenticated `/api/social/*`
proxy. Configure `LEARNING_API_URL`, the backend's Clerk issuer/origins, and signed session claims as
shown in [docs/SOCIAL_API.md](docs/SOCIAL_API.md). The local social JSON stand-in is no longer used.
Completed duel balances are read from the backend wallet. Run `npm test`, `npm run typecheck` and
`npm run build` to validate the frontend connection.
