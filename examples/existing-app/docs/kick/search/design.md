# Search notes — design

## Options considered

1. **Scan notes.json on every request**: no new parts; slower past a few thousand notes.
2. **SQLite with full-text search**: fast at any size; moves the store, which the tag filter also uses.

## Chosen solution

Option 1, with a test at 5,000 notes; the cost note in docs/kick/project/api.md says when to revisit.
