# Replacing mock endpoints with real ones

The screens were built against mock endpoints. A feature kick replaces them one at a time, so the screens never change.

## Per endpoint

1. **Read the contract**: the endpoint's row and details in `docs/kick/project/api.md` (what it takes, what it returns, roles, empty, error and paging behaviour) and the mock handler itself.
2. **Write the contract test first** (`ecc:contract-first`): the real endpoint answers with the same shape, status codes and states as the mock, per role. It runs in the project's test suite.
3. **Build the endpoint** with ECC (`ecc:orch-add-feature`) until the contract test and its own tests pass. Server work the screens did for the mock moves to the server (the endpoint's details say where).
4. **Switch it**: point the API layer at the real endpoint for this endpoint only; remove its mock handler or keep it for tests.
5. **Run the journey tests** (`ecc:e2e-testing`) of the screens that use it.
6. **Update `api.md`**: Status `real`; a contract change is written in its details, with the screens it affects.

## When the contract must change

When the real server cannot answer as the mock did (a field cannot be computed, a total is too slow), do not quietly change the screen. Say what must change and what it costs, ask (`kick:change`), then change the contract, the mock, the screen and the test together.

## Done

Every endpoint of the feature is `real`, its contract tests pass, the journeys still pass, and the "sample data" banner goes when the last endpoint of a screen is real.
