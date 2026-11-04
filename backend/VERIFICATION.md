# Foundation verification — 2026-11-04

Executed on Node.js 24.18.0 with npm 11.16.0 and Colima Docker.

| Check | Result |
| --- | --- |
| Dependency installation | Passed; exact versions and package-lock.json recorded |
| Prisma validate | Passed with User, Vendor, and UserRole |
| Prisma generate | Passed, Prisma Client 7.10.1 |
| npm run lint | Passed |
| npm run build | Passed |
| npm run start:dev | Watch compilation passed with zero errors |
| npm run start:prod | Compiled application started successfully |
| Docker Compose configuration | Passed |
| Dockerfile build | Passed; OpenSSL installed in the build stage |
| Application container | HTTP 200 health against PostgreSQL; runs as uid 1000 (node); temporary test container removed |
| PostgreSQL | 18.6 container healthy; SQL connection verified |
| User/Vendor migration | `20261104044034_init_users_vendors` created and applied |
| Database constraints | Unique user email, user vendorId, and vendor email indexes verified |
| User/Vendor relation | UUID foreign key verified with `ON DELETE SET NULL` and `ON UPDATE CASCADE` |
| Admin seed | Created one ADMIN with null vendorId; second run made no changes |
| Admin password storage | Verified as a bcrypt hash with cost 12 without printing the hash |
| GET /api/health | HTTP 200, {"status":"ok","database":"connected"} |
| Database outage | Stopped project container; HTTP 503, {"status":"error","database":"disconnected"} |
| Recovery | Restored container; same API process returned HTTP 200 |
| Scalar | Browser rendered title, version, description and health operation |
| CORS | Configured localhost:3000 origin returned |
| Default example route | GET / returned HTTP 404 |
| Environment validation | Invalid database URL and port rejected; defaults verified |
| Production dependency audit | npm audit --omit=dev reported zero vulnerabilities |

## Local setup notes

A pre-existing host PostgreSQL service owns port 5432. This project's ignored `.env` therefore uses port 5433 for both `POSTGRES_PORT` and `DATABASE_URL`. Compose and `.env.example` retain the requested port 5432 default. The existing service was not changed.

The full npm audit reports 12 moderate findings in development tooling, stemming from the transitive `minimatch` glob denial-of-service advisory GHSA-g3hv-75wg-m249. Runtime packages have no reported findings. Suggested automatic fixes include incompatible tool downgrades, so no forced dependency changes were applied. Revisit when compatible upstream tooling updates are available.

Module 1 adds only the `User`, `Vendor`, and `UserRole` database structures. No authentication, controllers, public registration, vendor CRUD, or future bidding and booking models were introduced.

## Scalar integration

Installed the official `@scalar/nestjs-api-reference` middleware at `/api/reference`, using the generated OpenAPI document directly. The Swagger UI and public OpenAPI JSON endpoints were removed. Lint and build passed. Browser verification confirmed the API title, health operation, 200/503 response documentation, response examples, and client code samples rendered in Scalar.

## Module 2 authentication verification

- Added cookie JWT login, current-user lookup, logout, password change, ADMIN vendor password reset, database-backed role checks, and Origin/Fetch Metadata CSRF protection.
- Prisma schema and migrations were intentionally unchanged for Module 2 at the user's direction.
- `npm test`: 24 tests passed across service, JWT guard, roles guard, controller, cookie clearing, and non-cacheable reset responses.
- Real HTTP smoke tests passed for login, unknown/wrong credentials, current user, logout, password change, ADMIN reset, VENDOR 403, temporary-password login, health, Scalar, cookie flags, and cross-origin HTTP 403.
- Disposable vendor verification records were removed after the smoke test.
- Scalar embeds all five authentication operations, request/response schemas, cookie authentication, status codes, and the one-time credential warning.
- Confirmed limitation: a copied pre-reset JWT remains valid because `tokenVersion` was intentionally not added. Forced password-change state is likewise unavailable without `mustChangePassword`.

## Module 3 vendor management verification

- Added five ADMIN-only vendor endpoints for create, list/search/filter, details, updates, and status changes.
- Prisma schema and migrations remain unchanged; the existing User/Vendor relation supports the module.
- `npm run lint`, `npm run build`, and the existing 26 authentication/authorization tests passed.
- A real PostgreSQL and HTTP smoke test passed for ADMIN creation, unauthenticated 401, VENDOR 403, duplicate email 409, atomic linked records, bcrypt password hashing, listing, details, linked email/name updates, deactivate/login rejection, reactivate/login success, and safe responses without `passwordHash`.
- Scalar returned HTTP 200 and contained the documented `/api/vendors` operations and request schemas.
- Disposable ADMIN, User, and Vendor smoke-test records were removed after verification.
