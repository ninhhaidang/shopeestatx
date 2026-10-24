// jsdom has no matchMedia. Install a controllable one for prefers-color-scheme.
type Listener = (event: { matches: boolean }) => void;

export function mockColorScheme(initial: 'light' | 'dark') {
  let dark = initial === 'dark';
  const listeners = new Set<Listener>();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes('prefers-color-scheme: dark') ? dark : false;
    },
    media: query,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  })) as unknown as typeof window.matchMedia;
  return {
    /** Simulate the OS switching its colour scheme. */
    set(scheme: 'light' | 'dark') {
      dark = scheme === 'dark';
      listeners.forEach((l) => l({ matches: dark }));
    },
  };
}
