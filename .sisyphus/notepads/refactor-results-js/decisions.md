# Decisions

- D1: State sharing via mutable object export (export const state = {...})
- D2: DOM access in modules via document.getElementById() directly
- D3: Vendored libs (Chart, XLSX) used as bare globals
- D4: renderData → comparison.js, initializeUI → data.js
- D5: exportToExcel pre-existing behavior preserved (no selectedDay/searchTerm filter)
- D6: window.removeFilter retained as legacy dead code
- Circular imports (filters↔charts, filters↔table) safe because calls happen inside function bodies only
