import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import { startOfLocalDay } from '@/domain/dates';
import { useColors } from '@/theme/use-colors';

import type { DayPickerProps } from './day-picker';
import { PickerCard } from './form';

/** Calendrier SwiftUI (style graphique), dans une carte. */
export function DayPicker({ value, min, max, onChange }: DayPickerProps) {
  const colors = useColors();
  return (
    <PickerCard>
      <Host matchContents={{ vertical: true }} style={styles.host}>
        <DatePicker
          selection={value}
          range={{ start: min, end: max }}
          displayedComponents={['date']}
          onDateChange={(date) => onChange(startOfLocalDay(date))}
          modifiers={[datePickerStyle('graphical'), tint(colors.accent)]}
        />
      </Host>
    </PickerCard>
  );
}

const styles = StyleSheet.create({
  host: { alignSelf: 'stretch', marginHorizontal: 8 },
});
