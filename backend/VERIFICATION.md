# Foundation verification — 2026-11-04

Executed on Node.js 24.18.0 with npm 11.16.0 and Colima Docker.

| Check | Result |
| --- | --- |
| Dependency installation | Passed; exact versions and package-lock.json recorded |
| Prisma validate | Passed with no business models |
| Prisma generate | Passed, Prisma Client 7.10.1 |
| npm run lint | Passed |
| npm run build | Passed |
| npm run start:dev | Watch compilation passed with zero errors |
| npm run start:prod | Compiled application started successfully |
| Docker Compose configuration | Passed |
| Dockerfile build | Passed; OpenSSL installed in the build stage |
| Application container | HTTP 200 health against PostgreSQL; runs as uid 1000 (node); temporary test container removed |
| PostgreSQL | 18.6 container healthy; SQL connection verified |
| Public business tables | None (pg_tables query returned zero rows) |
| GET /api/health | HTTP 200, {"status":"ok","database":"connected"} |
| Database outage | Stopped project container; HTTP 503, {"status":"error","database":"disconnected"} |
| Recovery | Restored container; same API process returned HTTP 200 |
| Swagger | Browser rendered title, version, description and health operation |
| OpenAPI JSON | Only /api/health; expected metadata and 200/503 responses |
| CORS | Configured localhost:3000 origin returned |
| Default example route | GET / returned HTTP 404 |
| Environment validation | Invalid database URL and port rejected; defaults verified |
| Production dependency audit | npm audit --omit=dev reported zero vulnerabilities |

## Local setup notes

A pre-existing host PostgreSQL service owns port 5432. This project's ignored `.env` therefore uses port 5433 for both `POSTGRES_PORT` and `DATABASE_URL`. Compose and `.env.example` retain the requested port 5432 default. The existing service was not changed.

The full npm audit reports 12 moderate findings in development tooling, stemming from the transitive `minimatch` glob denial-of-service advisory GHSA-g3hv-75wg-m249. Runtime packages have no reported findings. Suggested automatic fixes include incompatible tool downgrades, so no forced dependency changes were applied. Revisit when compatible upstream tooling updates are available.

No migration was created or applied because this phase intentionally has no business models.

## Scalar integration

Installed the official `@scalar/nestjs-api-reference` middleware at `/api/reference`, reading the shared `/api/docs-json` specification. Lint and build passed. Scalar, Swagger, OpenAPI JSON, and health each returned HTTP 200. Browser verification confirmed the API title, health operation, 200/503 response documentation, response examples, and client code samples rendered in Scalar.
