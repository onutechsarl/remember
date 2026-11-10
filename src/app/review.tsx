import { router } from 'expo-router';
import { Check, Flame, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { GlassIconButton, PrimaryButton } from '@/components/buttons';
import { ContactRow } from '@/components/contact-row';
import { Memo } from '@/components/memo';
import { SwipeCard, type SwipeCardHandle, type SwipeDirection } from '@/components/swipe-card';
import { WeekDots } from '@/components/week-dots';
import { getDatabase } from '@/db/database';
import {
  listActiveContacts,
  listFiredReminderDates,
  listInteractions,
  recordInteraction,
  updateSettings,
} from '@/db/repository';
import { addDays, daysBetween, startOfLocalWeek } from '@/domain/dates';
import { streakWeeks, weekDayStates, type DayState } from '@/domain/streak';
import type { TrackedContact } from '@/domain/types';
import { sortByUrgency, urgency } from '@/domain/urgency';
import { reviewCandidates, reviewSummary, type ReviewAnswer } from '@/domain/weekly-review';
import { agoText } from '@/services/notification-content';
import { noteInteraction, replan } from '@/services/planning';
import { RADIUS } from '@/theme/radius';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

type Summary = {
  now: Date;
  upToDate: number;
  toContact: TrackedContact[];
  streak: number;
  week: DayState[];
};

type State =
  | { step: 'loading' }
  | { step: 'cards'; cards: TrackedContact[]; index: number; answers: Map<string, ReviewAnswer> }
  | { step: 'summary'; summary: Summary };

/** Récapitulatif de fin de bilan (US-14 CA5) avec la série de semaines de lien (US-19). */
async function buildSummary(reviewed: TrackedContact[], answers: Map<string, ReviewAnswer>): Promise<Summary> {
  const db = await getDatabase();
  const now = new Date();
  const ids = new Set(reviewed.map((c) => c.id));
  const current = (await listActiveContacts(db)).filter((c) => ids.has(c.id));
  const interactions = await listInteractions(db, { since: addDays(now, -366) });
  const fired = await listFiredReminderDates(db, startOfLocalWeek(now), now);
  return {
    now,
    upToDate: reviewSummary(reviewed, answers, now).upToDate,
    toContact: sortByUrgency(
      current.filter((c) => urgency(c, now) >= 1),
      now,
    ),
    streak: streakWeeks(interactions, now),
    week: weekDayStates(interactions, fired, now),
  };
}

/** Fin du bilan : il est noté comme fait (le bouton de l'accueil disparaît), puis les rappels sont replanifiés. */
async function completeReview(cards: TrackedContact[], answers: Map<string, ReviewAnswer>): Promise<Summary> {
  const db = await getDatabase();
  const now = new Date();
  await updateSettings(db, { lastWeeklyReviewAt: now });
  await replan(db, now);
  return buildSummary(cards, answers);
}

/** Bilan de la semaine (écran 5, US-14). */
export default function WeeklyReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>({ step: 'loading' });
  const recorded = useRef(false);

  useEffect(() => {
    getDatabase()
      .then(listActiveContacts)
      .then(async (contacts) => {
        const cards = reviewCandidates(contacts, new Date());
        if (cards.length > 0) setState({ step: 'cards', cards, index: 0, answers: new Map() });
        else setState({ step: 'summary', summary: await completeReview([], new Map()) });
      })
      .catch((error: unknown) => console.error('Bilan : chargement impossible', error));
  }, []);

  const answer = (direction: SwipeDirection) => {
    if (state.step !== 'cards') return;
    const contact = state.cards[state.index];
    const value: ReviewAnswer = direction === 'right' ? 'talked' : 'not_yet';
    const answers = new Map(state.answers).set(contact.id, value);
    // « On s'est parlé » note l'échange aujourd'hui ; « Non » ne change rien (US-14 CA4).
    const saved =
      value === 'talked'
        ? getDatabase().then((db) =>
            recordInteraction(db, { contactId: contact.id, occurredAt: new Date(), source: 'weekly_review' }, new Date()),
          )
        : Promise.resolve();
    if (value === 'talked') recorded.current = true;
    const next = state.index + 1;
    if (next < state.cards.length) {
      setState({ ...state, index: next, answers });
      void saved.catch((error: unknown) => console.error('Bilan : échange non enregistré', error));
    } else {
      setState({ step: 'loading' });
      void saved
        .then(() => completeReview(state.cards, answers))
        .then((summary) => setState({ step: 'summary', summary }))
        .catch((error: unknown) => console.error('Bilan : fin', error));
    }
  };

  /** Le bilan peut être interrompu à tout moment (US-14 CA5) ; les réponses données sont gardées. */
  const close = () => {
    if (state.step === 'cards' && recorded.current) void getDatabase().then((db) => replan(db));
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      {state.step === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      {state.step === 'cards' && <CardsStep {...state} onAnswer={answer} onClose={close} />}
      {state.step === 'summary' && <SummaryStep summary={state.summary} onClose={close} />}
    </View>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return <GlassIconButton icon={X} onPress={onPress} accessibilityLabel={t('review.close')} />;
}

function CardsStep({
  cards,
  index,
  onAnswer,
  onClose,
}: {
  cards: TrackedContact[];
  index: number;
  onAnswer: (direction: SwipeDirection) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const card = useRef<SwipeCardHandle>(null);
  const contact = cards[index];
  const days = daysBetween(contact.lastContactAt, new Date());

  return (
    <>
      <View style={styles.bar}>
        <CloseButton onPress={onClose} />
        <Text style={[Type.name, styles.barTitle, { color: colors.text }]} accessibilityRole="header">
          {t('review.title')}
        </Text>
        <Text style={[Type.body, styles.counter, { color: colors.textSecondary }]}>
          {t('review.progress', { current: index + 1, total: cards.length })}
        </Text>
      </View>
      <View style={styles.progress}>
        {cards.map((c, i) => (
          <View key={c.id} style={[styles.segment, { backgroundColor: i <= index ? colors.accent : colors.fill }]} />
        ))}
      </View>

      <View style={styles.deck}>
        {index + 1 < cards.length && <View style={[styles.peek, { backgroundColor: colors.fill }]} />}
        <SwipeCard
          key={contact.id}
          ref={card}
          onSwiped={onAnswer}
          renderOverlay={(direction) => (
            <View style={[styles.stamp, direction === 'right' ? styles.stampRight : styles.stampLeft]}>
              <Text
                style={[
                  Type.name,
                  styles.stampText,
                  {
                    color: direction === 'right' ? colors.accent : colors.textSecondary,
                    borderColor: direction === 'right' ? colors.accent : colors.textSecondary,
                  },
                ]}>
                {t(direction === 'right' ? 'review.yes' : 'review.no')}
              </Text>
            </View>
          )}>
          <View
            style={[styles.card, { backgroundColor: colors.surface }]}
            accessible
            accessibilityLabel={`${contact.displayName}. ${t('review.question')}`}
            accessibilityHint={t('review.swipeHint')}
            accessibilityActions={[
              { name: 'talked', label: t('review.yes') },
              { name: 'no', label: t('review.no') },
            ]}
            onAccessibilityAction={(e) => card.current?.fling(e.nativeEvent.actionName === 'talked' ? 'right' : 'left')}>
            <Avatar id={contact.id} name={contact.displayName} size={108} />
            <Text style={[Type.largeTitle, styles.cardName, { color: colors.text }]} numberOfLines={2}>
              {contact.displayName}
            </Text>
            <Text style={[Type.body, { color: colors.textSecondary }]}>
              {t('review.lastContact', { ago: agoText(days, t) })}
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
            <Text style={[Type.sectionTitle, styles.question, { color: colors.text }]}>{t('review.question')}</Text>
          </View>
        </SwipeCard>
      </View>

      <View style={[styles.buttons, { paddingBottom: insets.bottom + 24 }]}>
        <AnswerButton icon="no" label={t('review.no')} onPress={() => card.current?.fling('left')} />
        <AnswerButton icon="yes" label={t('review.yes')} onPress={() => card.current?.fling('right')} />
      </View>
    </>
  );
}

function AnswerButton({ icon, label, onPress }: { icon: 'yes' | 'no'; label: string; onPress: () => void }) {
  const colors = useColors();
  const Icon = icon === 'yes' ? Check : X;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.answer}>
      {({ pressed }) => (
        <>
          <View
            style={[
              styles.answerCircle,
              {
                backgroundColor: colors.accent,
                boxShadow: `0 8px 20px ${colors.accent}55`,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}>
            <Icon color={colors.onAccent} size={34} strokeWidth={3} />
          </View>
          <Text style={[Type.name, { color: colors.text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function SummaryStep({ summary, onClose }: { summary: Summary; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [toContact, setToContact] = useState(summary.toContact);
  const reviewedNothing = summary.upToDate + summary.toContact.length === 0;

  const markDone = async (contactId: string) => {
    await noteInteraction(await getDatabase(), { contactId, source: 'app_action' });
    setToContact((list) => list.filter((c) => c.id !== contactId));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bar}>
        <CloseButton onPress={onClose} />
      </View>
      <ScrollView contentContainerStyle={styles.summary}>
        <View style={styles.memo}>
          <Memo mood={reviewedNothing ? 'happy' : 'party'} size={140} />
        </View>
        <Text style={[Type.largeTitle, styles.centerText, { color: colors.text }]} accessibilityRole="header">
          {t(reviewedNothing ? 'review.emptyTitle' : 'review.doneTitle')}
        </Text>
        <Text style={[Type.body, styles.centerText, { color: colors.textSecondary }]}>
          {t(reviewedNothing ? 'review.emptyBody' : 'review.doneBody')}
        </Text>

        {!reviewedNothing && (
          <View style={styles.tiles}>
            <Tile value={summary.upToDate} label={t('review.upToDate', { count: summary.upToDate })} />
            <Tile value={toContact.length} label={t('review.toContact')} />
          </View>
        )}

        <View style={[styles.streak, { backgroundColor: colors.fill }]}>
          <View style={styles.streakTitle}>
            <Flame color={colors.accent} fill={colors.accent} size={22} />
            <Text style={[Type.sectionTitle, { color: colors.text }]}>{t('widget.streak', { count: summary.streak })}</Text>
          </View>
          <WeekDots week={summary.week} today={summary.now} language={i18n.language} emptyColor={colors.surface} />
        </View>

        {toContact.length > 0 && (
          <>
            <Text style={[Type.sectionTitle, styles.listTitle, { color: colors.text }]} accessibilityRole="header">
              {t('home.due')}
              <Text style={[Type.secondary, { color: colors.textSecondary }]}>{`  ${toContact.length}`}</Text>
            </Text>
            <View style={styles.list}>
              {toContact.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  now={summary.now}
                  onPress={() => router.push({ pathname: '/contact/[id]', params: { id: c.id } })}
                  onMarkDone={() => void markDone(c.id)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton block label={t('review.finish')} onPress={onClose} />
      </View>
    </View>
  );
}

function Tile({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.tile, { backgroundColor: colors.fill }]}>
      <Text style={[Type.largeTitle, { color: colors.text }]}>{value}</Text>
      <Text style={[Type.secondary, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, minHeight: 44 },
  barTitle: { flex: 1, textAlign: 'center' },
  counter: { minWidth: 40, textAlign: 'right' },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingTop: 16 },
  segment: { flex: 1, height: 5, borderRadius: 3 },
  deck: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  peek: { position: 'absolute', left: 44, right: 44, height: 60, bottom: '12%', borderRadius: RADIUS.largeCard },
  card: {
    alignItems: 'center',
    borderRadius: RADIUS.largeCard,
    borderCurve: 'continuous',
    paddingHorizontal: 24,
    paddingVertical: 36,
    gap: 8,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.10)',
  },
  cardName: { fontSize: 30, textAlign: 'center', marginTop: 12 },
  divider: { alignSelf: 'stretch', height: StyleSheet.hairlineWidth, marginVertical: 20, marginHorizontal: 24 },
  question: { fontSize: 24, textAlign: 'center' },
  stamp: { position: 'absolute', top: 24 },
  stampRight: { left: 24, transform: [{ rotate: '-12deg' }] },
  stampLeft: { right: 24, transform: [{ rotate: '12deg' }] },
  stampText: { borderWidth: 2.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, fontSize: 18 },
  buttons: { flexDirection: 'row', justifyContent: 'space-evenly', paddingTop: 24 },
  answer: { alignItems: 'center', gap: 10, minWidth: 120 },
  answerCircle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  summary: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  memo: { alignItems: 'center', marginTop: 4 },
  centerText: { textAlign: 'center' },
  tiles: { flexDirection: 'row', gap: 12, marginTop: 20 },
  tile: { flex: 1, borderRadius: RADIUS.card, borderCurve: 'continuous', padding: 18, gap: 4 },
  streak: { borderRadius: RADIUS.card, borderCurve: 'continuous', padding: 18, gap: 16, marginTop: 12 },
  streakTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listTitle: { marginTop: 20 },
  list: { marginHorizontal: -20 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
});
