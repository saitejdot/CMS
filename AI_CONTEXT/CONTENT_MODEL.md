# CONTENT_MODEL.md

## Current Entities (Phase 1A)
- **Blog**: Represents a written article. Categories: tech, fitness, life, motivation.
- **Subscriber**: Represents a user subscribed to email notifications.

## Future Entities (Phase 1B+)
- **Story**: The renamed "Blog" entity, updated to support structured blocks instead of raw HTML.
- **Project**: Portfolio projects with details, tech stack, and links.
- **Career**: Experience, education, skills, and certifications.
- **AuditLog**: Immutable record of admin actions.

## State Transitions (Future)
Stories will support explicit lifecycle states:
- `DRAFT`: Visible only in CMS.
- `PUBLISHED`: Visible to public.
- `ARCHIVED`: Hidden from public, retained in CMS.
