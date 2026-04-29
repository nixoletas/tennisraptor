import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, Alert, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, Spacing, Radius, Font,
  SURFACE_LABELS, ENVIRONMENT_LABELS, HAND_LABELS, PLAY_STYLE_LABELS,
} from '../../constants/theme';
import { useProfileStore } from '../../stores/useProfileStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useMatchStore } from '../../stores/useMatchStore';
import { StatCard } from '../../components/StatCard';
import { useAuth } from '../../lib/AuthContext';
import { getProById } from '../../constants/pros';
import { Profile } from '../../constants/types';

type EditField =
  | 'name' | 'avatar'
  | 'social'
  | 'region';

export default function ProfileScreen() {
  const me = useProfileStore(s => s.me);
  const updateMe = useProfileStore(s => s.updateMe);
  const { myPlayerId } = usePlayerStore();
  const { getPlayerStats } = useMatchStore();
  const { user, signOut } = useAuth();

  const [editing, setEditing] = useState<EditField | null>(null);

  const stats = myPlayerId ? getPlayerStats(myPlayerId) : null;
  const pro = getProById(me?.similarProId);

  if (!me) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Carregando perfil…</Text>
      </View>
    );
  }

  const handleSignOut = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => { try { await signOut(); } catch {} },
      },
    ]);
  };

  const openLink = async (url?: string) => {
    if (!url) return;
    const full = /^https?:/.test(url) ? url : `https://${url}`;
    try { await Linking.openURL(full); } catch {}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={() => setEditing('avatar')}>
          {me.avatarUrl ? (
            <Image source={{ uri: me.avatarUrl }} style={styles.bigAvatar} />
          ) : (
            <View style={[styles.bigAvatar, { backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={styles.bigAvatarText}>{me.name[0]?.toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{me.name}</Text>
          {me.handle && <Text style={styles.profileHandle}>@{me.handle}</Text>}
          {(me.regionCity || me.regionState) && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={Colors.textSecondary} />
              <Text style={styles.locationText}>
                {me.regionCity}{me.regionCity && me.regionState ? ', ' : ''}{me.regionState}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => setEditing('name')} style={styles.editBtn}>
          <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Vitórias" value={stats.wins} accent flex={1} />
            <StatCard label="Derrotas" value={stats.losses} flex={1} />
            <StatCard label="Win Rate" value={`${Math.round(stats.winRate * 100)}%`} flex={1} />
          </View>
        </View>
      )}

      {/* Sobre você */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre você</Text>
        <View style={styles.attrCard}>
          <AttrRow label="Mão dominante" value={me.dominantHand && HAND_LABELS[me.dominantHand]} />
          <AttrRow label="Estilo" value={me.playStyle && PLAY_STYLE_LABELS[me.playStyle]} />
          <AttrRow label="Quadra preferida" value={me.preferredEnvironment && ENVIRONMENT_LABELS[me.preferredEnvironment]} />
          <AttrRow label="Superfície preferida" value={me.preferredSurface && SURFACE_LABELS[me.preferredSurface]} />
          <AttrRow label="Peso" value={me.weightKg ? `${me.weightKg} kg` : undefined} />
          <AttrRow label="Altura" value={me.heightCm ? `${me.heightCm} cm` : undefined} />
          <AttrRow
            label="Joga parecido com"
            value={pro?.name}
            valueColor={pro?.color}
            last
          />
        </View>
      </View>

      {/* Redes Sociais */}
      <View style={styles.section}>
        <View style={styles.socialHeader}>
          <Text style={styles.sectionTitle}>Redes sociais</Text>
          <TouchableOpacity onPress={() => setEditing('social')}>
            <Text style={styles.editLink}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.socialList}>
          <SocialRow
            icon="logo-instagram"
            label="Instagram"
            value={me.instagramUrl}
            onPress={() => openLink(me.instagramUrl)}
          />
          <SocialRow
            icon="logo-linkedin"
            label="LinkedIn"
            value={me.linkedinUrl}
            onPress={() => openLink(me.linkedinUrl)}
          />
        </View>
      </View>

      {/* Conta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conta</Text>
        {user?.email && (
          <View style={styles.accountRow}>
            <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.accountEmail}>{user.email}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={Colors.red} />
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xl }} />

      {/* Modais */}
      <NameModal
        visible={editing === 'name'}
        me={me}
        onClose={() => setEditing(null)}
        onSave={async patch => { await updateMe(patch); setEditing(null); }}
      />
      <AvatarModal
        visible={editing === 'avatar'}
        me={me}
        onClose={() => setEditing(null)}
        onSave={async patch => { await updateMe(patch); setEditing(null); }}
      />
      <SocialModal
        visible={editing === 'social'}
        me={me}
        onClose={() => setEditing(null)}
        onSave={async patch => { await updateMe(patch); setEditing(null); }}
      />
    </ScrollView>
  );
}

// ===================== Subcomponents =====================

function AttrRow({
  label, value, valueColor, last,
}: { label: string; value?: string | null; valueColor?: string; last?: boolean }) {
  return (
    <View style={[styles.attrRow, !last && styles.attrRowBorder]}>
      <Text style={styles.attrLabel}>{label}</Text>
      <Text style={[styles.attrValue, valueColor && { color: valueColor }]}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

function SocialRow({
  icon, label, value, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value?: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.socialRow, !value && styles.socialRowEmpty]}
      onPress={value ? onPress : undefined}
      disabled={!value}
    >
      <Ionicons name={icon} size={20} color={value ? Colors.text : Colors.textTertiary} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.socialLabel, !value && { color: Colors.textTertiary }]}>{label}</Text>
        {value ? (
          <Text style={styles.socialValue} numberOfLines={1}>{value}</Text>
        ) : (
          <Text style={styles.socialEmpty}>Não informado</Text>
        )}
      </View>
      {value && <Ionicons name="open-outline" size={16} color={Colors.textSecondary} />}
    </TouchableOpacity>
  );
}

// --- Modais ---

function NameModal({
  visible, me, onClose, onSave,
}: { visible: boolean; me: Profile; onClose: () => void; onSave: (p: Partial<Profile>) => Promise<void> }) {
  const [name, setName] = useState(me.name);
  const [handle, setHandle] = useState(me.handle ?? '');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onSave({ name: name.trim(), handle: handle.trim() || undefined });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Editar perfil</Text>
          <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={Colors.textTertiary}
            value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="@handle (opcional)" placeholderTextColor={Colors.textTertiary}
            value={handle} onChangeText={setHandle} autoCapitalize="none" />
          <ModalActions onCancel={onClose} onConfirm={handleSubmit} />
        </View>
      </View>
    </Modal>
  );
}

