# Project architecture rules

- Brand images and favicons live under `public/` and use root-relative URLs so every static host can serve them without runtime environment variables.
- Immersive chat routes own their full viewport and do not use the shared marketing layout, because chat controls need uninterrupted screen space.
- Do not manually split React/vendor chunks in Vite; dependency cycles previously caused blank production pages.
- The reader uses a bundled PDF worker, bounded adjacent-page rendering, and a memoized page component to work offline and avoid growing canvas memory.
- Native document access uses granted content URIs and app-private copies; automatic discovery must never bypass scoped-storage permissions.
- Widget payloads share the reader's persisted page position and refresh on reading events; native OS scheduling is best-effort, not continuous animation.