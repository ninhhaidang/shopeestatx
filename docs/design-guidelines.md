# Design Guidelines

## Direction

ShopeeStatX is an information-dense spending tool, not a marketing landing page. Use flat warm-neutral surfaces, thin separators, clear typography, and Shopee orange only for actions and significant totals. Avoid gradients, glass, glow, decorative emoji, animated hover lifts, and purely ornamental illustrations.

## Implementation

- Dashboard tokens originate in `src/styles/variables.css`; theme accents and status palettes live in `src/styles/themes.css`. `src/styles/editorial.css`, imported last by `src/dashboard/results.css`, sets the shared quiet surface and compact dashboard hierarchy.
- Popup and onboarding have standalone styles in `src/popup/popup.css` and `src/welcome/welcome.css`. Keep their shape and hierarchy consistent with the dashboard, without relying on dashboard CSS.
- System font stack only; Vietnamese content must remain readable without network access.
- Surfaces: warm gray page, plain cards, 1px boundaries, 4–8px radii. Summary values carry hierarchy through weight and size, not color effects. Keep status colors semantic; do not use status hues as decoration.
- Layout: dashboard summary forms one three-column ledger on desktop and stacked rows on narrow screens. Search/date controls stay visible; secondary filters are expandable. Analytics panels, table, popup links and onboarding permissions use restrained separators.
- Browser width 390px must not horizontally overflow; wide order tables and heatmaps scroll inside their own containers. Check desktop and narrow viewports after changing layout.
- Focus-visible outline is mandatory for buttons, inputs, selects, and links; preserve labels and keyboard actions. Honor `prefers-reduced-motion`.
- Existing chart and status data remain interactive. Visual simplification must never hide totals, statuses, filtering, pagination, export choices, or error states.
