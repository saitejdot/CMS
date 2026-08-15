# AI.md

## Current State (Phase 1A)
**AI is NOT implemented.**

## Planned Architecture (Phase 4)

### 1. Ask Tej (RAG Chatbot)
- **Purpose**: Allow visitors to ask questions about Tej's career, projects, and public stories.
- **Data Source**: A vector database populated ONLY with public, published content (Stories, Career, About). Private drafts or admin notes must never enter the vector DB.
- **Protection**: Strict prompt injection protection and strict rate limits (cost control).

### 2. Auto-Translation
- **Purpose**: Translate stories into other languages.
- **Storage**: Translations will likely be stored in the Story document or a related translation model.
- **Cost Control**: Admin-triggered only, or strict rate limits if user-triggered.

*AI Provider API keys are not required until Phase 4.*
