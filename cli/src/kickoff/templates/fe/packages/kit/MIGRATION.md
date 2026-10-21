# @kickoff/kit migration notes

`kickoff fe update` prints each line below that starts with "- ".

- 0.5.0: first release of @kickoff/kit; nothing to migrate.
- 0.7.0: the prototype bar gains a Direction switch (config.ts `directions`, locked by `direction`) and a Tweaks panel; `?direction=` and `?tweak=` are reserved URL parameters. To use directions in a project made before 0.7.0, add `@import "./directions.css";` after `@import "./tokens.css";` in apps/web/src/styles/index.css and create apps/web/src/styles/directions.css (kickoff:design-direction step 5).
