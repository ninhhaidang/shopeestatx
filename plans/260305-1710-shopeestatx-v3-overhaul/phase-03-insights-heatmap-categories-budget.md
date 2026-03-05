# Phase 3: Insights — Heatmap + Categories + Budget + Trends

## Context Links
- [Plan overview](./plan.md)
- [Phase 2: Polish](./phase-02-polish-dark-mode-fetch-export.md)
- Depends on Phase 1 (TypeScript) and Phase 2 (dark mode support)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 28h
- **Version target:** v3.0

Transform ShopeeStatX from "data viewer" to "spending intelligence tool". Add calendar heatmap, product categorization, budget tracking, trend analysis, spending predictions, and shop loyalty insights.

## Key Insights
- All analytics are client-side — pure computation on existing order data
- Heatmap is custom SVG, no library needed (GitHub-style 52x7 grid)
- Categorization uses keyword matching on product name + shop name
- Budget feature needs settings panel (first settings UI in the app)
- Trends = simple math (moving average, month-over-month), no ML

## Requirements

### Functional
- Calendar heatmap showing daily spending intensity for past year
- Auto-categorize orders into 8-10 categories with category chart + manual override
- Set monthly budget with progress indicator and color alerts
- Auto-generated spending insights in natural language
- Spending prediction for current month based on pace
- Shop loyalty metrics (repeat rate, first/last purchase)

### Non-Functional
- All computations complete < 200ms for 1000 orders
- Heatmap renders < 100ms
- Categories work offline (no external API)
- Budget alerts non-intrusive

## Architecture

### New Modules
```
src/dashboard/
├── heatmap.ts          # Calendar heatmap SVG renderer
├── categories.ts       # Product categorization engine + chart
├── budget.ts           # Budget tracking, progress ring, alerts
├── insights.ts         # Auto-generated spending insights text
├── predictions.ts      # Month-end spending prediction
└── shop-loyalty.ts     # Shop repeat purchase analysis
```

### Category Classification Engine
```ts
const CATEGORY_RULES: Record<string, string[]> = {
  'Dien tu & Cong nghe': ['laptop', 'dien thoai', 'phone', 'tai nghe', 'earphone', 'sac', 'cap', 'usb', 'chuot', 'ban phim', 'man hinh', 'camera', 'loa', 'pin', 'adapter', 'case', 'op lung'],
  'Thoi trang': ['ao', 'quan', 'vay', 'dam', 'giay', 'dep', 'tui xach', 'balo', 'that lung', 'kinh mat', 'non', 'tat', 'gang tay'],
  'Sac dep': ['kem', 'son', 'phan', 'nuoc hoa', 'sua rua', 'dau goi', 'toner', 'serum', 'mascara', 'kem chong nang'],
  'Thuc pham': ['banh', 'keo', 'tra', 'cafe', 'do an', 'mi', 'nuoc', 'sua', 'hat', 'snack', 'gia vi', 'dau an'],
  'Nha cua & Doi song': ['den', 'khung anh', 'ga', 'goi', 'rem', 'thung', 'hop', 'ke', 'tu', 'ban', 'ghe'],
  'Suc khoe': ['vitamin', 'thuoc', 'khau trang', 'nhiet ke', 'bang', 'gel'],
  'The thao': ['gym', 'yoga', 'chay bo', 'bong', 'vot', 'gang tay'],
  'Sach & Van phong': ['sach', 'vo', 'but', 'giay', 'bang keo', 'keo', 'ghim'],
};
// Fallback: 'Khac' (Other)
```

### Heatmap Data Structure
```ts
interface HeatmapDay {
  date: string;      // YYYY-MM-DD
  amount: number;    // total spending
  orderCount: number;
  intensity: 0 | 1 | 2 | 3 | 4; // quintile-based
}
```

### Budget Storage
```ts
interface BudgetConfig {
  monthlyLimit: number;   // VND
  enabled: boolean;
  alertThreshold: number; // 0.8 = alert at 80%
}
// Stored in chrome.storage.local under key 'shopeestatxBudget'
```

## Related Code Files

