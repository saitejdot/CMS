# HANDOFF.md

## Welcome, AI Agent!

If you are reading this, you are picking up work on CMS v2.

**STOP AND READ THIS BEFORE WRITING CODE.**

### 1. Context is King
The state of this project is fully documented in the `AI_CONTEXT` folder. 
Do not guess how the app works. Read the specs.
- Identity: `PROJECT.md`
- Security: `SECURITY.md`, `AUTHENTICATION.md`
- Data: `DATABASE.md`, `CONTENT_MODEL.md`
- APIs: `API_REFERENCE.md`, `ROUTES.md`

### 2. The Golden Rules
1. **Never break the visual design.** (See `UI_DESIGN.md`).
2. **Never commit secrets.** (See `ENVIRONMENT.md`).
3. **Respect the phased approach.** Do not build Phase 3 features while we are in Phase 1B. (See `IMPLEMENTATION_STATUS.md`).

### 3. How to Start Your Turn
1. Check `IMPLEMENTATION_STATUS.md` to see what phase we are in.
2. Check `MIGRATIONS.md` to ensure you aren't about to write over old data.
3. Check `KNOWN_ISSUES.md` so you don't waste time "discovering" known technical debt.
4. If you are modifying an API route, ensure you follow the security architecture described in `AUTHENTICATION.md`.

### 4. When You Finish
Update `IMPLEMENTATION_STATUS.md` if you completed a major milestone.
Update `API_REFERENCE.md` if you changed a route.
Update `DATABASE.md` if you changed a schema.
Leave this `HANDOFF.md` untouched unless the handoff process itself needs changing.
