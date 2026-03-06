# ExcelJS Research Report - Client-Side Browser Usage

**Date:** 2026-03-06
**Role:** researcher

---

## 1. Installation

```bash
npm install exceljs
```

**Note:** ExcelJS provides TypeScript types out of the box.

---

## 2. Browser Usage - Basic API

### Creating Workbook & Worksheets

```typescript
import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Shopee Orders');

// Set column headers
worksheet.getCell('A1').value = 'Index';
worksheet.getCell('B1').value = 'Order ID';
// ... more headers

// Add data row by row
filtered.forEach((order, index) => {
  const row = worksheet.addRow([
    index + 1,
    order.orderId,
    order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : '',
    order.status,
    order.name,
    order.productCount,
    order.subTotal,
    order.shopName,
  ]);
});
```

### Writing/Downloading File

```typescript
// Option 1: Write to buffer then download
const buffer = await workbook.xlsx.writeBuffer();
const blob = new Blob([buffer], {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `shopee-stats-${new Date().toISOString().split('T')[0]}.xlsx`;
a.click();
URL.revokeObjectURL(url);

// Option 2: Write to file (Node.js only, NOT for browser)
await workbook.xlsx.writeFile('output.xlsx');  // Don't use in browser!
```

---

## 3. Key Differences from xlsx

| Aspect | ExcelJS | xlsx (current) |
|--------|---------|----------------|
| **API Style** | Object-oriented, chainable | Functional/utils-based |
| **Writing** | `workbook.xlsx.writeBuffer()` | `XLSX.writeFile(wb, filename)` |
| **Creating sheet** | `workbook.addWorksheet()` | `XLSX.utils.book_new()` |
| **Adding data** | `worksheet.addRow()` or cell-by-cell | `XLSX.utils.json_to_sheet()` or `aoa_to_sheet()` |
| **Styling** | Rich support (fonts, colors, borders) | Limited |
| **Bundle size** | ~500KB (larger) | ~300KB (smaller) |
| **TypeScript** | Built-in types | Requires `@types/xlsx` |
| **Browser write** | Use `writeBuffer()` + Blob | `XLSX.writeFile()` works in browser |

---

## 4. Vite/TypeScript Compatibility

✅ **Works with Vite/TypeScript** - ExcelJS has:
- Native ESM build
- Built-in TypeScript declarations
- No special config needed

```typescript
// Just works
import ExcelJS from 'exceljs';
```

---

## 5. Known Limitations & Caveats

### Browser-Specific
- ❌ `writeFile()` does NOT work in browser (Node.js only)
- ✅ Must use `writeBuffer()` + manual Blob download

### Polyfills (older environments)
- For ES5/IE11: Need `core-js` polyfills (Promise, String.includes, Object.assign, etc.)
- Modern browsers: No polyfills needed

### Streaming
- Streaming API (`read/write`) available but primarily for Node.js
- Browser streaming limited

### Performance
- Slower than xlsx for large datasets
- Better for styled reports with <10k rows

---

## 6. Migration from xlsx

**Current xlsx code:**
```typescript
const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Shopee Orders');
XLSX.writeFile(wb, 'output.xlsx');
```

**Equivalent ExcelJS:**
```typescript
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Shopee Orders');

// ExcelJS: Add rows from array of arrays
data.forEach(row => worksheet.addRow(row));

// Browser download
const buffer = await workbook.xlsx.writeBuffer();
// ... download logic
```

---

## 7. Recommendation

| Use Case | Recommendation |
|----------|----------------|
| Simple data export | Keep **xlsx** (smaller, faster) |
| Need styling/formulas | Switch to **ExcelJS** |
| Large files | Keep **xlsx** |
| Rich Excel features | **ExcelJS** |

**Current project:** Since the existing export is simple data-only with no styling needs, **xlsx is sufficient**. ExcelJS would add ~200KB bundle overhead without clear benefit.

---

## Sources
- [exceljs npm](https://www.npmjs.com/package/exceljs)
- [exceljs GitHub](https://github.com/exceljs/exceljs)

---

## Unresolved Questions
- None - research complete