function AvatarModal({
  visible, me, onClose, onSave,
}: { visible: boolean; me: Profile; onClose: () => void; onSave: (p: Partial<Profile>) => Promise<void> }) {
  const [url, setUrl] = useState(me.avatarUrl ?? '');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Trocar avatar</Text>
          <Text style={styles.modalHint}>Cole a URL de uma imagem (jpg/png).</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={Colors.textTertiary}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
          <ModalActions
            onCancel={onClose}
            onConfirm={() => onSave({ avatarUrl: url.trim() || undefined })}
            confirmLabel="SALVAR"
          />
        </View>
      </View>
    </Modal>
  );
}

function SocialModal({
  visible, me, onClose, onSave,
}: { visible: boolean; me: Profile; onClose: () => void; onSave: (p: Partial<Profile>) => Promise<void> }) {
  const [insta, setInsta] = useState(me.instagramUrl ?? '');
  const [linkedin, setLinkedin] = useState(me.linkedinUrl ?? '');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Redes sociais</Text>
          <Text style={styles.modalHint}>Tênis também é networking. Adicione seus links.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Instagram</Text>
            <TextInput
              style={styles.input}
              placeholder="instagram.com/seu_user"
              placeholderTextColor={Colors.textTertiary}
              value={insta}
              onChangeText={setInsta}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>LinkedIn</Text>
            <TextInput
              style={styles.input}
              placeholder="linkedin.com/in/seu_user"
              placeholderTextColor={Colors.textTertiary}
              value={linkedin}
              onChangeText={setLinkedin}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <ModalActions
            onCancel={onClose}
            onConfirm={() => onSave({
              instagramUrl: insta.trim() || undefined,
              linkedinUrl: linkedin.trim() || undefined,
            })}
            confirmLabel="SALVAR"
          />
        </View>
      </View>
    </Modal>
  );
}

function ModalActions({
  onCancel, onConfirm, confirmLabel = 'SALVAR',
}: { onCancel: () => void; onConfirm: () => void; confirmLabel?: string }) {
  return (
    <View style={styles.modalActions}>
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
        <Text style={styles.confirmText}>{confirmLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { gap: Spacing.lg, paddingBottom: Spacing.xxl },

  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg,
  },
  bigAvatar: { width: 72, height: 72, borderRadius: 36 },
  bigAvatarText: { fontSize: Font.xxxl, fontWeight: '900', color: Colors.bg },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: Font.xl, fontWeight: '800', color: Colors.text },
  profileHandle: { fontSize: Font.md, color: Colors.textSecondary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '600' },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },

  section: { gap: Spacing.sm, paddingHorizontal: Spacing.md },
  sectionTitle: {
    fontSize: Font.xs, fontWeight: '800', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  socialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { fontSize: Font.xs, fontWeight: '700', color: Colors.accent, letterSpacing: 0.5 },

  statsGrid: { flexDirection: 'row', gap: Spacing.sm },

  attrCard: { backgroundColor: Colors.card, borderRadius: Radius.md, paddingHorizontal: Spacing.md },
  attrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  attrRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  attrLabel: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '600' },
  attrValue: { fontSize: Font.sm, color: Colors.text, fontWeight: '700' },

  socialList: { gap: Spacing.xs },
  socialRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
  },
  socialRowEmpty: { opacity: 0.6 },
  socialLabel: { fontSize: Font.sm, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 0.3 },
  socialValue: { fontSize: Font.md, color: Colors.text, fontWeight: '600' },
  socialEmpty: { fontSize: Font.sm, color: Colors.textTertiary, fontStyle: 'italic' },

  accountRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
  },
  accountEmail: { fontSize: Font.sm, color: Colors.textSecondary, flex: 1 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.red + '15', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.red + '30',
  },
  signOutText: { fontSize: Font.md, color: Colors.red, fontWeight: '700' },

  emptyText: { fontSize: Font.md, color: Colors.textSecondary },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl,
  },
  modalTitle: { fontSize: Font.xl, fontWeight: '800', color: Colors.text },
  modalHint: { fontSize: Font.sm, color: Colors.textSecondary, marginTop: -Spacing.xs },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: Font.xs, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text, fontSize: Font.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.card, alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '700' },
  confirmBtn: {
    flex: 2, padding: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.accent, alignItems: 'center',
  },
  confirmText: { color: Colors.bg, fontWeight: '800', letterSpacing: 0.5 },
});