### Files to Create
| File | Description |
|------|-------------|
| `src/dashboard/heatmap.ts` | Calendar heatmap SVG generator (~120 lines) |
| `src/dashboard/categories.ts` | Category classifier + doughnut chart (~100 lines) |
| `src/dashboard/budget.ts` | Budget config, progress ring, alerts (~100 lines) |
| `src/dashboard/insights.ts` | Auto-generated insight sentences (~80 lines) |
| `src/dashboard/predictions.ts` | Month-end spending prediction (~40 lines) |
| `src/dashboard/shop-loyalty.ts` | Repeat shop analysis (~60 lines) |
| `src/styles/insights.css` | Styles for new insight components |
| `tests/categories.test.ts` | Unit tests for categorization engine |
| `tests/predictions.test.ts` | Unit tests for prediction math |

### Files to Modify
| File | Changes |
|------|---------|
| `src/dashboard/results.html` | Add sections: heatmap, insights panel, budget widget, category chart |
| `src/dashboard/results.ts` | Import + wire new modules, add budget settings modal |
| `src/dashboard/filters.ts` | Add category filter option |
| `src/dashboard/comparison.ts` | Integrate predictions into comparison cards |
| `src/styles/cards.css` | Budget progress ring styles |
| `src/styles/variables.css` | Add heatmap intensity colors (light + dark) |

## Implementation Steps

### Step 1: Spending Heatmap (6h)
1. Create `src/dashboard/heatmap.ts`:
   - `buildHeatmapData(orders: Order[]): HeatmapDay[]` — group by date, calculate amounts
   - `renderHeatmap(container: HTMLElement, data: HeatmapDay[]): void` — SVG grid
   - SVG structure: 52 columns × 7 rows, each cell = 12×12px with 2px gap
   - Color scale: 5 levels (--heatmap-0 through --heatmap-4)
   - Tooltip on hover: "15/03/2026: 350,000 VND (3 don)"
   - Click cell → filter table to that day
2. Add to results.html between comparison cards and charts
3. Add heatmap colors to variables.css:
   ```css
   :root {
     --heatmap-0: #ebedf0;
     --heatmap-1: #ffddd2;
     --heatmap-2: #ffab91;
     --heatmap-3: #ff6b3d;
     --heatmap-4: #d73211;
   }
   :root[data-theme="dark"] {
     --heatmap-0: #161b22;
     --heatmap-1: #3d1f14;
     --heatmap-2: #6b2e1a;
     --heatmap-3: #a04020;
     --heatmap-4: #ee4d2d;
   }
   ```
4. Responsive: horizontal scroll on mobile

### Step 2: Product Categorization (8h)
1. Create `src/dashboard/categories.ts`:
   - `categorizeOrder(order: Order): string` — match product name + shop name against keyword rules
   - `getCategoryBreakdown(orders: Order[]): Record<string, { amount: number, count: number }>` — aggregate
   - `renderCategoryChart(container: HTMLCanvasElement, data: CategoryBreakdown): void` — doughnut chart
2. Category matching logic:
   - Normalize: lowercase, remove diacritics (Vietnamese), trim
   - Match against keyword arrays (longest match first to avoid false positives)
   - Fallback: "Khac" (Other)
3. Add category doughnut chart next to shop chart
4. Add category filter to toolbar (new `<select>`)
5. Extend `applyFilters()` to include category filter
6. Write tests for categorization accuracy

### Step 3: Budget Tracking (4h)
1. Create `src/dashboard/budget.ts`:
   - `loadBudgetConfig(): Promise<BudgetConfig>`
   - `saveBudgetConfig(config: BudgetConfig): Promise<void>`
   - `renderBudgetWidget(container: HTMLElement, spent: number, config: BudgetConfig): void`
   - Progress ring SVG: circle with stroke-dasharray for percentage
   - Color: green (< 60%), yellow (60-80%), red (> 80%)
2. Settings modal (simple):
   ```html
   <dialog id="budgetDialog">
     <h3>Cai dat ngan sach</h3>
     <label>Han muc hang thang (VND): <input type="number" id="budgetLimit" /></label>
     <label>Canh bao tai (%): <input type="range" id="budgetThreshold" min="50" max="95" /></label>
     <button>Luu</button>
   </dialog>
   ```
