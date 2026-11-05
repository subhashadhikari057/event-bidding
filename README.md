# Mero Event Vendor Bidding and Booking System

Full-stack vendor procurement application created for the Mero Event development assessment. The repository contains:

- `backend/` — NestJS, Prisma and PostgreSQL API
- `frontend/` — Next.js ADMIN and VENDOR portals
- `scripts/dev.mjs` — dependency-free launcher for both development servers

The complete workflow is implemented: vendor management, event work requests, reference photos, vendor invitations, quotations, bid comparison, final vendor selection, confirmed bookings and manual payment tracking.

## Prerequisites

- Node.js 24 LTS and npm
- Docker Engine with Docker Compose
- Available ports `3000`, `4000` and `5432`

If PostgreSQL already uses port `5432`, choose another host port such as `5433` in `backend/.env` and update `DATABASE_URL` to match.

## First-time setup

Complete the backend first, then the frontend. The root command starts both applications only after this setup is finished.

### 1. Backend and database

```sh
cd backend
cp .env.example .env
```

Review `backend/.env` before continuing:

- Replace `JWT_SECRET` with a value of at least 32 characters.
- Keep `POSTGRES_PORT` and the port in `DATABASE_URL` identical.
- Set `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the initial admin account.

Install dependencies and start PostgreSQL:

```sh
npm ci
docker compose up -d --wait
docker compose ps
```

Prepare Prisma and seed the initial admin:

```sh
npm run prisma:validate
npm run prisma:generate
npm run prisma:deploy
npm run db:seed
```

Return to the repository root:

```sh
cd ..
```

Detailed backend configuration, security behavior and API documentation are in [`backend/README.md`](backend/README.md).

### 2. Frontend

```sh
cd frontend
cp .env.example .env.local
npm ci
cd ..
```

The default `NEXT_PUBLIC_API_URL=http://localhost:4000/api` is correct for local development. See [`frontend/README.md`](frontend/README.md) for routes, workflow and production configuration.

### 3. Start both applications from the root

```sh
npm run dev
```

This starts the NestJS API in watch mode and the Next.js development server in the same terminal. Press `Ctrl+C` to stop both.

`npm run dev` deliberately does not start Docker, run migrations or seed data. Those are explicit first-time or database-management operations and should complete successfully before the application servers start.

## Root commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run install:all` | Install locked backend and frontend dependencies |
| `npm run db:up` | Start and wait for the PostgreSQL Docker service |
| `npm run db:status` | Show PostgreSQL container health and ports |
| `npm run db:down` | Stop PostgreSQL while preserving its named volume |
| `npm run prisma:setup` | Validate Prisma, generate the client and deploy migrations |
| `npm run db:seed` | Create the configured initial admin if absent |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run dev` | Start backend and frontend together |
| `npm run check` | Run backend lint/tests/build and frontend lint/build |

Equivalent fresh setup using root shortcuts:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Review backend/.env before continuing.

npm run install:all
npm run db:up
npm run prisma:setup
npm run db:seed
npm run dev
```

## Local URLs

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api |
| Scalar API reference | http://localhost:4000/api/reference |
| Database health | http://localhost:4000/api/health |

Sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` configured before seeding. Create vendor accounts and their initial passwords from the Admin Vendor Management portal.

## Application workflow

1. ADMIN creates and manages vendor accounts.
2. ADMIN creates a draft work request containing event details, items and optional reference photos.
3. ADMIN invites one or multiple active vendors.
4. Each invited VENDOR reviews its assigned request and submits one final quotation.
5. ADMIN compares bids and manually selects the winning vendor.
6. The backend atomically creates a confirmed booking and closes competing bids.
7. ADMIN records payments completed outside the application.
8. The winning VENDOR sees its booking, payment history and outstanding balance.

Vendor routes derive ownership from the authenticated database account. A vendor cannot request another vendor's assignments, bids or bookings by supplying an ID.

## Technology

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui and TanStack Query
- Backend: NestJS, TypeScript, Prisma and Scalar OpenAPI documentation
- Database: PostgreSQL 18 through Docker Compose
- Authentication: JWT in an HTTP-only cookie with role-based authorization

## Verification

Before presenting or submitting:

```sh
npm run check
```

Executed backend verification and integration-test details are recorded in [`backend/VERIFICATION.md`](backend/VERIFICATION.md).

## Future scope and priorities

These additions are intentionally outside the assessment implementation:

1. **Durable photo storage and notifications** — move uploads to object storage and notify vendors when invitations, bid decisions or payments change. This has the highest operational value.
2. **Audit history and token revocation** — record important account and procurement actions, add token-version invalidation and require temporary passwords to be changed on first login.
3. **Invoices and payment integrations** — generate booking invoices and optionally integrate verified payment providers while retaining a manual reconciliation path.
4. **Vendor performance reporting** — add fulfillment history, ratings and category-based recommendation signals after enough production data exists.

The priority is operational reliability and security first, financial automation second, and recommendation features after meaningful usage data is available.
