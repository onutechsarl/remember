import { Host, Toggle as SwiftUIToggle } from '@expo/ui/swift-ui';
import { labelsHidden, tint } from '@expo/ui/swift-ui/modifiers';

import { useColors } from '@/theme/use-colors';

import type { ToggleProps } from './toggle';

/** Interrupteur SwiftUI : taille et position justes sur iOS 26. */
export function Toggle({ value, onValueChange, accessibilityLabel }: ToggleProps) {
  const colors = useColors();
  return (
    <Host matchContents>
      <SwiftUIToggle
        isOn={value}
        onIsOnChange={onValueChange}
        label={accessibilityLabel}
        modifiers={[labelsHidden(), tint(colors.accent)]}
      />
    </Host>
  );
}
