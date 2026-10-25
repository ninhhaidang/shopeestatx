import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { t } from '../../i18n/index.js';
import { isDisplayStyle, type DisplayStyle } from '../theme/style';
import { useStyle } from '../theme/StyleProvider';

const OPTIONS: DisplayStyle[] = ['fintech', 'warm'];

/** Fintech / Warm switch, independent of ThemeToggle. Radix gives arrow-key roving focus and radio semantics. */
export function StyleToggle() {
  const { style, setStyle } = useStyle();
  return (
    <ToggleGroup.Root
      type="single"
      value={style}
      // Radix reports '' when the active item is clicked again; keep the current choice.
      onValueChange={(value) => isDisplayStyle(value) && setStyle(value)}
      aria-label={t('displayStyle.label')}
      className="inline-flex rounded-lg border border-line bg-card p-0.5"
    >
      {OPTIONS.map((option) => (
        <ToggleGroup.Item
          key={option}
          value={option}
          className="cursor-pointer rounded-md px-2.5 py-1 text-xs text-muted transition-colors hover:text-fg data-[state=on]:bg-bg data-[state=on]:font-semibold data-[state=on]:text-fg data-[state=on]:shadow-[0_0_0_1px_var(--line)]"
        >
          {t(`displayStyle.${option}`)}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
