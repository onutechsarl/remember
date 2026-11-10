import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { LastContactAnswer } from '@/domain/initial-estimate';
import type { Channel, FrequencyDays } from '@/domain/types';
import type { DeviceContact } from '@/services/contacts';
import { availableChannels, defaultChannel } from '@/services/messaging';

/** Fréquence par défaut : toutes les 2 semaines (US-05 CA2). */
export const DEFAULT_FREQUENCY: FrequencyDays = 14;
export const FREQUENCIES: readonly FrequencyDays[] = [7, 14, 30, 60, 90];

/** Réglages d'un contact pendant l'ajout ; `lastContactAnswer` vide = « Je ne sais pas » (US-06 CA4). */
export type ContactSetup = {
  frequencyDays: FrequencyDays;
  lastContactAnswer: LastContactAnswer | null;
  preferredChannel: Channel;
};

type AddFlow = {
  selected: DeviceContact[];
  setSelected: (contacts: DeviceContact[]) => void;
  /** Messageries installées (US-17 CA3). */
  channels: Channel[];
  setupOf: (deviceContactId: string) => ContactSetup;
  updateSetup: (deviceContactIds: string[], patch: Partial<ContactSetup>) => void;
};

const AddFlowContext = createContext<AddFlow | null>(null);

/** État partagé par les écrans de l'ajout : sélection, puis réglages de chaque contact. */
export function AddFlowProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<DeviceContact[]>([]);
  const [setups, setSetups] = useState<Record<string, ContactSetup>>({});
  const [channels, setChannels] = useState<Channel[]>(['sms', 'call']);

  useEffect(() => {
    availableChannels()
      .then(setChannels)
      .catch(() => undefined);
  }, []);

  const defaults: ContactSetup = {
    frequencyDays: DEFAULT_FREQUENCY,
    lastContactAnswer: null,
    preferredChannel: defaultChannel(channels),
  };

  const value: AddFlow = {
    selected,
    setSelected,
    channels,
    setupOf: (id) => ({ ...defaults, ...setups[id] }),
    updateSetup: (ids, patch) =>
      setSetups((current) => {
        const next = { ...current };
        for (const id of ids) next[id] = { ...defaults, ...current[id], ...patch };
        return next;
      }),
  };

  return <AddFlowContext.Provider value={value}>{children}</AddFlowContext.Provider>;
}

export function useAddFlow(): AddFlow {
  const flow = useContext(AddFlowContext);
  if (!flow) throw new Error('useAddFlow doit être utilisé dans AddFlowProvider');
  return flow;
}
