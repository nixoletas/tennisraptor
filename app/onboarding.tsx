import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, FlatList, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, Spacing, Radius, Font,
  HAND_LABELS, PLAY_STYLE_LABELS,
} from '../constants/theme';
import { PROS } from '../constants/pros';
import {
  DominantHand, PlayStyle, Profile,
} from '../constants/types';
import { useProfileStore } from '../stores/useProfileStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

type StepId = 'identity' | 'physique' | 'game' | 'region' | 'pro';
const STEPS: StepId[] = ['identity', 'physique', 'game', 'region', 'pro'];

interface Draft {
  handle?: string;
  birthDate?: string;
  weightKg?: number;
  heightCm?: number;
  dominantHand?: DominantHand;
  playStyle?: PlayStyle;
  regionState?: string;
  regionCity?: string;
  similarProId?: string;
}

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

function isValidBirthDate(s?: string): boolean {
  if (!s) return false;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const [_, y, mo, d] = m;
  const dt = new Date(`${y}-${mo}-${d}T00:00:00Z`);
  if (isNaN(dt.getTime())) return false;
  const year = parseInt(y, 10);
  return year >= 1920 && year <= new Date().getFullYear() - 5;
}

export default function OnboardingScreen() {
  const { session } = useAuth();
  const me = useProfileStore(s => s.me);
  const completeOnboarding = useProfileStore(s => s.completeOnboarding);
  const setupMe = usePlayerStore(s => s.setupMe);

  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [handleErr, setHandleErr] = useState<string | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [draft, setDraft] = useState<Draft>({});

  const step = STEPS[stepIdx];
  const progress = (stepIdx + 1) / STEPS.length;
  const isLast = stepIdx === STEPS.length - 1;

  const canAdvance = useMemo(() => {
    switch (step) {
      case 'identity':
        return !!draft.handle && HANDLE_RE.test(draft.handle) && isValidBirthDate(draft.birthDate);
      case 'physique':
        return !!draft.weightKg && !!draft.heightCm;
      case 'game':
        return !!draft.dominantHand && !!draft.playStyle;
      case 'region':
        return !!draft.regionState && !!draft.regionCity?.trim();
      case 'pro':
        return !!draft.similarProId;
    }
  }, [step, draft]);

  const checkHandleAvailable = async (handle: string): Promise<boolean> => {
    setCheckingHandle(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('handle', handle)
      .neq('id', session!.user.id)
      .limit(1);
    setCheckingHandle(false);
    if (error) {
      console.error('[onboarding] check handle', error);
      return true; // não bloqueia se checagem falhar
    }
    return (data?.length ?? 0) === 0;
  };

  const handleNext = async () => {
    if (!canAdvance) return;

    if (step === 'identity') {
      const available = await checkHandleAvailable(draft.handle!);
      if (!available) {
        setHandleErr('Esse @ já está em uso.');
        return;
      }
    }

    if (!isLast) {
      setStepIdx(i => i + 1);
      return;
    }

    if (!session || !me) return;
    setSaving(true);
    const patch: Partial<Profile> = {
      handle: draft.handle,
      birthDate: draft.birthDate,
      weightKg: draft.weightKg,
      heightCm: draft.heightCm,
      dominantHand: draft.dominantHand,
      playStyle: draft.playStyle,
      regionState: draft.regionState,
      regionCity: draft.regionCity?.trim(),
      similarProId: draft.similarProId,
    };
    const updated = await completeOnboarding(patch);
    if (updated) {
      await setupMe(session.user.id, updated.name, updated.handle);
    }
    setSaving(false);
    if (updated) router.replace('/(tabs)');
  };

  const handleBack = () => {
    if (stepIdx === 0) return;
    setStepIdx(i => i - 1);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#1A2400', Colors.bg, Colors.bg]} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backBtn, stepIdx === 0 && styles.backBtnHidden]}
            disabled={stepIdx === 0}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.stepCount}>{stepIdx + 1} de {STEPS.length}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {step === 'identity' && (
              <IdentityStep
                draft={draft}
                setDraft={setDraft}
                handleErr={handleErr}
                clearErr={() => setHandleErr(null)}
                checking={checkingHandle}
              />
            )}
            {step === 'physique' && <PhysiqueStep draft={draft} setDraft={setDraft} />}
            {step === 'game' && <GameStep draft={draft} setDraft={setDraft} />}
            {step === 'region' && <RegionStep draft={draft} setDraft={setDraft} />}
            {step === 'pro' && <ProStep draft={draft} setDraft={setDraft} />}
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, (!canAdvance || saving || checkingHandle) && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canAdvance || saving || checkingHandle}
          >
            {saving || checkingHandle ? (
              <ActivityIndicator color={Colors.bg} />
            ) : (
              <>
                <Text style={styles.nextBtnText}>{isLast ? 'CONCLUIR' : 'PRÓXIMO'}</Text>
                <Ionicons
                  name={isLast ? 'checkmark' : 'arrow-forward'}
                  size={18}
                  color={Colors.bg}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

// ============== Steps ==============

function StepHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>{title}</Text>
      {sub && <Text style={styles.stepSub}>{sub}</Text>}
    </View>
  );
}

function IdentityStep({
  draft, setDraft, handleErr, clearErr, checking,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  handleErr: string | null;
  clearErr: () => void;
  checking: boolean;
}) {
  const handleValid = draft.handle ? HANDLE_RE.test(draft.handle) : null;
  const dateValid = draft.birthDate ? isValidBirthDate(draft.birthDate) : null;

  return (
    <>
      <StepHeader
        title="Sua identidade"
        sub="@ pra ser mencionado em comentários, e nascimento pra estatísticas por idade."
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>@ Handle</Text>
        <View style={styles.handleWrap}>
          <Text style={styles.handlePrefix}>@</Text>
          <TextInput
            style={[styles.input, styles.handleInput]}
            placeholder="seu_user"
            placeholderTextColor={Colors.textTertiary}
            value={draft.handle ?? ''}
            onChangeText={t => {
              clearErr();
              setDraft(d => ({ ...d, handle: t.toLowerCase().replace(/[^a-z0-9_]/g, '') }));
            }}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </View>
        {handleErr ? (
          <Text style={styles.errorText}>{handleErr}</Text>
        ) : handleValid === false ? (
          <Text style={styles.hintText}>3-20 chars, letras/números/underscore.</Text>
        ) : checking ? (
          <Text style={styles.hintText}>Verificando…</Text>
        ) : (
          <Text style={styles.hintText}>Único na plataforma.</Text>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Data de nascimento</Text>
        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={Colors.textTertiary}
          value={draft.birthDate ?? ''}
          onChangeText={t => setDraft(d => ({ ...d, birthDate: t }))}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        {draft.birthDate && dateValid === false && (
          <Text style={styles.errorText}>Formato AAAA-MM-DD. Idade mínima: 5 anos.</Text>
        )}
      </View>
    </>
  );
}

function PhysiqueStep({
  draft, setDraft,
}: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  return (
    <>
      <StepHeader title="Físico" sub="Pra comparar com adversários e pros." />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Peso (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="ex: 75"
          placeholderTextColor={Colors.textTertiary}
          value={draft.weightKg?.toString() ?? ''}
          onChangeText={t => {
            const n = parseInt(t.replace(/\D/g, ''), 10);
            setDraft(d => ({ ...d, weightKg: isNaN(n) ? undefined : n }));
          }}
          maxLength={3}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Altura (cm)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="ex: 180"
          placeholderTextColor={Colors.textTertiary}
          value={draft.heightCm?.toString() ?? ''}
          onChangeText={t => {
            const n = parseInt(t.replace(/\D/g, ''), 10);
            setDraft(d => ({ ...d, heightCm: isNaN(n) ? undefined : n }));
          }}
          maxLength={3}
        />
      </View>
    </>
  );
}

function GameStep({
  draft, setDraft,
}: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const hands: DominantHand[] = ['right', 'left'];
  const styles_: { v: PlayStyle; sub: string }[] = [
    { v: 'serve_volley', sub: 'Saca e sobe à rede' },
    { v: 'offensive',    sub: 'Bate forte da fundação' },
    { v: 'all_court',    sub: 'Versátil, joga tudo' },
    { v: 'defensive',    sub: 'Devolve tudo, espera o erro' },
  ];

  return (
    <>
      <StepHeader title="Seu jogo" />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Mão dominante</Text>
        <View style={styles.handRow}>
          {hands.map(h => {
            const sel = draft.dominantHand === h;
            return (
              <TouchableOpacity
                key={h}
                style={[styles.handBtn, sel && styles.handBtnActive]}
                onPress={() => setDraft(d => ({ ...d, dominantHand: h }))}
              >
                <Ionicons
                  name={h === 'left' ? 'hand-left' : 'hand-right'}
                  size={28}
                  color={sel ? Colors.bg : Colors.text}
                />
                <Text style={[styles.handLabel, sel && styles.handLabelActive]}>
                  {HAND_LABELS[h]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Estilo de jogo</Text>
        <View style={styles.optionList}>
          {styles_.map(o => {
            const sel = draft.playStyle === o.v;
            return (
              <TouchableOpacity
                key={o.v}
                style={[styles.option, sel && styles.optionActive]}
                onPress={() => setDraft(d => ({ ...d, playStyle: o.v }))}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, sel && styles.optionLabelActive]}>
                    {PLAY_STYLE_LABELS[o.v]}
                  </Text>
                  <Text style={[styles.optionSub, sel && styles.optionSubActive]}>{o.sub}</Text>
                </View>
                {sel && <Ionicons name="checkmark-circle" size={22} color={Colors.bg} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}

function RegionStep({
  draft, setDraft,
}: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  return (
    <>
      <StepHeader title="Sua região" sub="Pra encontrar jogadores perto de você." />
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Estado (UF)</Text>
        <View style={styles.stateGrid}>
          {BR_STATES.map(uf => {
            const sel = draft.regionState === uf;
            return (
              <TouchableOpacity
                key={uf}
                style={[styles.stateChip, sel && styles.stateChipActive]}
                onPress={() => setDraft(d => ({ ...d, regionState: uf }))}
              >
                <Text style={[styles.stateChipText, sel && styles.stateChipTextActive]}>{uf}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Cidade</Text>
        <TextInput
          style={styles.input}
          placeholder="ex: São Paulo"
          placeholderTextColor={Colors.textTertiary}
          value={draft.regionCity ?? ''}
          onChangeText={t => setDraft(d => ({ ...d, regionCity: t }))}
          autoCapitalize="words"
        />
      </View>
    </>
  );
}

function ProStep({
  draft, setDraft,
}: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const [tour, setTour] = useState<'ATP' | 'WTA'>('ATP');
  const list = PROS.filter(p => p.tour === tour);

  return (
    <>
      <StepHeader title="Quem você joga parecido?" sub="Escolha o pro que mais combina com seu jogo." />
      <View style={styles.tourTabs}>
        <TouchableOpacity
          style={[styles.tourTab, tour === 'ATP' && styles.tourTabActive]}
          onPress={() => setTour('ATP')}
        >
          <Text style={[styles.tourTabText, tour === 'ATP' && styles.tourTabTextActive]}>ATP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tourTab, tour === 'WTA' && styles.tourTabActive]}
          onPress={() => setTour('WTA')}
        >
          <Text style={[styles.tourTabText, tour === 'WTA' && styles.tourTabTextActive]}>WTA</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={list}
        keyExtractor={p => p.id}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={{ gap: Spacing.sm }}
        contentContainerStyle={{ gap: Spacing.sm }}
        renderItem={({ item }) => {
          const sel = draft.similarProId === item.id;
          return (
            <TouchableOpacity
              style={[styles.proCard, sel && styles.proCardActive]}
              onPress={() => setDraft(d => ({ ...d, similarProId: item.id }))}
            >
              <View style={[styles.proAvatar, { backgroundColor: item.color }]}>
                <Text style={styles.proInitial}>{item.name[0]}</Text>
              </View>
              <Text style={styles.proName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.proStyle}>{PLAY_STYLE_LABELS[item.style]}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.xxl, paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  backBtnHidden: { opacity: 0 },
  stepCount: { fontSize: Font.sm, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1 },
  progressTrack: {
    height: 4, backgroundColor: Colors.card,
    marginHorizontal: Spacing.md, borderRadius: 2,
  },
  progressFill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
  body: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  stepHeader: { gap: Spacing.xs, marginBottom: Spacing.sm },
  stepTitle: { fontSize: Font.xxl, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  stepSub: { fontSize: Font.md, color: Colors.textSecondary },

  fieldGroup: { gap: Spacing.xs },
  label: { fontSize: Font.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  hintText: { fontSize: Font.xs, color: Colors.textTertiary },
  errorText: { fontSize: Font.xs, color: Colors.red, fontWeight: '600' },

  handleWrap: { position: 'relative' },
  handlePrefix: {
    position: 'absolute', left: Spacing.md, top: 0, bottom: 0,
    fontSize: Font.lg, fontWeight: '900', color: Colors.textSecondary,
    textAlignVertical: 'center', includeFontPadding: false,
    height: '100%', lineHeight: 50,
  },
  handleInput: { paddingLeft: 36 },

  handRow: { flexDirection: 'row', gap: Spacing.sm },
  handBtn: {
    flex: 1, alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    paddingVertical: Spacing.md, borderWidth: 2, borderColor: Colors.border,
  },
  handBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  handLabel: { fontSize: Font.sm, fontWeight: '800', color: Colors.text },
  handLabelActive: { color: Colors.bg },

  optionList: { gap: Spacing.sm },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 2, borderColor: Colors.border,
  },
  optionActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  optionLabel: { fontSize: Font.lg, fontWeight: '800', color: Colors.text },
  optionLabelActive: { color: Colors.bg },
  optionSub: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: 2 },
  optionSubActive: { color: Colors.bg + 'BB' },

  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  stateChip: {
    backgroundColor: Colors.card, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  stateChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  stateChipText: { fontSize: Font.sm, fontWeight: '700', color: Colors.text },
  stateChipTextActive: { color: Colors.bg },

  tourTabs: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm },
  tourTab: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  tourTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tourTabText: { fontSize: Font.sm, fontWeight: '800', color: Colors.text, letterSpacing: 1 },
  tourTabTextActive: { color: Colors.bg },

  proCard: {
    flex: 1, padding: Spacing.sm, gap: Spacing.xs,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.border, alignItems: 'center',
  },
  proCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '20' },
  proAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  proInitial: { fontSize: Font.lg, fontWeight: '900', color: Colors.bg },
  proName: { fontSize: Font.xs, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  proStyle: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },

  footer: {
    padding: Spacing.lg, paddingBottom: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    padding: Spacing.md,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: Colors.bg, fontWeight: '900', fontSize: Font.md, letterSpacing: 1.5 },
});
