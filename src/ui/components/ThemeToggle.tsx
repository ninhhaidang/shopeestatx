import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { t } from '../../i18n/index.js';
import { isColorMode, type ColorMode } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';

const OPTIONS: ColorMode[] = ['auto', 'light', 'dark'];

/** Light / Dark / Auto switch. Radix gives arrow-key roving focus and radio semantics. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  return (
    <ToggleGroup.Root
      type="single"
      value={mode}
      // Radix reports '' when the active item is clicked again; keep the current choice.
      onValueChange={(value) => isColorMode(value) && setMode(value)}
      aria-label={t('colorMode.label')}
      className="inline-flex rounded-lg border border-line bg-card p-0.5"
    >
      {OPTIONS.map((option) => (
        <ToggleGroup.Item
          key={option}
          value={option}
          className="cursor-pointer rounded-md px-2.5 py-1 text-xs text-muted transition-colors hover:text-fg data-[state=on]:bg-bg data-[state=on]:font-semibold data-[state=on]:text-fg data-[state=on]:shadow-[0_0_0_1px_var(--line)]"
        >
          {t(`colorMode.${option}`)}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
