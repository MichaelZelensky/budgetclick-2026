# CONSTITUTION

- Responses: short.
- Changes: minimal diffs only.
- Preserve existing behavior, comments, formatting, quotes, mojibake, and error messages unless requested.

## Naming

- Variables/functions/properties: camelCase.
- Types/interfaces/enums/classes: PascalCase.
- Regular files: kebab-case.
- Type files: PascalCase.
- Use meaningful names.
- Use `x` for trivial callbacks (`arr.map(x => x.id)`).
- Use `database`, never `db`.
- Use verbalized function names.

## TypeScript

- No `any`.
- Prefer type inference.
- No redundant return type annotations.

## Functions

- `const abc = () => {};`
- Avoid `function` syntax unless explicitly required.
- `const` only.
- Prefer pure functions.
- Small and modular.

## Formatting

- Always use `;`.
- Always use `"`.
- One-line imports.
- Indent; do not align vertically.
- No visual separators.
- Keep related lines together.

## Comments

- Do not add comments.
- Preserve existing comments.

## Errors

- Throw exceptions.
- Capitalized messages.
- No trailing punctuation.

## Editing Rules

1. Minimal changes only.
2. No unrelated refactoring.
3. No style-only rewrites.
4. Do not fix unrelated issues.
5. Respect surrounding code style.

## Priority

1. Explicit user instructions.
2. Existing codebase conventions.
3. This constitution.