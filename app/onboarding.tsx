import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Image, FlatList, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, Spacing, Radius, Font,
  SURFACE_LABELS, ENVIRONMENT_LABELS, HAND_LABELS, PLAY_STYLE_LABELS,
} from '../constants/theme';
import { PROS, ProPlayer } from '../constants/pros';
import {
  DominantHand, PlayStyle, Environment, Surface, Profile,
} from '../constants/types';
import { useProfileStore } from '../stores/useProfileStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useAuth } from '../lib/AuthContext';

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

type StepId =
  | 'avatar' | 'physique' | 'hand' | 'style'
  | 'environment' | 'surface' | 'region' | 'pro';

const STEPS: StepId[] = [
  'avatar','physique','hand','style','environment','surface','region','pro',
];

interface Draft {
  avatarUrl?: string;
  weightKg?: number;
  heightCm?: number;
  dominantHand?: DominantHand;
  playStyle?: PlayStyle;
  preferredEnvironment?: Environment;
  preferredSurface?: Surface;
  regionState?: string;
  regionCity?: string;
  similarProId?: string;
}

export default function OnboardingScreen() {
  const { session } = useAuth();
  const me = useProfileStore(s => s.me);
  const completeOnboarding = useProfileStore(s => s.completeOnboarding);
  const setupMe = usePlayerStore(s => s.setupMe);

  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    avatarUrl: me?.avatarUrl,
  });

  const step = STEPS[stepIdx];
  const progress = (stepIdx + 1) / STEPS.length;

  const canAdvance = useMemo(() => {
    switch (step) {
      case 'avatar': return true;
      case 'physique': return !!draft.weightKg && !!draft.heightCm;
      case 'hand': return !!draft.dominantHand;
      case 'style': return !!draft.playStyle;
      case 'environment': return !!draft.preferredEnvironment;
      case 'surface': return !!draft.preferredSurface;
      case 'region': return !!draft.regionState && !!draft.regionCity?.trim();
      case 'pro': return !!draft.similarProId;
    }
  }, [step, draft]);

  const isLast = stepIdx === STEPS.length - 1;

  const handleNext = async () => {
    if (!canAdvance) return;
    if (!isLast) {
      setStepIdx(i => i + 1);
      return;
    }
    if (!session || !me) return;

    setSaving(true);
    const patch: Partial<Profile> = {
      avatarUrl: draft.avatarUrl,
      weightKg: draft.weightKg,
      heightCm: draft.heightCm,
      dominantHand: draft.dominantHand,
      playStyle: draft.playStyle,
      preferredEnvironment: draft.preferredEnvironment,
      preferredSurface: draft.preferredSurface,
      regionState: draft.regionState,
      regionCity: draft.regionCity?.trim(),
      similarProId: draft.similarProId,
    };

    const updated = await completeOnboarding(patch);
    if (updated) {
      // Cria/atualiza o "me" player espelhando profile (pra histórico de partidas).
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
        {/* Header */}
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

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Step body */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {step === 'avatar' && (
              <AvatarStep me={me} draft={draft} setDraft={setDraft} />
            )}
            {step === 'physique' && (
              <PhysiqueStep draft={draft} setDraft={setDraft} />
            )}
            {step === 'hand' && (
              <HandStep draft={draft} setDraft={setDraft} />
            )}
            {step === 'style' && (
              <StyleStep draft={draft} setDraft={setDraft} />
            )}
            {step === 'environment' && (
              <EnvironmentStep draft={draft} setDraft={setDraft} />
            )}
            {step === 'surface' && (
              <SurfaceStep draft={draft} setDraft={setDraft} />
            )}
            {step === 'region' && (
              <RegionStep draft={draft} setDraft={setDraft} />
            )}
            {step === 'pro' && (
              <ProStep draft={draft} setDraft={setDraft} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, (!canAdvance || saving) && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canAdvance || saving}
          >
            {saving ? (
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

// ====================== STEPS ======================

function StepHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>{title}</Text>
      {sub && <Text style={styles.stepSub}>{sub}</Text>}
    </View>
  );
}

function AvatarStep({
  me, draft, setDraft,
}: { me: Profile | null; draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const url = draft.avatarUrl ?? me?.avatarUrl;
  const initial = (me?.name?.[0] ?? '?').toUpperCase();

  return (
    <>
      <StepHeader
        title="Sua foto"
        sub={url ? 'Pegamos do Google. Pode trocar depois no Perfil.' : 'Vamos usar suas iniciais. Pode trocar depois no Perfil.'}
      />
      <View style={styles.avatarPreview}>
        {url ? (
          <Image source={{ uri: url }} style={styles.avatarImg} />
        ) : (
          <View style={[styles.avatarImg, { backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <Text style={styles.avatarName}>{me?.name ?? 'Jogador'}</Text>
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

function HandStep({
  draft, setDraft,
}: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const opts: DominantHand[] = ['right', 'left'];
  return (
    <>
      <StepHeader title="Mão dominante" />
      <View style={styles.optionList}>
        {opts.map(h => (
          <Option
            key={h}
            label={HAND_LABELS[h]}
            selected={draft.dominantHand === h}
            onPress={() => setDraft(d => ({ ...d, dominantHand: h }))}
            icon={h === 'left' ? 'hand-left' : 'hand-right'}
          />
        ))}
      </View>
    </>
  );
}

function StyleStep({
  draft, setDraft,
}: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const opts: { v: PlayStyle; sub: string }[] = [
    { v: 'serve_volley', sub: 'Saca e sobe à rede' },
    { v: 'offensive',    sub: 'Bate forte da fundação' },
    { v: 'all_court',    sub: 'Versátil, joga tudo' },
    { v: 'defensive',    sub: 'Devolve tudo, espera o erro' },
  ];
  return (
    <>
      <StepHeader title="Estilo de jogo" />
      <View style={styles.optionList}>
        {opts.map(o => (
          <Option
            key={o.v}
            label={PLAY_STYLE_LABELS[o.v]}
            sub={o.sub}
            selected={draft.playStyle === o.v}
            onPress={() => setDraft(d => ({ ...d, playStyle: o.v }))}
          />
        ))}
      </View>
    </>
  );
}

function EnvironmentStep({
  draft, setDraft,
}: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const opts: Environment[] = ['outdoor', 'indoor'];
  return (
    <>
      <StepHeader title="Quadra preferida" sub="Onde você prefere jogar." />
      <View style={styles.optionList}>
        {opts.map(e => (
          <Option
            key={e}
            label={ENVIRONMENT_LABELS[e]}
            selected={draft.preferredEnvironment === e}
            onPress={() => setDraft(d => ({ ...d, preferredEnvironment: e }))}
            icon={e === 'outdoor' ? 'sunny' : 'home'}
          />
        ))}
      </View>
    </>
  );
}

function SurfaceStep({
  draft, setDraft,
}: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>> }) {
  const opts: Surface[] = ['clay', 'hard', 'grass'];
  return (
    <>
      <StepHeader title="Superfície preferida" />
      <View style={styles.optionList}>
        {opts.map(s => (
          <Option
            key={s}
            label={SURFACE_LABELS[s]}
            selected={draft.preferredSurface === s}
            onPress={() => setDraft(d => ({ ...d, preferredSurface: s }))}
          />
        ))}
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

function Option({
  label, sub, selected, onPress, icon,
}: {
  label: string; sub?: string; selected: boolean;
  onPress: () => void; icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionActive]}
      onPress={onPress}
    >
      {icon && <Ionicons name={icon} size={22} color={selected ? Colors.bg : Colors.text} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelActive]}>{label}</Text>
        {sub && <Text style={[styles.optionSub, selected && styles.optionSubActive]}>{sub}</Text>}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={Colors.bg} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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

  avatarPreview: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  avatarImg: { width: 140, height: 140, borderRadius: 70 },
  avatarInitial: { fontSize: 64, fontWeight: '900', color: Colors.bg },
  avatarName: { fontSize: Font.xl, fontWeight: '800', color: Colors.text },

  fieldGroup: { gap: Spacing.xs },
  label: { fontSize: Font.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.lg,
    borderWidth: 1, borderColor: Colors.border,
  },

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
