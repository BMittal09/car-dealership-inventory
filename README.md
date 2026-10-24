# AutoVault - Car Dealership Inventory Management System

A full-stack car dealership inventory management application built with **React, TypeScript, Node.js, Express, and PostgreSQL**.

AutoVault provides a responsive platform for customers to explore vehicle listings, search and filter inventory, view stock availability, and perform simulated vehicle purchases. Administrators can securely manage vehicles, update inventory, restock vehicles, and monitor dealership operations.

The application was developed using **Test-Driven Development (TDD)**, with automated tests covering authentication, authorization, API validation, database constraints, inventory operations, concurrency protection, and frontend functionality.

## Live Application

- **Live Website:** https://car-dealership-inventory-kappa.vercel.app
- **Backend API:** https://autovault-api-31z5.onrender.com/api/health
- **GitHub Repository:** https://github.com/BMittal09/car-dealership-inventory

> The backend runs on Render's free hosting tier, so the first API request after inactivity may take additional time.

## Application Screenshots

### Homepage

![AutoVault Homepage](docs/screenshots/homepage.png)

### Vehicle Inventory

![AutoVault Vehicle Inventory](docs/screenshots/inventory.png)

### Administrator Dashboard

![AutoVault Administrator Dashboard](docs/screenshots/admin-dashboard.png)

### Vehicle Management

![AutoVault Vehicle Management](docs/screenshots/vehicle-management.png)

---

## Features

### Customer Features

- Browse dealership vehicle inventory.
- Search vehicles by manufacturer or model.
- Filter vehicles by make, category, fuel type, transmission, availability status, and price range.
- Browse paginated vehicle listings.
- View detailed vehicle specifications, pricing, category, and stock quantity.
- Identify available, reserved, sold, and out-of-stock vehicles.
- Register and log in securely.
- Purchase available inventory units through a confirmation dialog.
- Cancel a purchase without changing inventory.
- Receive purchase success and error notifications.
- View automatically refreshed inventory quantities after successful purchases.
- Access a responsive interface across desktop and mobile devices.

**Purchase behavior:** The purchase functionality demonstrates an inventory transaction. Each successful purchase decreases stock by one unit. No payment is collected, financial order is created, or vehicle ownership transferred.

### Administrator Features

- Secure administrator dashboard with live inventory statistics.
- View total, available, reserved, and sold vehicle listings.
- Add new vehicles with category and stock quantity.
- Edit vehicle specifications, pricing, mileage, category, quantity, and availability.
- Manage inventory quantities, including out-of-stock vehicles.
- Restock vehicles through a dedicated confirmation dialog.
- Preview updated stock quantities before restocking.
- Prevent invalid restock quantities.
- Permanently delete vehicles with confirmation.
- Search, filter, and paginate vehicle records.
- Receive success and error notifications after inventory operations.

### Inventory Management

- Vehicle categories and stock quantities stored in PostgreSQL.
- Non-negative inventory quantities enforced through database constraints.
- Atomic stock decrement when purchasing a vehicle.
- Atomic stock increment when restocking.
- Concurrent purchase protection to prevent overselling.
- Concurrent restock protection to prevent lost updates.
- Purchase restrictions for out-of-stock, reserved, and sold vehicles.
- Stock quantity overflow protection.
- Server-side validation of inventory operations.
- Automatic inventory refresh using TanStack Query.

### Authentication and Security

- JWT-based authentication with one-hour access tokens.
- Argon2id password hashing.
- Role-based access control for administrator operations.
- Backend verification of current administrator permissions.
- Authentication rate limiting.
- Request validation using Zod.
- Parameterized PostgreSQL queries.
- HTTP security headers using Helmet.
- Configurable CORS.
- Automatic JWT expiration handling.
- Authentication cache cleanup on logout.
- Centralized API error handling.
- Graceful server shutdown.

## Technology Stack

