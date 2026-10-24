import { StateMessage } from '../../ui/components/StateMessage';

/** Empty screen for a tab whose content has not been built yet. Replace it in `tabs.tsx`. */
export function PlaceholderTab({ title, message }: { title: string; message: string }) {
  return <StateMessage title={title} message={message} />;
}
