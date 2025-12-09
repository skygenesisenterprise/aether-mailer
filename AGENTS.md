# Agent Guidelines for aether-mailer

## Commands
- **Build**: `pnpm build` (Next.js production build)
- **Lint**: `pnpm lint` (ESLint with Next.js rules)
- **Dev**: `pnpm dev` (Next.js development server)
- **Test**: No test framework configured yet

## Code Style
- **Framework**: Next.js 16 with React 19, TypeScript strict mode
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Imports**: Named imports, type imports for Next.js types
- **Components**: Functional components with proper TypeScript typing
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Error Handling**: Use try/catch for async operations, proper error boundaries
- **Accessibility**: Semantic HTML, proper alt texts, keyboard navigation
- **Dark Mode**: Support with `dark:` prefixes and CSS variables
- **Fonts**: Google Fonts (Geist Sans/Mono) via CSS variables

## File Structure
- `app/` directory for Next.js App Router
- `public/` for static assets
- Root-level config files (eslint.config.mjs, tsconfig.json, etc.)

No Cursor rules or Copilot instructions found.