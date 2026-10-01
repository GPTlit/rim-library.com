# QAHWA LIBRARY rebrand and immersive reading/chat update

## Branding and portable assets
- Replace the site name everywhere users see it with language-aware branding: **QAHWA LIBRARY** in English/French and **مكتبة القهوة** in Arabic.
- Save the uploaded square logo directly in `public/` and use that same local file for the header, footer, authentication screen, and favicon.
- Update page title, descriptions, social metadata, legal copy, notification labels, and image alt text to the new brand.
- Keep all new visual assets repository-local so GitHub and Vercel can serve them without asset-service environment variables.

## Immersive backgrounds
- Add the requested React Bits Prism and Gradient Waves components and their `ogl` dependency using the component registry.
- Put Gradient Waves behind the first home section containing the library name, search, and book statistics, with readable theme-aware overlays and reduced-motion support.
- Put Prism behind both Ahmed Salem AI and ETERKE.

## Full-page chat experiences
- Convert Ahmed Salem AI from a framed panel inside the standard site layout into its own full-viewport page with a dedicated back control, full-height transcript, and anchored composer.
- Convert ETERKE into the same dedicated full-viewport experience while preserving groups, private chats, uploads, voice, book sharing, dialogs, and mobile sidebar behavior.
- Keep `/author-chat` and `/eterke` as separate navigated pages and retain the current login barrier.

## PDF comfort and orientation controls
- Add a reader-only light/dark page button that inverts PDF pages without changing the toolbar or book cover imagery, and remember the choice locally.
- Add page rotation controls plus Auto, Portrait lock, and Landscape lock choices.
- Use the browser/device orientation API when available, retain manual PDF rotation everywhere, and clearly report when the browser does not permit physical orientation locking.
- Persist reader rotation and orientation choices locally and release the device orientation lock when leaving the reader.

## Verification
- Check the updated brand and local logo paths, then verify home, Ahmed Salem AI, ETERKE, and the PDF reader at desktop and mobile sizes.
- Confirm Prism/Gradient Waves render without blocking controls, reader inversion affects only PDF pages, rotation works, and the current build remains clean.
