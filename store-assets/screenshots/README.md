# Store Screenshots

Required: 5 screenshots at **1280×800px** PNG format.

## Capture Instructions

1. Run demo mode: `npm run dev`
2. Open `http://localhost:3000/results.html` (loads mock data automatically)
3. Set browser window to exactly 1280×800
4. Capture each state below

## Required Screenshots

| Filename | State to capture |
|----------|-----------------|
| `01-dashboard-overview.png` | Default view: summary cards + monthly bar chart + table |
| `02-bar-chart-drilldown.png` | Click a month bar → shows daily breakdown chart |
| `03-table-with-filters.png` | Apply a filter → filter chip visible + table filtered |
| `04-popup-on-shopee.png` | Open extension popup while on shopee.vn |
| `05-excel-export.png` | Click export → browser download dialog OR opened Excel file |

## Tips

- Use mock data (demo mode) to avoid showing real personal order data
- Ensure charts have visible data (mock-data.js has representative orders)
- For popup screenshot: load as unpacked extension, navigate to shopee.vn, then click icon
