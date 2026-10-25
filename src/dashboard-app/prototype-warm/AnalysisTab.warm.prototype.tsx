// PROTOTYPE — throwaway. Trả lời: Phân tích trông thế nào ở display-style "warm"?
// Giữ tinh thần Variant B (prototype/overview): một cột tường thuật văn xuôi, số serif,
// xếp hạng dạng thanh mảnh thay vì bảng — khác cấu trúc với AnalysisTab.tsx (grid thẻ) thật.
// Dùng lại đúng các hàm tính toán của fintech (generateInsights, analyzeShopLoyalty,
// buildHeatmapGrid, budget) — chỉ đổi cách trình bày, không đổi số liệu.
import { useMemo } from 'react';
import { generateInsights } from '../../dashboard/insights.js';
import { analyzeShopLoyalty } from '../../dashboard/shop-loyalty.js';
import { buildHeatmapGrid, heatmapWindow } from '../../dashboard/heatmap.js';
import { budgetProgress, currentMonthSpend, loadBudgetConfig, type BudgetConfig } from '../../dashboard/budget.js';
import { predictMonthEnd } from '../../dashboard/predictions.js';
import { computeStats, needsRescan } from '../../dashboard/stats.js';
import { formatDate } from '../../i18n/format.js';
import { NoOrdersInRange } from '../components/NoOrdersInRange';
import { useDashboard } from '../context';
import { money } from '../format';
import { useEffect, useState } from 'react';

const dayOf = (key: string) => (key ? formatDate(new Date(`${key}T00:00:00`)) : '—');

const FILL = ['var(--w-line)', 'color-mix(in srgb, var(--w-accent) 30%, var(--w-card))', 'color-mix(in srgb, var(--w-accent) 60%, var(--w-card))', 'var(--w-accent-strong)'];

export function AnalysisTabWarm() {
  const { data, orders, range, now } = useDashboard();
  const stats = useMemo(() => computeStats(orders), [orders]);
  const stale = needsRescan(data.orders);
  const insights = useMemo(() => generateInsights(data.orders, now), [data.orders, now]);
  const shops = useMemo(() => analyzeShopLoyalty(data.orders), [data.orders]);
  const grid = useMemo(() => {
    const { start, end } = heatmapWindow(range, now);
    return buildHeatmapGrid(data.orders, start, end);
  }, [data.orders, range, now]);

  const [config, setConfig] = useState<BudgetConfig | null>(null);
  useEffect(() => {
    let alive = true;
    void loadBudgetConfig().then(cfg => alive && setConfig(cfg));
    return () => { alive = false; };
  }, []);
  const spent = useMemo(() => currentMonthSpend(data.orders, now), [data.orders, now]);
  const prediction = useMemo(() => predictMonthEnd(data.orders, now), [data.orders, now]);
  const progress = config ? budgetProgress(spent, config, prediction) : null;

  const topShops = shops.slice(0, 5);
  const topShopMax = topShops[0]?.totalSpent ?? 1;

  if (orders.length === 0) return <NoOrdersInRange />;

  return (
    <div className="style-warm w-prose mx-auto grid gap-7 py-2 text-[15px]" style={{ color: 'var(--w-fg)' }}>
      <p>
        Trong khoảng đang xem, bạn mua nhiều nhất vào{' '}
        <b>{stats.busiestWeekday === null ? 'một ngày chưa rõ' : ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][stats.busiestWeekday]}</b>, thường vào lúc{' '}
        <b>{stats.busiestHour === null ? 'giờ chưa rõ' : `${stats.busiestHour}:00`}</b>. Chuỗi tháng liên tục dài nhất của bạn là{' '}
        <b className="w-num">{stats.longestMonthStreak ?? 0} tháng</b>, với nhịp chi tiêu trung bình{' '}
        <b className="w-num">{stats.dailySpendRate ? money(stats.dailySpendRate) : '—'}</b> mỗi ngày.
      </p>

      {insights.length > 0 && (
        <p>
          {insights.map(text => (
            <span key={text}>{text} </span>
          ))}
        </p>
      )}

      <section aria-label="Sản phẩm mua nhiều">
        <h2 className="mb-2 text-sm tracking-wide" style={{ color: 'var(--w-muted)' }}>Bạn mua nhiều gì nhất</h2>
        {stale ? (
          <p style={{ color: 'var(--w-muted)' }}>Cần quét lại để tính sản phẩm.</p>
        ) : (
          <ol className="grid gap-1.5">
            {stats.topByQuantity.slice(0, 5).map((p, i) => (
              <li key={p.name} className="flex items-baseline gap-2">
                <span className="w-num" style={{ color: 'var(--w-muted)' }}>{i + 1}.</span>
                <span className="flex-1 truncate">{p.name}</span>
                <span className="w-num">× {p.quantity}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-label="Shop thân thiết">
        <h2 className="mb-2 text-sm tracking-wide" style={{ color: 'var(--w-muted)' }}>Shop bạn quay lại nhiều nhất</h2>
        {topShops.length === 0 ? (
          <p style={{ color: 'var(--w-muted)' }}>Chưa có shop nào mua từ 3 đơn trở lên.</p>
        ) : (
          <ul className="grid gap-3">
            {topShops.map(s => (
              <li key={s.shopName}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="truncate">{s.shopName}</span>
                  <span className="w-num shrink-0">{money(s.totalSpent)}</span>
                </div>
                <div className="w-rank-track">
                  <div className="w-rank-fill" style={{ width: `${(s.totalSpent / topShopMax) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--w-muted)' }}>
                  {s.orderCount} đơn · lần gần nhất {dayOf(s.lastOrder)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Lịch mua hàng">
        <h2 className="mb-2 text-sm tracking-wide" style={{ color: 'var(--w-muted)' }}>Nhịp mua hàng 12 tháng qua</h2>
        <div className="overflow-x-auto rounded-lg pb-2">
          <svg role="img" width={grid.weeks.length * 11 + 8} height={7 * 11 + 4} className="block max-w-none">
            {grid.weeks.map((week, col) =>
              week.map((cell, row) =>
                cell && (
                  <rect key={cell.date} x={8 + col * 11} y={row * 11} width={8} height={8} rx={2} fill={FILL[Math.min(cell.intensity, 3)]}>
                    <title>{dayOf(cell.date)}: {cell.orderCount} đơn</title>
                  </rect>
                ),
              ),
            )}
          </svg>
        </div>
      </section>

      {config?.enabled && progress && (
        <section aria-label="Ngân sách tháng">
          <h2 className="mb-2 text-sm tracking-wide" style={{ color: 'var(--w-muted)' }}>Ngân sách tháng này</h2>
          <p>
            Bạn đã chi <b className="w-num">{money(spent)}</b> trên tổng <b className="w-num">{money(config.monthlyLimit)}</b> đặt ra
            {prediction > 0 && <> — dự báo cuối tháng khoảng <b className="w-num">{money(prediction)}</b></>}.
          </p>
          <div className="w-bar mt-2">
            <div style={{ width: `${Math.min(progress.percent, 100)}%`, background: 'var(--w-accent)' }} />
          </div>
        </section>
      )}
    </div>
  );
}