| Layer               | Technologies                         |
| ------------------- | ------------------------------------ |
| Frontend            | React 19, TypeScript, Vite 8         |
| Styling             | Tailwind CSS 4, Lucide React         |
| Routing             | React Router                         |
| Server State        | TanStack Query                       |
| Backend             | Node.js, Express 5, TypeScript       |
| Database            | PostgreSQL                           |
| Authentication      | JWT (JOSE), Argon2id                 |
| Validation          | Zod                                  |
| Frontend Testing    | Vitest, React Testing Library, jsdom |
| Backend Testing     | Vitest, Supertest                    |
| Database Migrations | node-pg-migrate                      |
| Frontend Deployment | Vercel                               |
| Backend Deployment  | Render                               |
| Database Hosting    | Neon PostgreSQL                      |

## System Architecture

```text
                     USER / ADMIN
                          |
                          v
                  React + TypeScript
                     Tailwind CSS
                          |
                          v
                     React Router
                          |
                          v
                     TanStack Query
                          |
                          v
                      Vercel CDN
                          |
                      /api/* Proxy
                          |
                          v
                    Express REST API
                       (Render)
                          |
             +------------+------------+
             |                         |
             v                         v
      Authentication API          Vehicle API
             |                         |
      JWT + Argon2id              CRUD Operations
             |                    Search & Filtering
             |                    Purchase & Restock
             |                         |
             +------------+------------+
                          |
                          v
                     PostgreSQL
                        (Neon)
```

The React frontend communicates with the Express backend through REST APIs.

In production, Vercel rewrites `/api/*` requests to the Render backend. The backend handles validation, authentication, authorization, and database operations.

Inventory purchasing and restocking use conditional PostgreSQL updates to maintain stock consistency under concurrent requests.

## REST API Endpoints

### Authentication

| Method | Endpoint             | Description                         |
| ------ | -------------------- | ----------------------------------- |
| POST   | `/api/auth/register` | Register a new user                 |
| POST   | `/api/auth/login`    | Authenticate and receive a JWT      |
| GET    | `/api/auth/me`       | Retrieve authenticated user details |
| GET    | `/api/admin/health`  | Verify administrator permissions    |

### Vehicle Inventory

| Method | Endpoint                     | Access        | Description                                 |
| ------ | ---------------------------- | ------------- | ------------------------------------------- |
| GET    | `/api/cars`                  | Public        | List, search, filter, and paginate vehicles |
| GET    | `/api/cars/:id`              | Public        | Retrieve vehicle details                    |
| POST   | `/api/cars`                  | Admin         | Create a vehicle                            |
| PATCH  | `/api/cars/:id`              | Admin         | Update a vehicle                            |
| DELETE | `/api/cars/:id`              | Admin         | Delete a vehicle                            |
| GET    | `/api/vehicles`              | Public        | List vehicles                               |
| GET    | `/api/vehicles/search`       | Public        | Search and filter vehicles                  |
| GET    | `/api/vehicles/:id`          | Public        | Retrieve vehicle details                    |
| POST   | `/api/vehicles`              | Admin         | Create a vehicle                            |
| PUT    | `/api/vehicles/:id`          | Admin         | Update a vehicle                            |
| DELETE | `/api/vehicles/:id`          | Admin         | Delete a vehicle                            |
| POST   | `/api/vehicles/:id/purchase` | Authenticated | Decrease inventory by one unit              |
| POST   | `/api/vehicles/:id/restock`  | Admin         | Increase inventory quantity                 |

The `/api/cars` endpoints support the existing frontend, while `/api/vehicles` provides the additional vehicle management and inventory transaction endpoints.

### Purchase Example

**Request:**

```http
POST /api/vehicles/:id/purchase
Authorization: Bearer <access_token>
```

A successful request returns HTTP `200` with the updated vehicle record.

Purchasing is allowed only when the vehicle is available and its quantity is greater than zero.

Possible errors include:

- `400` — Invalid vehicle ID
- `401` — Authentication required
- `404` — Vehicle not found
- `409` — Out of stock or unavailable

