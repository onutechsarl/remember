/**
 * Choix d'un jour, au plus tard `max` (correction du dernier échange, US-07 CA2).
 * Implémentations natives : day-picker.ios.tsx (SwiftUI) et day-picker.android.tsx (Material 3).
 * Ce fichier ne sert qu'aux plateformes non prises en charge (web).
 */
export type DayPickerProps = {
  value: Date;
  max: Date;
  /** Jour choisi, en date locale (minuit). */
  onChange: (day: Date) => void;
};

export function DayPicker(_props: DayPickerProps) {
  return null;
}
