# Project architecture rules

- Brand images and favicons live under `public/` and use root-relative URLs so every static host can serve them without runtime environment variables.
- Immersive chat routes own their full viewport and do not use the shared marketing layout, because chat controls need uninterrupted screen space.