# Three Dragon Ante — Copilot Instructions

## Project role

Three Dragon Ante is a browser-based D&D-inspired RPG/game project. Treat the repository as a real product codebase: preserve existing architecture, contracts, gameplay rules, and asset conventions unless the task explicitly changes them.

## Before changing code

- Read the relevant existing implementation before proposing or applying a change.
- Search for existing types, stores, utilities, components, hooks, and data models before creating new ones.
- Prefer extending an established system over introducing a parallel implementation.
- Check nearby tests and documentation for the behavior being changed.
- Keep the change narrowly scoped to the requested task.

## Architecture principles

- Maintain a single source of truth for domain state. Do not duplicate canonical character, inventory, equipment, spell, combat, or progression state in local component state when an existing store/model owns it.
- Keep domain logic out of presentation components where practical. Reusable calculations and rules belong in domain modules/services/utilities, not scattered through JSX.
- Prefer small, composable modules over large monolithic files.
- Reuse existing shared types and schemas. Do not create near-duplicate interfaces merely to make a local component easier to implement.
- Preserve public APIs and existing data contracts unless a migration is part of the task.
- When changing a persisted shape, consider existing saves and backward compatibility.

## TypeScript and React

- Use TypeScript strictly and preserve the repository's existing compiler settings.
- Avoid `any`, unsafe casts, and type suppression unless there is a documented, unavoidable reason.
- Prefer explicit domain types and discriminated unions where they improve correctness.
- Keep React components focused on rendering and interaction; move reusable business logic into hooks or domain modules.
- Do not introduce a new state-management library or architectural pattern without a clear repository-level reason.
- Follow the existing styling and component conventions instead of introducing an unrelated UI framework.

## Game rules and domain correctness

- Treat D&D 5e rules and the game's documented rules as domain requirements, not suggestions.
- Do not silently invent mechanics, stats, modifiers, spell behavior, equipment rules, or character progression.
- When the repository contains an established game rule, calculation, or canonical data source, reuse it.
- Keep rules calculations deterministic and testable.
- Be especially careful with derived character values: avoid calculating the same value differently in multiple screens.
- Preserve the distinction between source data, derived state, and presentation state.

## Character, inventory, equipment, and spells

- Character data must have one canonical owner. UI views should consume that canonical state rather than maintain competing copies.
- Inventory and equipment operations must mutate the canonical stores/models through their existing APIs.
- Do not bypass existing item/equipment schemas with ad-hoc objects.
- Items, equipment, spells, and other content should reference canonical IDs/data where the project already provides them.
- Preserve compatibility with existing character saves when modifying these systems.
- Spell data, spell slots, prepared/known spells, spellbook presentation, and spell assets are separate concerns; do not conflate them into a single UI-only model.

## Assets

- Reuse existing assets and asset registries before adding new files.
- Follow the repository's established `public/assets` structure and naming conventions.
- Do not introduce external image-generation URLs or runtime dependencies when a local asset is expected.
- Do not create arbitrary duplicate sprite sheets or copies of the same asset for individual classes/screens.
- Keep asset references deterministic and portable between development and production builds.

## UI and UX

- Preserve the existing visual language unless the task explicitly requests a redesign.
- Prefer predictable interaction patterns and clear feedback for game actions.
- Do not hide gameplay state behind unnecessary abstractions or animations that make state harder to understand.
- Interactive elements should have appropriate keyboard/focus behavior where applicable.
- Avoid broad UI rewrites when fixing a localized interaction or layout problem.

## Testing and verification

- Run the smallest relevant checks during development, then run the project's standard validation before considering the task complete.
- At minimum, use the repository's existing typecheck, test, and build commands when the change affects code covered by them.
- Add or update tests for non-trivial domain behavior and regressions.
- Do not weaken, delete, or bypass tests simply to make a change pass.
- If a check cannot be run, report that explicitly rather than claiming success.

## Git and change discipline

- Keep commits focused and explain the intent in the commit message.
- Do not modify unrelated files, generated artifacts, secrets, or user data.
- Never commit API keys, tokens, credentials, `.env` secrets, or private data.
- Do not rewrite history or force-push unless explicitly required.
- Respect existing branch/PR workflows and leave a clear summary of changes and verification performed.

## Documentation

- Update relevant documentation when behavior, architecture, data contracts, workflows, or developer setup changes.
- Prefer correcting the authoritative document rather than adding a second document that says the same thing.
- Do not invent undocumented project conventions. If the repository is ambiguous, inspect existing usage and choose the least disruptive interpretation.

## Agent behavior

- Work from evidence in the repository, not assumptions.
- If multiple implementations already exist, identify the canonical one before changing anything.
- Prefer the simplest solution that fits the existing architecture.
- Avoid speculative refactors, dependency churn, and premature abstraction.
- Never claim a task is complete without checking the relevant files and validation results.
- When a task exposes an architectural inconsistency, fix it only if it is necessary for correctness or explicitly included in scope; otherwise document it for follow-up.
