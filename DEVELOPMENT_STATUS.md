# Development Status

## Current Phase: Phase 20 - Advanced Analytics & Demographics
**Iteration**: 1 - Path Tracing and Heatmap preparation

### Completed Tasks
- Baseline functionality verified (Phases 1-18).
- `PROJECT_ROADMAP.md` generated.
- Created `UserModel` in SQLite for storing credentials and roles.
- Created JWT authentication utilities (hashing, token generation, decoding).
- Implemented `POST /api/auth/login` endpoint.
- Implemented FastAPI dependencies (`get_current_user`, `get_current_admin`) for route protection.
- Updated frontend `api/client.ts` to store JWT and attach it to API requests.
- Added Login page and AuthProvider context in React.
- Protected frontend routes (require login) and hidden Admin actions (Zone editing, Settings) for Viewers.

### Pending Tasks
- [ ] Move to Phase 20: Performance Analytics & Telemetry (Part 2)

### Files Changed
- (None yet)

### Bugs/Issues
- None known at baseline.

### Next Task
Implement backend User model, password hashing (`passlib`), and JWT generation (`pyjwt`).
