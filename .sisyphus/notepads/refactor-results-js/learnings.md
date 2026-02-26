# Learnings

## Source Analysis
- Original results.js is 1006 lines, all inside a single DOMContentLoaded closure
- State variables: lines 32-42 (allOrdersData, filteredOrders, monthlyChart, shopChart, currentSort, searchTimeout, currentPage, itemsPerPage, selectedDay, shopCount, shopMetric)
- DOM refs: lines 2-29
- Event listeners: lines 55-132
- Functions: lines 134-1004
- Currency: Shopee API returns amount * 100000, formatVND handles display
- results.html line 234: `<script src="results.js"></script>` — needs `type="module"`
- chart.min.js (line 9) and xlsx.min.js (line 10) are NOT modules — stay as regular scripts
