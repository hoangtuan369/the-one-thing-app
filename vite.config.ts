// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      // Exclude Drawnix and all its plait dependencies from SSR bundling.
      // These are browser-only libraries that use DOM APIs.
      noExternal: [],
      external: [
        '@drawnix/drawnix',
        '@plait-board/react-board',
        '@plait-board/react-text',
        '@plait/core',
        '@plait/common',
        '@plait/draw',
        '@plait/layouts',
        '@plait/mind',
        '@plait/text-plugins',
        'roughjs',
        'localforage',
        'laser-pen',
      ],
    },
    optimizeDeps: {
      include: [
        '@drawnix/drawnix',
        '@plait-board/react-board',
        '@plait/core',
        '@plait/common',
        '@plait/draw',
        '@plait/mind',
        'roughjs',
        'localforage',
      ],
    },
  },
});
