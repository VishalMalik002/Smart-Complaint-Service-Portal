# Project Flow

Browser → React UI → Axios → Spring Boot REST API → Spring Security/JWT → Service layer → JPA/Hibernate → MySQL.

Roles: CUSTOMER, SUPPORT_AGENT, ADMIN.

Complaint lifecycle: SUBMITTED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED, with REOPENED support.

The project keeps a single backend application rather than microservices so the architecture remains easy to understand and demonstrate.
