1. Rodei já e está tudo ok
2. Fluxo ok!
- layout: as vezes quando muda de tela está dando uma piscada branca
3. pode executar
4. Feed social deve permitir likes e reações, comentários, comentários marcando pessoas. acho que vai ter que adicionar no onboarding "@nickname" pra poder marcar outros
- fazer igual gym rats, ao registrar um jogo deve postar uma foto, o outro player deve aprovar.
- remover o usuário poder criar players, devem ser todos reais e usuários registrados
- existe alguma forma mais fácil de adicionar social media: exemplo se a pessoa tem o app do instagram ao invés de digitar a url ela só clica na rede social e já identifica os instagrams dela no celular pra ela selecionar. mesma coisa com linkedin
- melhorar a tela de registro de partida. ter opção de dupla ou simples. os adversários devem ser buscáveis na plataforma ao invés de tags scrolláveis. não estou conseguindo selecionar um jogador da plataforma. só os que crio (mas lembrando que os criáveis devem sumir)
- no registro de partida o nome está cortado e não está mostrando o avatar.
- sempre que tiver algum menu card ou botão de "superfície" deve ser um card com uma foto da superfície (opacidade 50%) no fundo e o nome da superfície na frente (estiloso né?)
- melhorar a tela de registro de partida (se selecionar saibro o placar fica tipo o de roland garros, dura tipo ATP ou US Open, Grama tipo Wimbledom roxo e verde)
- registro de partida campos novos (opcionais): além de data, horário. foto de banner (obrigatório). local da partida. trocar observações por "sobre a partida". o que mais da pra colocar?
- onboarding: adicionar data de nascimento. remover quadra e superfície preferida do onboarding e mover para edição de perfil.
- o onboarding está muito longo? como encurtar?