### Restock Example

**Request:**

```http
POST /api/vehicles/:id/restock
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "quantity": 5
}
```

A successful request returns HTTP `200` with the updated vehicle record.

Only administrators can restock vehicles. The requested quantity must be a positive integer, and the resulting inventory must remain within PostgreSQL integer limits.

### Health Check

`GET /api/health`

Successful response:

```json
{
  "status": "ok"
}
```

## Database Design

### Users

The `users` table stores:

- Unique user ID
- Name
- Email
- Argon2id password hash
- Role (`user` or `admin`)

Email uniqueness is enforced case-insensitively.

### Cars

The `cars` table stores:

- Unique vehicle ID
- Manufacturer and model
- Vehicle category
- Model year
- Price
- Inventory quantity
- Mileage
- Fuel type
- Transmission
- Availability status
- Creation and update timestamps

Database constraints prevent invalid values such as negative prices, negative mileage, negative stock quantities, blank categories, and unsupported availability statuses.

### Database Migrations

AutoVault uses versioned SQL migrations:

1. `1792831118590_create-users.sql`
2. `1792831869167_enforce-user-constraints.sql`
3. `1792832200000_create-cars.sql`
4. `1792870000000_add-inventory-fields.sql`

The fourth migration introduces the `category` and `quantity` columns with database-level constraints.

## Project Structure

```text
car-dealership-inventory/
|
|-- backend/
|   |-- migrations/
|   |-- scripts/
|   |-- src/
|   |   |-- auth/
|   |   |-- cars/
|   |   |   |-- car.repository.ts
|   |   |   |-- car.routes.ts
|   |   |   |-- car.service.ts
|   |   |   |-- vehicle.routes.ts
|   |   |-- middleware/
|   |   |-- app.ts
|   |   |-- database.ts
|   |   |-- server.ts
|   |-- tests/
|   |-- package.json
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |   |-- PurchaseVehicleButton.tsx
|   |   |   |-- RestockVehicleDialog.tsx
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- test/
|   |-- vercel.json
|   |-- vite.config.ts
|   |-- vitest.config.ts
|   |-- package.json
|
|-- docs/
|   |-- screenshots/
|
|-- README.md
```

## Local Development

### Prerequisites

- Node.js and npm
- PostgreSQL database (local or Neon)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/BMittal09/car-dealership-inventory.git
cd car-dealership-inventory
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory using `.env.example` as a reference.

```env
PORT=3000
DATABASE_URL=YOUR_DEVELOPMENT_DATABASE_URL
TEST_DATABASE_URL=YOUR_TEST_DATABASE_URL
JWT_SECRET=YOUR_RANDOM_SIGNING_SECRET
CORS_ORIGINS=http://localhost:5173
```

Use separate PostgreSQL databases for development and testing.

The JWT signing secret must be cryptographically random and at least 32 bytes long.

Never commit `.env` files or real credentials.

### 3. Apply Database Migrations

```bash
npm run db:migrate
npm run db:migrate:test
```

### 4. Start the Backend

```bash
npm run dev
```

The backend runs at:

http://localhost:3000

### 5. Frontend Setup

Open another terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

http://localhost:5173

Vite automatically proxies local `/api` requests to the backend.

## Test-Driven Development

AutoVault follows the **Red → Green → Refactor** development cycle.

1. **Red:** Write a test describing the expected behavior and verify that it fails.
2. **Green:** Implement the minimum functionality required to pass the test.
3. **Refactor:** Improve the implementation while preserving passing tests.

This approach was used throughout authentication, vehicle management, inventory validation, purchasing, restocking, and frontend development.

## Automated Testing

### Backend Tests

```bash
cd backend
npm test
npm run typecheck
npm run build
```

Backend tests cover:

