/**
 * Choix d'une heure locale « HH:MM » (heure des rappels et du bilan, US-15).
 * Implémentations natives : time-picker.ios.tsx (SwiftUI) et time-picker.android.tsx (Material 3).
 */
export type TimePickerProps = {
  /** Heure « HH:MM ». */
  value: string;
  onChange: (time: string) => void;
};

export function TimePicker(_props: TimePickerProps) {
  return null;
}

// N'exporter ici que des types : sur iOS et Android, « ./time-picker » se résout vers le fichier
// de la plateforme, qui n'a pas les fonctions de ce fichier (voir @/utils/time).