TypeScript limpo. Fase 1 concluída.                                                     
                                                                                                                                                                           
  Rodar antes de testar: supabase/migrations/0004_handle_birth_match_extras.sql no SQL editor.                                                                             
                                                                                                                                                                           
  O que mudou:                                                                                                                                                             
                                                                                                                                                                           
  - Piscada branca corrigida via ThemeProvider com DarkTheme custom em _layout.tsx. RN-navigation usava theme branco default.                                            
  - Schema 0004: profiles ganha birth_date + handle UNIQUE (case-insensitive). matches ganha scheduled_time, location, banner_url. Não-destrutivo.                         
  - Onboarding 5 passos (era 8): Identidade (@handle único + nascimento) → Físico → Jogo (mão+estilo combinados) → Região → Pro. Drop avatar (Google avatar serve, troca
  depois), drop quadra+superfície (movidos pra perfil). Validação de handle async contra DB.                                                                               
  - Profile ganha edit modals: Identidade (nome+@+nascimento), Preferências (quadra+superfície), Avatar, Social. Nascimento aparece em "Sobre você" formatado DD/MM/YYYY.  
  - SurfaceCard novo: gradient temático (Saibro=Roland Garros laranja, Duro=US Open azul, Grama=Wimbledon roxo+verde). Sem fotos reais ainda — gradients estilosos. Pra
  fotos reais, posso baixar Unsplash assets depois.
  - Match register revamp:
    - Hero superior com gradient da superfície selecionada (muda dinamicamente)
    - Toggle Simples/Dupla (Dupla=disabled "EM BREVE" — schema novo necessário)
    - Player slots clicáveis abrem modal de busca em roster + plataforma com search field
    - Bug do profile da plataforma corrigido: ao selecionar, auto-cria player local espelhando profile, depois usa
    - Bug nome cortado/sem avatar corrigido: slots mostram avatar + nome completo + @handle
    - Surface picker usa SurfaceCard
    - Campos novos: data + horário (lado a lado), local, banner_url, "Sobre a partida" (notes renomeado)

  Não atacado ainda (fase 2 — precisa OK pra prosseguir):

  1. Remover criar players manuais (todos profile-based) — schema novo: drop players, matches referencia profiles.id. Refactor pesado de stores e UI. Toca
  histórico/H2H/standings.
  2. Match approval flow (gym rats): P1 registra, P2 aprova → vira post no feed. Schema: match_status (pending/confirmed) + notification.
  3. Feed social: posts auto-criados ao confirmar match, reactions (🔥😭🐐), comentários, mentions @. Schema: posts, post_reactions, post_comments. Tela nova de feed (vira
   home tab).
  4. Social media auto-detect: honest take — não rola facilmente no iOS/Android (sandbox). Opções:
    - Quick win (1h): botão que abre instagram:// no app, user copia handle e cola
    - Real OAuth (semanas): Meta Developer + LinkedIn Dev account, Instagram Basic Display API + LinkedIn API + redirect handling. Vale só quando app for maior.
    - Recomendo quick win por ora.
  5. Doubles real — schema com player3/player4.
  6. Fotos reais nas surface cards (Unsplash/Wikimedia) em vez de gradient.

  Qual da fase 2 quer atacar primeiro? Recomendação minha: #1 (profile-based players) primeiro porque é fundação pra #2 e #3. Depois #2 (approval flow) que destrava #3
  (feed). Social media OAuth e doubles ficam por último.


  #1 Profile-based players:                                                                                                                                                
  - players table morta. Matches referenciam profiles.id direto. Constraint: P1 ≠ P2.                                                                                      
  - usePlayerStore deletado. Tudo opera em profiles via useProfileStore.me + nearby.
  - lib/h2h.ts novo: computeH2H + computeRivalryProfile (kryptonita/freguês — pra fase futura).                                                                            
  - Match register: picker = me + plataforma. Sem auto-create de roster. Sem botão "Adicionar jogador" no players tab (todos já são reais).                                
  - Live match: chips com profiles + avatar URL.                                                                                                                           
  - Player detail (/player/[id]): mostra qualquer profile, opponent selector com todos da plataforma.
  - Components (MatchCard, PlayerCard) recebem profiles: Map e myId em vez de array de Player.
  - RLS de matches: visível pra owner OU P1 OU P2. loadAll puxa todas as três.

  #2 Match approval flow:
  - matches.status = pending | confirmed | rejected. Default pending no insert.
  - Auto-confirma se owner é o próprio P2 (edge case).
  - approveMatch(id) e rejectMatch(id) no store. RLS permite só ao P2 (apenas mudando status).
  - /pending screen: lista matches onde sou P2 com status=pending. Card mostra: adversário (P1), placar, superfície, "Você venceu/perdeu", botões Rejeitar (vermelho) +
  Aprovar (verde acento).
  - Drawer ganha item "Aprovações" com badge laranja contando pendentes.
  - Home banner laranja ("X partidas pra aprovar") quando pendingCount > 0.
  - MatchCard badges: PENDENTE (laranja) ou REJEITADA (vermelho) substituem W/L até confirmar.
  - Stats e histórico só contam confirmed — gym-rats vibe: ninguém ganha rating fantasma. Pending não aparece no feed/histórico.

  Vantagens dessa arquitetura:
  - Schema simples: 1 source of truth (profiles), sem duplicação.
  - Match insert por P1 fica visível pro P2 imediatamente via RLS (P2 pode dar SELECT).
  - /pending screen: lista matches onde sou P2 com status=pending. Card mostra: adversário (P1), placar, superfície, "Você venceu/perdeu", botões Rejeitar (vermelho) +
  Aprovar (verde acento).
  - Drawer ganha item "Aprovações" com badge laranja contando pendentes.
  - Home banner laranja ("X partidas pra aprovar") quando pendingCount > 0.
  - MatchCard badges: PENDENTE (laranja) ou REJEITADA (vermelho) substituem W/L até confirmar.
  - approveMatch(id) e rejectMatch(id) no store. RLS permite só ao P2 (apenas mudando status).
  - /pending screen: lista matches onde sou P2 com status=pending. Card mostra: adversário (P1), placar, superfície, "Você venceu/perdeu", botões Rejeitar (vermelho) +
   Aprovar (verde acento).
  - Drawer ganha item "Aprovações" com badge laranja contando pendentes.
  - Auto-confirma se owner é o próprio P2 (edge case).
  - approveMatch(id) e rejectMatch(id) no store. RLS permite só ao P2 (apenas mudando status).
  - /pending screen: lista matches onde sou P2 com status=pending. Card mostra: adversário (P1), placar, superfície, "Você venceu/perdeu", botões Rejeitar (vermelho) +
   Aprovar (verde acento).
  - Drawer ganha item "Aprovações" com badge laranja contando pendentes.
  - Home banner laranja ("X partidas pra aprovar") quando pendingCount > 0.
  - MatchCard badges: PENDENTE (laranja) ou REJEITADA (vermelho) substituem W/L até confirmar.
  - Stats e histórico só contam confirmed — gym-rats vibe: ninguém ganha rating fantasma. Pending não aparece no feed/histórico.

  Vantagens dessa arquitetura:
  - Schema simples: 1 source of truth (profiles), sem duplicação.
  - Match insert por P1 fica visível pro P2 imediatamente via RLS (P2 pode dar SELECT).
  - Confiabilidade do score: precisa de 2 dedos no botão.

  Limitações conhecidas:
  - Sem push notification — P2 só vê pending se abrir o app + drawer/home. Próxima fase: expo-notifications + Supabase realtime ou edge function.
  - Live match também salva como pending — talvez melhor pedir confirmação real-time durante o jogo, mas escopo extra. Por ora vai como pending.
  - Não tem cancelar uma aprovação. Match rejected fica perdido. Sem desfazer.

  Próxima fase recomendada: #3 Feed social — agora que match approval existe, posts auto-criados ao confirmar match (foto banner + score + mentions @P1 vs @P2).
  Reactions 🔥😭🐐. Comments com mentions. Vira a home. Quer atacar?

✻ Cooked for 11m 15s

※ recap: Building TennisRaptor (social tennis app, profile-based players + match approval flow just shipped). Next: run migrations 0005 and 0006 in Supabase, then     
  decide if we move to fase 3 (feed social with posts/reactions/comments).