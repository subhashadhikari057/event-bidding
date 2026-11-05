# Mero Event frontend

Next.js frontend for the Mero Event Vendor Bidding and Booking System. It provides separate ADMIN and VENDOR portals connected to the NestJS API through authenticated HTTP-only cookies.

## Features

### Admin portal

- Dashboard summaries and quick links
- Vendor creation, editing, activation and password reset
- Work-request creation and draft editing
- Multiple reference-photo uploads
- Invitations to one or multiple vendors
- Bid comparison and final vendor selection
- Booking details, payment history and manual payment recording
- Account password changes

### Vendor portal

- Assigned work requests with items and reference photos
- Final quotation submission and bid-status tracking
- Vendor-owned booking and payment details
- Account password changes

The frontend never sends a vendor ID to authorize vendor data. The backend derives vendor ownership from the authenticated account.

## Prerequisites

- Node.js 24 LTS and npm
- The Mero Event backend running at `http://localhost:4000`
- PostgreSQL prepared with the backend Prisma migrations and seed

Complete the backend setup first by following [`backend/README.md`](../backend/README.md), or use the full repository instructions in the root [`README.md`](../README.md).

## Install and configure

From the repository root:

```sh
cd frontend
cp .env.example .env.local
npm ci
```

The default frontend environment is:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

`NEXT_PUBLIC_API_URL` must point to the NestJS API prefix. Authentication uses `credentials: "include"`; JWTs are never stored in browser local storage.

## Run the frontend

```sh
npm run dev
```

Open `http://localhost:3000`. The login credentials are the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values configured in `backend/.env` before running the seed. Vendor credentials are created from the Admin Vendor Management page.

After both projects have been installed, you can start the backend and frontend together from the repository root:

```sh
npm run dev
```

## Main routes

| Portal | Route | Purpose |
| --- | --- | --- |
| Public | `/login` | Admin and vendor sign-in |
| Admin | `/admin/dashboard` | Management overview |
| Admin | `/admin/vendors` | Vendor management |
| Admin | `/admin/work-requests` | Work requests and invitations |
| Admin | `/admin/bids` | Bid tracking and comparison |
| Admin | `/admin/bookings` | Bookings and payment tracking |
| Vendor | `/vendor/dashboard` | Vendor overview |
| Vendor | `/vendor/requests` | Assigned work requests |
| Vendor | `/vendor/bids` | Submitted quotations |
| Vendor | `/vendor/bookings` | Awarded bookings and payments |

## Business workflow

1. An admin creates a vendor account.
2. The admin creates a draft work request with required items and optional photos.
3. The admin invites one or multiple active vendors, opening the request.
4. Invited vendors review the request and submit one final quotation.
5. The admin compares submitted bids and manually selects the winning vendor.
6. The API creates a confirmed booking and rejects competing bids atomically.
7. The admin records externally completed payments.
8. The winning vendor can view the booking, payment history, paid total and remaining balance.

## Scripts

```sh
npm run dev       # Start Next.js development mode
npm run lint      # Run ESLint
npx tsc --noEmit  # Run a standalone TypeScript check
npm run build     # Create a production build
npm run start     # Serve the production build
```

## Production notes

- Set `NEXT_PUBLIC_API_URL` to the deployed API origin before building.
- Configure the backend `FRONTEND_URL` to the deployed frontend origin.
- The backend authentication cookie uses `Secure` when `NODE_ENV=production`.
- Reference photos currently use backend local storage for this assessment; production should use durable object storage.
