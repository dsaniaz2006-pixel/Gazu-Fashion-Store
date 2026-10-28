# Changes from the uploaded frontend

- Moved the original React/Vite app into `frontend/`; kept the GAZU wordmark, hero sections, catalogue layout, cart layout, editorial pages, original stylesheet and Unsplash images.
- Replaced the 12 hard-coded catalogue records with MongoDB data. The seed creates three products; admin can add more.
- Replaced demo sign-in, checkout and tracking placeholders with API-backed pages in `frontend/src/pages/`.
- Added backend-backed cart quantity controls, availability badges, disabled sold-out buttons, loading states, error messages, and retry controls.
- Added customer registration, password hashing, JWT login and server-enforced administrator permissions.
- Added admin create/read/update/delete products, stock quantity/manual availability, all-orders view and sequential status controls.
- Added an Express backend with separate config, models, routes, middleware, services, seed script and tests.
- Added MongoDB transactions for checkout and cart edits; server-calculated totals; order snapshots; retry reference uniqueness.
- Added a free local payment simulation with success and failure choices. No external provider is required or connected.
- Removed the old cosmetic size chooser because no size variants were requested or stored.
- Fixed the old nested form-rendering pattern so typing in search/newsletter does not remount inputs on every keystroke.
- Added source comments, readable formatting, dependency lockfiles and Mac setup/API documentation.

## Intentionally outside this request

The reference blueprint also discusses cancellation, category management, pagination, deployment, image uploads and other future features. Those were not added to this minimal version. MySQL in the blueprint was replaced by MongoDB as requested. Real gateway payments are a future extension; only COD and the clearly-labelled mock API are implemented.

The public newsletter is still a labelled visual demo, the wishlist is in-memory, and editorial shipping/returns copy is not an implemented returns workflow. Product images remain external Unsplash references. Session storage is suitable for this local learning demo; a deployed shop needs a separate security/deployment review and real payment verification.
