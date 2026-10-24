import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '../i18n/index.js';
import type { OrderData } from '../types/index.js';
import type { DashboardHost } from './host';

/** No progress for this long: tell the user Shopee is slow. */
export const STALL_MS = 30_000;

export type Phase = 'loading' | 'empty' | 'error' | 'ready';

export interface OrderDataState {
  phase: Phase;
  /** Set once a load or scan has produced orders; kept while a background refresh runs. */
  data: OrderData | null;
  /** Orders fetched so far during a scan; null before the first progress report. */
  progress: number | null;
  stalled: boolean;
  /** A scan (not just a cache read) is behind the `loading` phase. */
  scanning: boolean;
  /** A scan is running while the previous data stays on screen. */
  refreshing: boolean;
  /** Outcome of the last background refresh. */
  notice: { kind: 'info' | 'error'; text: string } | null;
  /** Message of the failure behind the `error` phase. */
  error: string | null;
}

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Loads the orders (cache or scan) and exposes the loading / empty / error / ready states. */
export function useOrderData(host: DashboardHost): OrderDataState & { refresh: () => void } {
  const [state, setState] = useState<OrderDataState>({
    phase: 'loading', data: null, progress: null, stalled: false, scanning: host.scanOnOpen, refreshing: false, notice: null, error: null,
  });
  const busy = useRef(false);
  const dataRef = useRef<OrderData | null>(null);
  const stallTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const armStall = useCallback(() => {
    clearTimeout(stallTimer.current);
    stallTimer.current = setTimeout(() => setState(s => ({ ...s, stalled: true })), STALL_MS);
  }, []);

  const scan = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    // With data on screen a scan runs in the background; otherwise it replaces the screen with the skeleton.
    const background = dataRef.current !== null;
    setState(s => background
      ? { ...s, refreshing: true, notice: null, progress: null, stalled: false }
      : { ...s, phase: 'loading', scanning: true, error: null, progress: null, stalled: false });
    armStall();
    try {
      const { data, added } = await host.refresh(count => {
        setState(s => ({ ...s, progress: count, stalled: false }));
        armStall();
      });
      dataRef.current = data;
      setState(s => ({
        ...s,
        phase: data.orders.length > 0 ? 'ready' : 'empty',
        data,
        notice: background ? { kind: 'info', text: added > 0 ? t('dash.added', { n: added }) : t('dash.noneAdded') } : null,
      }));
    } catch (e) {
      setState(s => background
        ? { ...s, notice: { kind: 'error', text: t('dash.refreshError', { message: messageOf(e) }) } }
        : { ...s, phase: 'error', error: messageOf(e) });
    } finally {
      clearTimeout(stallTimer.current);
      busy.current = false;
      setState(s => ({ ...s, refreshing: false, scanning: false, progress: null, stalled: false }));
    }
  }, [host, armStall]);

  useEffect(() => {
    if (host.scanOnOpen) {
      void scan();
      return;
    }
    host.loadCached().then(
      data => {
        dataRef.current = data && data.orders.length > 0 ? data : null;
        setState(s => ({ ...s, phase: dataRef.current ? 'ready' : 'empty', data: dataRef.current }));
      },
      e => setState(s => ({ ...s, phase: 'error', error: messageOf(e) })),
    );
    return () => clearTimeout(stallTimer.current);
  }, [host, scan]);

  return { ...state, refresh: () => void scan() };
}
