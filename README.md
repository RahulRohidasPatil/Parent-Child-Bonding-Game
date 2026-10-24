# Parent–Child Bonding Game — Features / Frontend

Learning and party games for friends, parents, and children. This repository owns the Next.js
frontend, UI assets, and product feature plan.

- [Product and feature plan](docs/PRODUCT_PLAN.md)
- [Backend repository](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend)
- [API documentation](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend/blob/main/API.md)

## Run the frontend

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Learning and party-game screens currently include local prototype
state; their presence does not imply a deployed backend integration.

## Backend ownership

FastAPI, Supabase authentication, environment templates, Python dependencies, backend tests,
CI, and backend setup documentation are maintained in the separate backend repository.
Follow its README to run the API locally. Implement new endpoints and persistence there.
