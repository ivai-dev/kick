# API

## Endpoints

| Endpoint | Used by | Roles | Status | Cost |
| --- | --- | --- | --- | --- |
| GET /notes?tag= | notes list | everyone | real | |
| POST /notes | notes list | everyone | real | |
| DELETE /notes/{id} | notes list | everyone | real | |
| GET /notes/search?q= | notes list | everyone | mock | grows with the number of notes: a full scan of notes.json |
