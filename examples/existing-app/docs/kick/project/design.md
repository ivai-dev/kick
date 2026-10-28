# Design

## Solution

One Express server serving a JSON API and a static HTML page (read from the code on 2026-10-20).

## Technology

Node.js 20, Express 4, a JSON file as the store (`src/store.js`), plain HTML and JavaScript.

## Screen map

| Write and find notes |
| --- |
| Notes list (with tag filter) |

## Design rules

The existing page has no styling; new screens keep it plain and fast.

## Decisions

### Tags are stored on the note (2026-10-21)

Tags live in each note's `tags` list rather than a separate store, because there is no database. Changing it later
would cost a migration of notes.json.