3. Budget widget replaces/augments "Thang nay" comparison card
4. Alert: toast notification when spending crosses threshold

### Step 4: Auto-Generated Insights (4h)
1. Create `src/dashboard/insights.ts`:
   - `generateInsights(orders: Order[], allOrders: Order[]): string[]`
   - Insight templates:
     ```
     "Ban da chi {amount} trong thang nay, {change}% so voi thang truoc"
     "Shop {name} la noi ban mua nhieu nhat ({count} don)"
     "Danh muc {category} chiem {percent}% chi tieu"
     "Ban mua trung binh {avg} don/thang"
     "Ngay {date} la ngay ban chi nhieu nhat ({amount})"
     "Ban da tiet kiem {amount} nho cac don bi huy"
     ```
   - Select top 3-5 most relevant insights
2. Display in a card below summary, with light bulb icon
3. Insights update when filters change

### Step 5: Spending Predictions (2h)
1. Create `src/dashboard/predictions.ts`:
   ```ts
   export function predictMonthEnd(orders: Order[]): number {
     const now = new Date();
     const dayOfMonth = now.getDate();
     const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

     const thisMonthOrders = orders.filter(o =>
       o.orderMonth === now.getMonth() + 1 &&
       o.orderYear === now.getFullYear() &&
       o.statusCode !== 4 && o.statusCode !== 12
     );
     const currentSpending = thisMonthOrders.reduce((s, o) => s + o.subTotal, 0);

     return (currentSpending / dayOfMonth) * daysInMonth;
   }
   ```
2. Display in "Thang nay" comparison card: "Du kien cuoi thang: X VND"
3. If budget enabled: "Du kien vuot ngan sach X VND" in red if exceeding

### Step 6: Shop Loyalty Analysis (4h)
1. Create `src/dashboard/shop-loyalty.ts`:
   ```ts
   interface ShopLoyalty {
     shopName: string;
     orderCount: number;
     totalSpent: number;
     firstOrder: string; // ISO date
     lastOrder: string;
     avgOrderValue: number;
     repeatRate: number; // orders per month
   }
   ```
2. Display as collapsible section below charts
3. "Frequent shops" = shops with 3+ orders
4. "New shops this month" = first-time purchases
5. Clickable shop names → filter table

## Todo List
- [ ] Create heatmap data builder
- [ ] Create heatmap SVG renderer
- [ ] Add heatmap colors to CSS variables (light + dark)
- [ ] Add heatmap section to results.html
- [ ] Create category keyword rules
- [ ] Create categorization engine
- [ ] Create category chart renderer
- [ ] Add category filter to toolbar
- [ ] Extend applyFilters for category
- [ ] Write categorization tests
- [ ] Create budget config storage
- [ ] Create budget progress ring widget
- [ ] Create budget settings modal
- [ ] Create budget alerts (toast)
- [ ] Create insights generator
- [ ] Create insights display card
- [ ] Create spending prediction calculator
- [ ] Integrate prediction into comparison card
- [ ] Write prediction tests
- [ ] Create shop loyalty analyzer
- [ ] Create shop loyalty UI section
- [ ] Wire all new modules in results.ts
- [ ] Test all features in light + dark mode
- [ ] Bump version to 3.0.0

## Success Criteria
- Heatmap renders full year data, tooltips work, click filters table
- Categorization accuracy > 80% on typical Vietnamese Shopee orders
- Budget progress ring updates in real-time, alerts fire at threshold
- At least 3 relevant insights generated per session
- Prediction within reasonable margin of actual spending pattern
- All new features work in dark mode

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Category keywords miss many products | High | Medium | Manual override: user clicks category → picks from dropdown → saved to storage |
| Heatmap too wide on mobile | Medium | Low | Horizontal scroll + zoom gesture |
| Budget config lost on extension update | Low | Medium | chrome.storage.local persists across updates |
| Insights feel generic | Medium | Low | Use actual data points (specific shops, dates, amounts) |

## Security Considerations
- Budget config stored locally only (non-sensitive)
- No external API calls for categorization
- Category keywords contain no PII

## Next Steps
- Phase 4: Internationalization + date range picker
