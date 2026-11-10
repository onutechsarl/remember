import { createContext, useContext } from 'react';

/**
 * Fin du premier lancement : enregistre `onboarding_completed` et débloque le reste de l'app
 * (routes protégées du layout racine). Fourni par le layout racine.
 */
export const OnboardingContext = createContext<{
  completeOnboarding: () => Promise<void>;
  /** Développement : revoir le premier lancement. */
  restartOnboarding: () => Promise<void>;
}>({
  completeOnboarding: async () => undefined,
  restartOnboarding: async () => undefined,
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}
