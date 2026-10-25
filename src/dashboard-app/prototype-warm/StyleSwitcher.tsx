// PROTOTYPE — throwaway. Floating switcher bar theo quy ước prototype UI: mũi tên trái/phải,
// nhãn variant hiện tại, phím mũi tên, cập nhật ?style= trên URL (reload-stable, shareable).
import { useEffect } from 'react';

const STYLES = [
  { key: 'fintech', label: 'Fintech (hiện tại)' },
  { key: 'warm', label: 'Warm (prototype)' },
] as const;
export type StyleKey = (typeof STYLES)[number]['key'];

export function readStyleFromUrl(): StyleKey {
  const v = new URLSearchParams(window.location.search).get('style');
  return v === 'warm' ? 'warm' : 'fintech';
}

function writeStyleToUrl(style: StyleKey) {
  const url = new URL(window.location.href);
  url.searchParams.set('style', style);
  window.history.replaceState(null, '', url);
}

export function StyleSwitcher({ style, onChange }: { style: StyleKey; onChange: (s: StyleKey) => void }) {
  const index = STYLES.findIndex(s => s.key === style);
  const cycle = (dir: 1 | -1) => {
    const next = STYLES[(index + dir + STYLES.length) % STYLES.length];
    onChange(next.key);
    writeStyleToUrl(next.key);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el?.getAttribute('contenteditable') === 'true') return;
      if (e.key === 'ArrowLeft') cycle(-1);
      if (e.key === 'ArrowRight') cycle(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);

  const current = STYLES[index];
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#111',
        color: '#fff',
        borderRadius: '999px',
        padding: '0.5rem 1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        zIndex: 9999,
      }}
    >
      <button type="button" onClick={() => cycle(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>←</button>
      <span>{current.key} ({current.label})</span>
      <button type="button" onClick={() => cycle(1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>→</button>
    </div>
  );
}
