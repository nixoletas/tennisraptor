import { DominantHand, PlayStyle } from './types';

export interface ProPlayer {
  id: string;
  name: string;
  hand: DominantHand;
  style: PlayStyle;
  tour: 'ATP' | 'WTA';
  // Foto opcional. Sem URL = fallback pra iniciais coloridas.
  photoUrl?: string;
  color: string;
}

export const PROS: ProPlayer[] = [
  // ATP
  { id: 'alcaraz',     name: 'Carlos Alcaraz',    hand: 'right', style: 'all_court',     tour: 'ATP', color: '#FF6B6B' },
  { id: 'sinner',      name: 'Jannik Sinner',     hand: 'right', style: 'offensive',     tour: 'ATP', color: '#FF9F0A' },
  { id: 'djokovic',    name: 'Novak Djokovic',    hand: 'right', style: 'all_court',     tour: 'ATP', color: '#0A84FF' },
  { id: 'federer',     name: 'Roger Federer',     hand: 'right', style: 'all_court',     tour: 'ATP', color: '#D4FF00' },
  { id: 'nadal',       name: 'Rafael Nadal',      hand: 'left',  style: 'defensive',     tour: 'ATP', color: '#FF453A' },
  { id: 'medvedev',    name: 'Daniil Medvedev',   hand: 'right', style: 'defensive',     tour: 'ATP', color: '#64D2FF' },
  { id: 'tsitsipas',   name: 'Stefanos Tsitsipas',hand: 'right', style: 'all_court',     tour: 'ATP', color: '#30D158' },
  { id: 'rublev',      name: 'Andrey Rublev',     hand: 'right', style: 'offensive',     tour: 'ATP', color: '#BF5AF2' },
  { id: 'zverev',      name: 'Alexander Zverev',  hand: 'right', style: 'offensive',     tour: 'ATP', color: '#FFD60A' },
  { id: 'ruud',        name: 'Casper Ruud',       hand: 'right', style: 'all_court',     tour: 'ATP', color: '#32D74B' },
  { id: 'hurkacz',     name: 'Hubert Hurkacz',    hand: 'right', style: 'serve_volley',  tour: 'ATP', color: '#FF375F' },
  { id: 'fa-aliassime',name: 'Felix Auger-Aliassime', hand: 'right', style: 'offensive', tour: 'ATP', color: '#0A84FF' },
  { id: 'deminaur',    name: 'Alex de Minaur',    hand: 'right', style: 'defensive',     tour: 'ATP', color: '#64D2FF' },
  { id: 'dimitrov',    name: 'Grigor Dimitrov',   hand: 'right', style: 'all_court',     tour: 'ATP', color: '#D4FF00' },
  { id: 'berrettini',  name: 'Matteo Berrettini', hand: 'right', style: 'serve_volley',  tour: 'ATP', color: '#FF6B6B' },
  { id: 'shelton',     name: 'Ben Shelton',       hand: 'left',  style: 'serve_volley',  tour: 'ATP', color: '#FF9F0A' },
  { id: 'fritz',       name: 'Taylor Fritz',      hand: 'right', style: 'offensive',     tour: 'ATP', color: '#0A84FF' },
  { id: 'paul',        name: 'Tommy Paul',        hand: 'right', style: 'all_court',     tour: 'ATP', color: '#30D158' },
  { id: 'korda',       name: 'Sebastian Korda',   hand: 'right', style: 'all_court',     tour: 'ATP', color: '#BF5AF2' },
  { id: 'kyrgios',     name: 'Nick Kyrgios',      hand: 'right', style: 'serve_volley',  tour: 'ATP', color: '#FF453A' },
  { id: 'monfils',     name: 'Gaël Monfils',      hand: 'right', style: 'defensive',     tour: 'ATP', color: '#FFD60A' },
  { id: 'guga',        name: 'Gustavo Kuerten',   hand: 'right', style: 'all_court',     tour: 'ATP', color: '#FF9F0A' },
  { id: 'bellucci',    name: 'Thomaz Bellucci',   hand: 'left',  style: 'all_court',     tour: 'ATP', color: '#30D158' },
  { id: 'meligeni',    name: 'Fernando Meligeni', hand: 'left',  style: 'defensive',     tour: 'ATP', color: '#64D2FF' },
  { id: 'wawrinka',    name: 'Stan Wawrinka',     hand: 'right', style: 'offensive',     tour: 'ATP', color: '#BF5AF2' },
  { id: 'thiem',       name: 'Dominic Thiem',     hand: 'right', style: 'offensive',     tour: 'ATP', color: '#FF6B6B' },

  // WTA
  { id: 'swiatek',     name: 'Iga Świątek',       hand: 'right', style: 'all_court',     tour: 'WTA', color: '#FF6B6B' },
  { id: 'sabalenka',   name: 'Aryna Sabalenka',   hand: 'right', style: 'offensive',     tour: 'WTA', color: '#FF453A' },
  { id: 'gauff',       name: 'Coco Gauff',        hand: 'right', style: 'defensive',     tour: 'WTA', color: '#FFD60A' },
  { id: 'rybakina',    name: 'Elena Rybakina',    hand: 'right', style: 'serve_volley',  tour: 'WTA', color: '#0A84FF' },
  { id: 'pegula',      name: 'Jessica Pegula',    hand: 'right', style: 'all_court',     tour: 'WTA', color: '#30D158' },
  { id: 'jabeur',      name: 'Ons Jabeur',        hand: 'right', style: 'all_court',     tour: 'WTA', color: '#BF5AF2' },
  { id: 'vondrousova', name: 'Markéta Vondroušová', hand: 'left', style: 'defensive',    tour: 'WTA', color: '#64D2FF' },
  { id: 'krejcikova',  name: 'Barbora Krejčíková',hand: 'right', style: 'all_court',     tour: 'WTA', color: '#D4FF00' },
  { id: 'muchova',     name: 'Karolína Muchová',  hand: 'right', style: 'all_court',     tour: 'WTA', color: '#FF9F0A' },
  { id: 'andreeva',    name: 'Mirra Andreeva',    hand: 'right', style: 'defensive',     tour: 'WTA', color: '#32D74B' },
  { id: 'haddad',      name: 'Beatriz Haddad Maia', hand: 'left', style: 'offensive',    tour: 'WTA', color: '#FF375F' },
  { id: 'serena',      name: 'Serena Williams',   hand: 'right', style: 'offensive',     tour: 'WTA', color: '#FF453A' },
  { id: 'venus',       name: 'Venus Williams',    hand: 'right', style: 'offensive',     tour: 'WTA', color: '#0A84FF' },
  { id: 'sharapova',   name: 'Maria Sharapova',   hand: 'right', style: 'offensive',     tour: 'WTA', color: '#FFD60A' },
  { id: 'osaka',       name: 'Naomi Osaka',       hand: 'right', style: 'offensive',     tour: 'WTA', color: '#BF5AF2' },
];

export function getProById(id: string | null | undefined): ProPlayer | undefined {
  if (!id) return undefined;
  return PROS.find(p => p.id === id);
}
