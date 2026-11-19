import { SegmentedControl, SegmentedControlItem } from '@ui-sdk/react/segmented-control';
import { t } from '../../i18n/index.js';
import { isColorMode, type ColorMode } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';
import { segment, segments } from '../styles/classes';

const OPTIONS: ColorMode[] = ['light', 'dark'];

/** Light / Dark switch: a radio group with arrow-key roving focus. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  return (
    <SegmentedControl
      value={mode}
      onValueChange={(value) => isColorMode(value) && setMode(value)}
      aria-label={t('colorMode.label')}
      className={segments}
    >
      {OPTIONS.map((option) => (
        <SegmentedControlItem key={option} value={option} className={`${segment} transition-colors`}>
          {t(`colorMode.${option}`)}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
