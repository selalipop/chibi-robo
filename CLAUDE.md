# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Development server**: `npm run dev` (starts Next.js dev server on localhost:3000)
- **Build**: `npm run build` (creates production build)
- **Production server**: `npm start` (runs production build)

## Architecture Overview

This is a Next.js application using the Pages Router pattern with tRPC for type-safe API calls and shadcn/ui for components.

### Core Technologies
- **Next.js 15** with Pages Router (`src/pages/`)
- **tRPC v11** for type-safe client-server communication
- **TypeScript** with strict mode enabled
- **Tailwind CSS v4** with shadcn/ui component library
- **React Query** (@tanstack/react-query) for client-side data fetching via tRPC

### Project Structure
- `src/pages/` - Next.js pages including API routes
- `src/server/` - tRPC server setup and routers
- `src/components/ui/` - shadcn/ui components (auto-generated, avoid manual edits)
- `src/lib/` - Utility functions
- `src/utils/` - tRPC client configuration
- `src/hooks/` - Custom React hooks

### tRPC Setup
- Server router defined in `src/server/routers/backend.ts` (exported as `AppRouter`)
- Client configuration in `src/utils/trpc.ts` 
- App wrapper in `src/pages/_app.tsx` enables tRPC across all pages
- API endpoint at `/api/trpc/[trpc].ts`

### Key Application Features
The app appears to be an AI-powered image analysis tool:
- `getImageSuggestions` - Takes base64 image and returns creative suggestions
- `getSceneImages` - Generates composite images from scene descriptions (streaming)
- Uses Zod for input/output validation

### shadcn/ui Configuration
- Style: "new-york"
- Base color: "neutral" 
- CSS variables enabled
- Components path: `@/components/ui`
- Utilities path: `@/lib/utils`

### TypeScript Configuration
- Path alias `@/*` maps to `src/*`
- Strict mode enabled
- Uses bundler module resolution