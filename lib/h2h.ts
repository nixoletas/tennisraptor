import { Match, H2HStats } from '../constants/types';

// Computa head-to-head entre dois profiles a partir de uma lista de matches.
// p1/p2 são profile.ids. Retorna stats orientadas pra perspectiva de p1.
export function computeH2H(p1Id: string, p2Id: string, matches: Match[]): H2HStats {
  const h2h = matches.filter(
    m =>
      m.winnerId &&
      ((m.player1Id === p1Id && m.player2Id === p2Id) ||
        (m.player1Id === p2Id && m.player2Id === p1Id))
  );

  let p1Wins = 0, p2Wins = 0;
  let p1SetsWon = 0, p2SetsWon = 0;
  let p1GamesWon = 0, p2GamesWon = 0;

  for (const m of h2h) {
    const p1IsPlayer1 = m.player1Id === p1Id;
    if (m.winnerId === p1Id) p1Wins++;
    else p2Wins++;

    for (const s of m.sets) {
      const sg1 = p1IsPlayer1 ? s.p1 : s.p2;
      const sg2 = p1IsPlayer1 ? s.p2 : s.p1;
      p1GamesWon += sg1;
      p2GamesWon += sg2;
      if (sg1 > sg2) p1SetsWon++;
      else if (sg2 > sg1) p2SetsWon++;
    }
  }

  return {
    p1Wins, p2Wins, p1SetsWon, p2SetsWon, p1GamesWon, p2GamesWon,
    matches: h2h,
    lastMet: h2h[0]?.date,
  };
}

// "Kryptonita" e "Freguês": o adversário com pior/melhor win-rate (mín 3 jogos).
export function computeRivalryProfile(meId: string, matches: Match[], opponentIds: string[]) {
  const records: { id: string; wins: number; losses: number; rate: number }[] = [];
  for (const oid of opponentIds) {
    const stats = computeH2H(meId, oid, matches);
    const total = stats.p1Wins + stats.p2Wins;
    if (total < 3) continue;
    records.push({
      id: oid,
      wins: stats.p1Wins,
      losses: stats.p2Wins,
      rate: stats.p1Wins / total,
    });
  }
  if (records.length === 0) return { kryptonite: null, customer: null };
  records.sort((a, b) => a.rate - b.rate);
  return {
    kryptonite: records[0],          // pior performance
    customer: records[records.length - 1], // melhor performance ("freguês")
  };
}
