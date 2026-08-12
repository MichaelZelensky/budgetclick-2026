# CONSTITUTION

Version: 1.0.0

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

- `const abc = (a: TypeA, b: TypeB) => {};`
- Avoid `function` syntax unless explicitly required.
- `const` only.
- Prefer pure functions.
- Small and modular.
- Arguments in one line unless too long: `abc(a, b);`, `const abc = (a: TypeA, b: TypeB) => {};`

## Formatting

- Always use `;`.
- Always use `"`.
- One-line imports.
- Indent; do not align vertically.
- No visual separators.
- Keep related lines together.
- Indent with 2 spaces

## Spacing

- No spacer lines within a 0-level block (imports, top-level consts, etc.).
- Spacer line only before nested blocks (functions, if, etc.), not inside them.
- No spacer lines inside functions.
- Example:

```ts
import x from 'x';
import y from 'y';
//... no spacer lines in the header / import block
import z from 'z';

const A = 'A';
//... no spacer lines in initial constants or any 0-level block
const Z = 'Z';

const a = () => {
  // no spacers inside functions, spacer only before the function
  const var1 = 'var1';
  if (true) {
    // operations
  }
}

a(); // notice spacer before the 0-level block
```

## Comments

- Do not add comments.
- Preserve existing comments.

## Errors

- Throw exceptions.
- Capitalized messages.
- No trailing punctuation.

## Editing Rules

1. Minimal changes only.
2. Prefer insertion/deletion operations over replacement when possible.
3. Do not replace unchanged lines.
4. No unrelated refactoring.
5. No style-only rewrites.
6. Do not fix unrelated issues.
7. Respect surrounding code style.

## Priority

1. Explicit user instructions.
2. Existing codebase conventions.
3. This constitution.
