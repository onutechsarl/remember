import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import { useColors } from '@/theme/use-colors';
import { dateToTime, timeToDate } from '@/utils/time';

import { PickerCard } from './form';
import type { TimePickerProps } from './time-picker';

/** Roue des heures SwiftUI, centrée dans une carte. */
export function TimePicker({ value, onChange }: TimePickerProps) {
  const colors = useColors();
  return (
    <PickerCard>
      <Host matchContents style={styles.host}>
        <DatePicker
          selection={timeToDate(value)}
          displayedComponents={['hourAndMinute']}
          onDateChange={(date) => onChange(dateToTime(date))}
          modifiers={[datePickerStyle('wheel'), tint(colors.accent)]}
        />
      </Host>
    </PickerCard>
  );
}

const styles = StyleSheet.create({
  // Le conteneur prend la taille de la roue : la carte peut alors la centrer.
  host: { alignSelf: 'center' },
});
