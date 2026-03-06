# Phase 2: Migrate export.ts code

## Context
- Plan: [260306-2004-exceljs-migration/plan.md](../plan.md)
- File to modify: `src/dashboard/export.ts`

## Overview
| Item | Value |
|------|-------|
| Priority | High |
| Status | ⏳ Pending |

## Requirements
- Replace xlsx import with exceljs
- Rewrite `exportToExcel()` function to use ExcelJS API

## Implementation Steps

### 2.1 Update import
```typescript
// Before
import * as XLSX from 'xlsx';

// After
import ExcelJS from 'exceljs';
```

### 2.2 Rewrite exportToExcel function
```typescript
export function exportToExcel(): void {
  const filtered = getExportOrders();

  if (filtered.length === 0) {
    alert(t('export.noData') || 'No data to export');
    return;
  }

  const data = filtered.map((order, index) => ({
    [t('export.col.index')]: index + 1,
    [t('export.col.orderId')]: order.orderId,
    [t('export.col.date')]: order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : t('table.noDate'),
    [t('export.col.status')]: order.status,
    [t('export.col.product')]: order.name,
    [t('export.col.quantity')]: order.productCount,
    [t('export.col.total')]: order.subTotal,
    'Seller': order.shopName,
    'Details': order.productSummary,
  }));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Shopee Orders');

  // Add headers
  const headers = Object.keys(data[0] || {});
  headers.forEach((header, colIndex) => {
    worksheet.getCell(1, colIndex + 1).value = header;
  });

  // Add data rows
  data.forEach((row, rowIndex) => {
    const values = Object.values(row);
    values.forEach((value, colIndex) => {
      worksheet.getCell(rowIndex + 2, colIndex + 1).value = value;
    });
  });

  // Download via buffer with error handling
  workbook.xlsx.writeBuffer()
    .then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shopee-stats-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error('Export failed:', err);
      alert('Failed to export Excel. Please try again.');
    });
}
```

## Verification
- [x] Import changed to ExcelJS
- [x] Function uses `writeBuffer()` + Blob pattern
- [x] Error handling added (empty data check + catch)
- [x] No TypeScript errors
- [x] CSV and PDF exports still work
