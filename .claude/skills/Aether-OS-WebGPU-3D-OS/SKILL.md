```markdown
# Aether-OS-WebGPU-3D-OS Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the Aether-OS-WebGPU-3D-OS TypeScript codebase. You'll learn about file naming, import/export styles, commit message conventions, and how to write and locate tests. The repository is framework-agnostic and focuses on clean, maintainable TypeScript for a 3D OS leveraging WebGPU.

## Coding Conventions

### File Naming
- **PascalCase** is used for file names.
  - Example: `MainWindow.ts`, `RendererCore.ts`

### Import Style
- **Relative imports** are preferred.
  - Example:
    ```typescript
    import { RendererCore } from './RendererCore';
    ```

### Export Style
- **Named exports** are used instead of default exports.
  - Example:
    ```typescript
    // RendererCore.ts
    export function initializeRenderer() { ... }
    ```

### Commit Messages
- **Conventional commits** are used, with prefixes such as `docs`.
- Messages are concise (average 68 characters).
  - Example: `docs: update README with setup instructions`

## Workflows

### Documentation Update
**Trigger:** When documentation needs to be updated or clarified  
**Command:** `/update-docs`

1. Edit the relevant documentation files (e.g., `README.md`).
2. Use a conventional commit message with the `docs` prefix.
   - Example: `docs: clarify setup instructions for WebGPU`
3. Push your changes to the repository.

### Adding New Features or Code
**Trigger:** When implementing new functionality  
**Command:** `/add-feature`

1. Create new files using PascalCase naming.
2. Use relative imports for dependencies.
3. Export functions, classes, or constants using named exports.
4. Write or update tests as needed (see Testing Patterns).
5. Commit changes with a relevant conventional commit message.
6. Push your branch and open a pull request if collaborating.

### Writing and Running Tests
**Trigger:** When adding or updating tests  
**Command:** `/run-tests`

1. Create test files matching the `*.test.*` pattern (e.g., `RendererCore.test.ts`).
2. Write tests according to the project's style (see Testing Patterns).
3. Use your preferred test runner (framework is not specified).
4. Run tests locally before pushing changes.

## Testing Patterns

- Test files follow the `*.test.*` naming convention.
  - Example: `RendererCore.test.ts`
- The specific testing framework is not specified; use standard TypeScript testing practices.
- Place tests alongside the code or in a dedicated `tests` directory, as appropriate.
- Example test file:
  ```typescript
  // RendererCore.test.ts
  import { initializeRenderer } from './RendererCore';

  describe('initializeRenderer', () => {
    it('should initialize without errors', () => {
      expect(() => initializeRenderer()).not.toThrow();
    });
  });
  ```

## Commands
| Command         | Purpose                                         |
|-----------------|-------------------------------------------------|
| /update-docs    | Update or clarify documentation                 |
| /add-feature    | Add new features or code following conventions  |
| /run-tests      | Run all tests in the codebase                   |
```