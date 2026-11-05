# Mero Event backend

NestJS backend for the Mero Event Vendor Bidding and Booking System assessment. It includes admin and vendor users, vendor management, work requests, invitations, bidding, booking and manual payment tracking, cookie-based JWT authentication, role authorization, PostgreSQL connectivity through Prisma, Scalar API documentation, and a database-backed health endpoint. Real payment processing and notifications are intentionally excluded.

## Backend quick start

Run these commands from `backend/` for a new local database:

```sh
cp .env.example .env
# Review .env, especially JWT_SECRET, database ports and ADMIN_* values.

npm ci
docker compose up -d --wait

npm run prisma:validate
npm run prisma:generate
npm run prisma:deploy
npm run db:seed

npm run start:dev
```

The API starts at `http://localhost:4000/api` and Scalar documentation is available at `http://localhost:4000/api/reference`. The frontend is expected at `http://localhost:3000`.

After both applications have been installed and the database prepared, you can instead start the backend and frontend together from the repository root with `npm run dev`. See the root `README.md` for the complete first-run workflow.

## Prerequisites

- Node.js 24 LTS and npm
- Docker Engine with Docker Compose (Docker Desktop or Colima on macOS), running
- Available local ports 4000 and 5432

## Install and configure

From the project directory:

```sh
cd backend
cp .env.example .env
npm ci
```

Keep all subsequent commands in `backend`. `.env` is ignored by Git and excluded from Docker builds. The supplied credentials are only for local development. Use separate secrets for deployed environments.

`PORT` controls the API port (default 4000). `FRONTEND_URL` is the allowed browser origin (default `http://localhost:3000`). `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` initialize the Docker database; `POSTGRES_PORT` controls its localhost port. Keep `DATABASE_URL` consistent with these values, percent-encoding special characters in credentials. The `schema` query parameter selects the PostgreSQL schema (default `public`).

`ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` configure the initial admin seed. Replace all example values before seeding. The seed requires a password of at least 6 characters and never logs credentials or hashes.

`JWT_SECRET` must contain at least 32 characters. Generate a deployment secret with `openssl rand -base64 48` and keep it outside version control. `JWT_EXPIRES_IN` accepts values such as `24h`, and `NODE_ENV=production` enables the cookie's `Secure` attribute.

`UPLOAD_DIR` is the local assessment/demo storage root; it defaults to the ignored `./uploads` directory. Use an absolute writable path in deployment. PostgreSQL stores relative photo paths such as `/uploads/work-requests/photo.jpg`; the frontend combines them with its configured backend origin. Local disk storage is intentionally simple for this assessment and should be replaced with durable object storage in production.

If port 5432 is already in use, set `POSTGRES_PORT=5433` and change the port in `DATABASE_URL` to `5433` in `.env` before starting Compose. On the setup machine, `.env` uses this alternative because another local PostgreSQL service owns port 5432; `.env.example` retains the standard defaults.

Changing initialization credentials does not modify an existing database volume. Change database roles explicitly if you already have persisted data.

## Start PostgreSQL

```sh
# If using Colima on macOS:
colima start

docker compose up -d --wait
docker compose ps
```

Compose uses the official pinned PostgreSQL 18.6 Alpine image, a named persistent volume, a health check, and `unless-stopped` restart behavior. PostgreSQL is exposed only on `127.0.0.1:5432` by default.

## Prisma

```sh
npm run prisma:validate
npm run prisma:generate
```

Prisma 7 uses `prisma.config.ts` for the CLI connection URL and `@prisma/adapter-pg` at runtime. The client is generated into `src/generated/prisma` and excluded from version control. Both development startup and builds generate it automatically.

Apply committed migrations and generate the client:

```sh
npm run prisma:deploy
npm run prisma:generate
```

For a new schema change during development, create and apply a named migration:

```sh
npm run prisma:migrate -- --name describe_the_change
```

The `init_users_vendors` migration creates `User`, `Vendor`, and `UserRole`. `User.vendorId` is a nullable, unique PostgreSQL UUID foreign key, giving a vendor at most one login account while allowing admins to have no vendor. Role-specific vendor requirements will be enforced by future account services. The minimal runtime Docker image does not include the Prisma CLI, so run migration commands from a checkout with development dependencies installed.

Create the initial admin after setting secure local values in `.env`:

```sh
npm run db:seed
```

The seed is idempotent. It creates one active `ADMIN` with no vendor, leaves an existing admin unchanged, and fails if the configured email belongs to another role.

```sh
npm run prisma:studio
```

Prisma Studio displays the `User` and `Vendor` tables after migrations are applied.

## Authentication and authorization

The API stores a signed 24-hour JWT in the `mero_event_access` HTTP-only cookie. The cookie uses `SameSite=Lax`, applies to `/`, and becomes `Secure` in production. CORS accepts only `FRONTEND_URL` and enables credentials.

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| POST | `/api/auth/logout` | Public and idempotent |
| PATCH | `/api/auth/change-password` | Authenticated |
| POST | `/api/auth/vendors/:vendorId/reset-password` | ADMIN |