- User registration and login
- JWT authentication and administrator authorization
- Input validation and authentication rate limiting
- Database constraints
- Vehicle CRUD operations
- Inventory search, filtering, and pagination
- Category and quantity validation
- Atomic vehicle purchasing
- Concurrent purchase protection
- Administrator restocking
- Concurrent stock increments
- Out-of-stock and unavailable-vehicle restrictions
- Inventory quantity boundaries and overflow protection
- Security headers and CORS
- Error handling and graceful shutdown

### Frontend Tests

```bash
cd frontend
npm test
npm run build
npm run lint
```

Frontend tests cover:

- Authentication state management
- Login and logout behavior
- JWT expiration handling
- Protected administrator routes
- Session invalidation and query cache cleanup
- Vehicle API requests
- Purchase and restock API requests
- Purchase confirmation and cancellation
- Purchase loading, success, and error states
- Restock quantity validation and submission
- Inventory cache invalidation
- Delete confirmation behavior
- Keyboard accessibility

### Verified Test Results

| Test Suite | Passing Tests |
| ---------- | ------------: |
| Backend    |           184 |
| Frontend   |            61 |
| **Total**  |       **245** |

The reported final verification completed with all 245 automated tests passing, successful TypeScript compilation and production builds, and zero frontend lint warnings or errors.

## Production End-to-End Verification

The deployed application was tested using a temporary vehicle in the production environment.

The verification included:

1. Creating a vehicle with category and quantity.
2. Confirming visibility in public and administrator inventory.
3. Filtering inventory by vehicle category.
4. Canceling a purchase without changing stock.
5. Confirming a purchase and decreasing stock from 5 to 4.
6. Restocking inventory from 4 to 7.
7. Rejecting invalid restock quantities.
8. Setting quantity to zero and verifying purchase restrictions.
9. Canceling and confirming vehicle deletion.
10. Removing the temporary vehicle and restoring the original empty inventory.

These checks verified communication between the React frontend, Express backend, and Neon PostgreSQL database.

## Production Deployment

AutoVault is deployed using three cloud services.

**Vercel — Frontend**

Hosts the React application and forwards API requests to Render using `vercel.json`.

**Render — Backend**

Hosts the Express REST API with production environment variables, HTTPS, and automatic deployment from GitHub.

**Neon — Database**

Hosts the PostgreSQL production database on a separate branch from development.

The production database uses versioned migrations to manage schema changes.

A data-inclusive Neon recovery branch was created before the inventory schema migration.

### Production Environment Variables

The backend requires:

- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV`
- `CORS_ORIGINS`

Sensitive environment variables are configured through the hosting provider and are not stored in source control.

## Security Considerations

- Public registration creates regular user accounts.
- Administrator privileges are assigned separately.
- Backend authorization is enforced independently of frontend route protection.
- Passwords are stored as Argon2id hashes.
- JWTs are verified before protected operations.
- Access tokens are stored in memory rather than persistent browser storage.
- Sessions expire automatically.
- Authentication-related query caches are cleared during logout.
- Vehicle deletion and inventory purchasing require explicit confirmation.
- Administrator restocking is protected by backend role checks.
- PostgreSQL conditional updates prevent inventory overselling and lost restock increments.
- Production and development databases are isolated.

## Current Limitations

- The purchase endpoint decreases inventory but does not process payments, create orders, or transfer ownership.
- Vehicle images currently use placeholder illustrations rather than uploaded photographs.
- JWT sessions expire after one hour and do not use refresh tokens.
- Administrator dashboard statistics represent vehicle listings by status, rather than total stock units.
- The application is designed as an inventory management and TDD demonstration, not a complete commercial dealership transaction platform.

## Future Improvements

- Vehicle image uploads and cloud storage.
- Payment integration and order management.
- Purchase history and inventory transaction logs.
- Advanced vehicle sorting.
- Enhanced administrator analytics and stock-level reporting.
- Secure refresh-token-based persistent sessions.
- Expanded integration and browser-based end-to-end testing.

## Author

**Bhavya Mittal**

GitHub: https://github.com/BMittal09
