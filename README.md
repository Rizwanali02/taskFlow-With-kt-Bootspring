# TaskFlow

TaskFlow is a team task tracker built for the full stack take-home assignment. It has a Kotlin/Spring Boot REST API and a responsive React + TypeScript client.

## Architecture

The backend uses Spring Boot 3, Kotlin, Spring Data JPA, Spring Security, JWT, and H2 by default. Its layers are `api` (controllers, request/response DTOs, and error handling), `service` (business rules), `repository` (persistence), `model` (JPA entities), and `security` (JWT and authentication configuration).

Two backend patterns are used directly:

- **Repository:** Spring Data repository interfaces isolate persistence operations from services.
- **Specification:** `TaskSpecifications` composes optional task filters into a database query.

Entities are mapped to response DTOs so persistence models are not exposed. Passwords are stored as BCrypt hashes. JWTs protect every endpoint except registration and login, and project/task queries are scoped to the authenticated owner.

The frontend uses React Context for authentication and TanStack Query for server data, caching, and mutation refreshes. HTTP requests go through the shared Axios client in `client/src/lib/api.ts`. The UI uses shadcn/ui components with Radix primitives and Tailwind CSS.

## Run locally

Requirements: JDK 17 and Node.js 20.19+ or 22.12+. The Gradle wrapper downloads Gradle on first use.

Start the backend in one terminal:

```powershell
cd backend
./gradlew.bat bootRun
```

The backend uses an in-memory H2 database and listens on port 8080. Seed data is enabled by default. It creates a demo user, a project, and at least 10 tasks in each status (30 tasks total on a fresh database). To disable seed data, set `SEED_SAMPLE_DATA` to `false` before starting:

```powershell
$env:SEED_SAMPLE_DATA = 'false'
./gradlew.bat bootRun
```

Demo login: `demo@gmail.com` / `12121212`.

Start the frontend in a second terminal:

```powershell
cd client
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8080/api`. To change it, copy `client/.env.example` to `client/.env.local` and set `VITE_API_URL`.

For PostgreSQL instead of H2, set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`. Set `JWT_SECRET` to a random secret of at least 32 bytes before deployment.

## Frontend features

- Register and sign in with validation, protected routes, and expired-token handling.
- View and create projects.
- View tasks in To do, In progress, and Done columns, with per-status counts and an overdue summary.
- Create, edit, delete, and change task status; filter by priority and assignee; sort by due date.
- Loading, empty, and error feedback plus responsive desktop and mobile layouts.

## API

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account; returns JWT and user DTO |
| POST | `/api/auth/login` | Verify credentials; returns JWT and user DTO |
| GET, POST | `/api/projects` | List owned projects or create one |
| GET | `/api/projects/{id}/tasks` | Filter by status, priority, assignee; sort and paginate |
| POST | `/api/projects/{id}/tasks` | Create task; due date cannot be in the past |
| GET | `/api/projects/{id}/summary` | Counts by status and overdue count |
| PUT | `/api/tasks/{id}` | Update task fields |
| PATCH | `/api/tasks/{id}/status` | Change only task status |
| DELETE | `/api/tasks/{id}` | Delete task |

Validation errors use `{ "message": "Validation failed", "errors": { "title": "Title is required" }, "timestamp": "..." }`.

## Verify

```powershell
cd backend
./gradlew.bat test
cd ..\client
npm test
npm run build
```

Backend tests cover auth service behavior and registration, authorization, project creation, and listing. Frontend Jest + React Testing Library tests cover the project card and task card.

## Assumptions and trade-offs

- Only project owners can view or change their projects and tasks.
- The backend has no user directory endpoint, so the task form accepts an optional assignee user ID.
- H2 is the local default; PostgreSQL is selected through environment variables. Sample data is opt-in.
- OpenAPI documentation, database migrations, Docker Compose, and deployment workflow remain optional follow-up work.