Login and protected responses expose only safe account fields. Authorization reloads the current user, role, active state, and vendor state from PostgreSQL for every protected request. Client-provided roles and vendor IDs are never trusted.

Changing a password verifies the existing password, enforces 6–72 UTF-8 bytes, hashes with bcrypt, and clears the browser cookie. Admin vendor reset generates a cryptographically random temporary password, stores only its bcrypt hash, and returns the plaintext once with `Cache-Control: no-store`. The admin must verify the vendor outside the application and communicate this credential through an appropriate secure channel. The backend does not email or otherwise persist the plaintext credential.

### CSRF policy

Nest's built-in cross-origin protection evaluates unsafe requests using Fetch Metadata and falls back to Origin/Host checks. `FRONTEND_URL` is the only additional trusted browser origin; Scalar works because it is served from the API's own origin. Non-browser clients that send neither `Sec-Fetch-Site` nor `Origin` are accepted by the framework fallback policy. For an explicit browser-equivalent curl request, include:

```sh
curl -X POST http://localhost:4000/api/auth/logout \
  -H 'Origin: http://localhost:3000' \
  --cookie 'mero_event_access=YOUR_COOKIE'
```

Requests with an untrusted `Origin` receive HTTP 403.

### Deliberately omitted security state

Module 2 point 11 was explicitly excluded, so the Prisma schema was not changed and no authentication migration was created. Consequently:

- copied JWTs are not invalidated when a password changes or an admin resets it;
- the API cannot persist or enforce `mustChangePassword`;
- reset vendors can use the temporary password, but forced first-login password replacement is unavailable.

Logout clears the current browser cookie but cannot revoke a copied JWT. Add persistent `tokenVersion` and `mustChangePassword` fields before relying on global token revocation or forced password changes.

## Vendor management

All vendor management endpoints require a valid ADMIN cookie:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/vendors` | Create a Vendor and linked VENDOR User atomically |
| GET | `/api/vendors` | List vendors with optional `search` and `isActive` filters |
| GET | `/api/vendors/:id` | Get one vendor and safe linked account fields |
| PATCH | `/api/vendors/:id` | Update vendor details and linked login email/name |
| PATCH | `/api/vendors/:id/status` | Activate or deactivate both vendor and login account |

Creation accepts an initial password of 6–72 UTF-8 bytes, stores only a bcrypt hash with cost 12, and never returns the password or hash. Emails are trimmed, lowercased, and checked case-insensitively across both User and Vendor records. Vendor creation, linked identity updates, and status synchronization use database transactions. Deactivation immediately prevents login and invalidates protected requests because authentication checks current database state on every request.

`GET /api/vendors?search=photo&isActive=true` performs a case-insensitive company-name or email search and returns newest vendors first. `isActive` accepts only `true` or `false`.

## Work requests and invitations

ADMIN work-request endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/work-requests` | Create a DRAFT request and nested items atomically |
| GET | `/api/work-requests` | List requests with optional `status` and `search` filters |
| GET | `/api/work-requests/:id` | Get details, items, photos, and safe creator information |
| PATCH | `/api/work-requests/:id` | Update a DRAFT request and optionally replace its items |
| DELETE | `/api/work-requests/:id` | Permanently delete a DRAFT request and its local reference photos |
| POST | `/api/work-requests/:id/photos` | Upload reference photos to a DRAFT request |
| POST | `/api/work-requests/:id/invitations` | Invite active vendors and change DRAFT to OPEN |
| GET | `/api/work-requests/:id/invitations` | List invited vendors |

Vendor-facing endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/vendor/requests` | List only the authenticated vendor's assignments |
| GET | `/api/vendor/requests/:id` | Get an assigned request, items, photos, and own invitation status |

Request creation requires at least one item with a positive integer quantity. `eventDate` accepts an ISO 8601 date-time with an explicit timezone and PostgreSQL stores the resulting absolute instant. Only DRAFT requests can be edited or receive photos; sending the first invitation changes DRAFT to OPEN in the same transaction. OPEN, BOOKED, and CANCELLED requests reject edits with HTTP 409.

Photo upload uses multipart field `photos`, accepts JPEG, PNG, and WebP signatures, limits each file to 5 MB, and allows at most five stored photos per request. Filenames are generated UUIDs, not client filenames. Files are served from `/uploads/work-requests/...`; only their relative paths are stored in PostgreSQL. Failed database persistence removes newly written files, and deleting a draft cleans up its stored files.

Invitation batches validate every vendor before writing. Missing, inactive, previously invited, or duplicated vendors cause the whole operation to fail. The composite database constraint on `(workRequestId, vendorId)` also protects concurrent requests. Vendor request APIs derive `vendorId` from the authenticated database identity and return 404 for unassigned details.

Example request creation:

```json
{
  "title": "Wedding Stage Decoration",
  "description": "Stage decoration and lighting for a wedding reception.",
  "eventDate": "2026-12-15T10:00:00.000Z",
  "eventLocation": "Kathmandu",
  "items": [{ "name": "Stage Decoration", "quantity": 1, "unit": "set" }]
}
```

Example invitation batch:

```json
{
  "vendorIds": ["11111111-1111-4111-8111-111111111111"]
}
```

## Bidding, bookings, and payment tracking

Vendor bidding endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/vendor/requests/:id/bid` | Submit one final NPR bid for an invited OPEN request |
| GET | `/api/vendor/bids` | List only the authenticated vendor's bids |

