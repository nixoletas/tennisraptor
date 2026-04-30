import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/theme';
import { Profile } from '../constants/types';

interface Props {
  body: string;
  profilesByHandle: Map<string, Profile>;
  baseStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

const HANDLE_RE = /(@[a-zA-Z0-9_]+)/g;

// Renderiza um texto com @handles destacados em accent + tocáveis (vai pro
// /player/[id] do mencionado). Handles que não resolvem em profile ficam
// no estilo base (não destacam).
export function MentionText({ body, profilesByHandle, baseStyle, numberOfLines }: Props) {
  const parts = body.split(HANDLE_RE);

  return (
    <Text style={baseStyle} numberOfLines={numberOfLines}>
      {parts.map((part, i) => {
        if (!part.startsWith('@')) return <Text key={i}>{part}</Text>;
        const handle = part.slice(1).toLowerCase();
        const profile = profilesByHandle.get(handle);
        if (!profile) return <Text key={i}>{part}</Text>;
        return (
          <Text
            key={i}
            style={{ color: Colors.accent, fontWeight: '700' }}
            onPress={() => router.push(`/player/${profile.id}` as any)}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}
