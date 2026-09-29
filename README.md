# Smart Complaint & Service Management Portal

Wipro TalentNext 2026-27 project — a full-stack complaint/service management portal.

## Stack
- Backend: Java 24, Spring Boot 3.5.x, Spring Security, JWT, JPA/Hibernate, REST, Maven
- Frontend: React + Vite + Axios
- Database: MySQL (XAMPP)
- Docs: Swagger/OpenAPI

## Local setup
1. Start XAMPP MySQL.
2. Open this repository in VS Code.
3. Backend: `cd backend` then `mvn spring-boot:run`
4. Frontend: `cd frontend` then `npm install` then `npm run dev`
5. Open the Vite URL shown in terminal (normally http://localhost:5173).

The backend creates the `smartserve` database/tables automatically through JPA.

## Demo accounts
- Admin: `admin@smartserve.local` / `Admin@123`
- Staff: `staff@smartserve.local` / `Staff@123`
- Customer: register from the UI

## API documentation
After backend starts: http://localhost:8080/swagger-ui.html

## Main flow
Register/Login -> JWT -> Customer dashboard -> Create complaint -> My complaints -> Staff status updates -> history/timeline -> resolution -> feedback.

## Final audit notes (v8)
- Frontend uses a single React entry point (`src/main.jsx` -> `App.jsx`) with role-specific CUSTOMER, STAFF and ADMIN workspaces.
- Complaint details now include live status history, comments, status actions, customer reopen and feedback where permitted.
- Admin can assign staff, update priority/status, manage categories, and enable/disable non-admin users.
- Customer complaint creation/list access is restricted to CUSTOMER role; staff APIs are restricted to STAFF role.
- Public category listing exposes active categories only.
- Password hashes are excluded from JSON responses.
- JWT secret can be supplied through `SMARTSERVE_JWT_SECRET`.