ADMIN selection and comparison endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/work-requests/:id/bids` | Compare bids by amount with count and lowest bid |
| GET | `/api/bids/summary` | Return real bid totals grouped by status for the ADMIN dashboard |
| POST | `/api/bids/:id/accept` | Accept one bid, reject competitors, book the request |

Booking and payment endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/bookings` | List ADMIN booking summaries with payment balances |
| GET | `/api/bookings/:id` | Get the winning bid, vendor, event, and payment history |
| POST | `/api/bookings/:id/payments` | Record an externally completed payment |
| GET | `/api/vendor/bookings` | List only bookings awarded to the authenticated vendor |

Money is accepted as a decimal string, stored as PostgreSQL `DECIMAL(12,2)`, calculated with Prisma Decimal, and returned consistently with two decimal places. A bid amount must be positive and no greater than `9999999999.99` NPR. Vendors receive one immutable bid per invitation; the unique invitation constraint protects concurrent submissions.

Bid acceptance is manual—there is no automatic cheapest-bid selection. A serializable transaction conditionally changes the selected bid to ACCEPTED, other submitted bids to REJECTED, the request to BOOKED, and creates its unique Booking. Unique work-request and bid constraints prevent multiple bookings.

Payments are manual records of funds completed outside this application; no gateway transaction is initiated. Payment totals and `UNPAID`, `PARTIALLY_PAID`, or `PAID` status are derived rather than stored. Serializable transactions prevent concurrent records from exceeding the unchanged booking amount.

Example bid:

```json
{
  "amount": "75000.00",
  "notes": "Includes stage decoration, flowers, lighting and installation."
}
```

Example payment record:

```json
{
  "amount": "20000.00",
  "method": "BANK_TRANSFER",
  "reference": "BANK-TXN-12345",
  "notes": "Advance payment to vendor",
  "paidAt": "2026-11-04T10:00:00.000Z"
}
```

## Run the API

```sh
npm run start:dev
```

Development mode watches source changes. To lint, build and run the compiled application:

```sh
npm run lint
npm run build
npm run start:prod
```

Stop an existing API process before starting another on the same port. Shutdown hooks disconnect Prisma cleanly.

- Scalar API reference: http://localhost:4000/api/reference
- Health: http://localhost:4000/api/health

```sh
curl -i http://localhost:4000/api/health
```

A successful PostgreSQL `SELECT 1` returns HTTP 200:

```json
{"status":"ok","database":"connected"}
```

A failed query returns HTTP 503 without database error details:

```json
{"status":"error","database":"disconnected"}
```

The database driver has three-second connection and query timeouts. Configuration is validated at startup. Global request validation enables transformation and rejects non-whitelisted fields when DTOs are introduced. CORS allows the configured frontend origin.

Scalar renders the OpenAPI document generated by `@nestjs/swagger` directly. The Swagger UI and public OpenAPI JSON routes are not exposed. Add OpenAPI decorators to future controllers and DTOs to keep the Scalar documentation complete. The Scalar browser bundle loads from its default CDN, so viewing Scalar requires internet access.

## Optional application container

The normal development flow runs only PostgreSQL in Docker. To verify the application Dockerfile:

```sh
docker build -t mero-event-backend .
docker run --rm --name mero-event-api --network mero-event_default \
  --env-file .env \
  -e 'DATABASE_URL=postgresql://meroevent:local_dev_password@postgres:5432/meroevent_db?schema=public' \
  -p 127.0.0.1:4000:4000 mero-event-backend
```

This example assumes the unchanged local credentials and port. Inside the Compose network, use hostname `postgres` and port `5432` rather than `localhost`. The image uses a multi-stage build and runs as an unprivileged user. The build-time connection URL is a dummy value used only for client generation; no database or real secret is required to build.

## Stop

Stop the local NestJS process with Ctrl+C, then:

```sh
docker compose down
```

The named database volume is preserved. `docker compose down -v` also deletes the database data; use it only for an intentional local reset.

## Verification

See [VERIFICATION.md](./VERIFICATION.md) for executed checks, the local port adjustment, and development dependency audit findings.

## References

- [Scalar NestJS integration](https://scalar.com/products/api-references/integrations/nestjs)

- [NestJS Prisma integration](https://docs.nestjs.com/recipes/prisma)
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [NestJS validation](https://docs.nestjs.com/techniques/validation)
- [Prisma client generation](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators)
- [Official PostgreSQL image](https://hub.docker.com/_/postgres)
