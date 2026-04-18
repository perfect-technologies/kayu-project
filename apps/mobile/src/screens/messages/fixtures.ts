// Demo thread fixtures used by DS04 Messages UI.
// Backend `/messaging` does not yet return status/profession/online so the
// DS04 spec renders a self-contained fixture until that wiring lands.

export type ThreadStatus = 'active' | 'quote' | 'completed';
export type MsgFrom = 'me' | 'pro' | 'system';

export type DemoMsg = {
  id: string;
  from: MsgFrom;
  text: string;
  at: string;
};

export type DemoThread = {
  id: string;
  providerId: string;
  providerName: string;
  profession: string;
  avatarBg: string;
  initials: string;
  online: boolean;
  unread: number;
  lastAt: string;
  status: ThreadStatus;
  missionSummary?: string;
  missionBookingId?: string;
  preview: string;
  messages: DemoMsg[];
};

export const SUGGESTED_REPLIES = [
  'Merci beaucoup !',
  "Pouvez-vous m'envoyer un devis ?",
  'À quelle heure serez-vous disponible ?',
  'Ça marche pour moi.',
];

export const DEMO_THREADS: DemoThread[] = [
  {
    id: 't1',
    providerId: 'p1',
    providerName: 'Jean Mubake',
    profession: 'Plombier',
    avatarBg: '#0EA5E9',
    initials: 'JM',
    online: true,
    unread: 2,
    lastAt: "à l'instant",
    status: 'active',
    missionSummary: 'Mission confirmée · demain 9h00',
    missionBookingId: 'b_demo_1',
    preview: "D'accord, je passe demain à 9h. Préparez les clés.",
    messages: [
      { id: 'm1', from: 'pro', text: "Bonjour ! J'ai vu votre demande. Pouvez-vous me décrire la fuite ?", at: '14:12' },
      { id: 'm2', from: 'me', text: "Salut Jean. C'est sous l'évier de la cuisine, ça goutte depuis ce matin.", at: '14:15' },
      { id: 'm3', from: 'me', text: "J'ai mis un seau en dessous pour le moment.", at: '14:15' },
      { id: 'm4', from: 'pro', text: "Pas de souci. Ce genre de fuite se règle vite, souvent un joint à changer.", at: '14:18' },
      { id: 'm5', from: 'system', text: 'Réservation confirmée · demain 9h00 · 15 000 FC estimé', at: '14:22' },
      { id: 'm6', from: 'pro', text: "D'accord, je passe demain à 9h. Préparez les clés.", at: '14:22' },
    ],
  },
  {
    id: 't2',
    providerId: 'p4',
    providerName: 'Lucie Ngalamulume',
    profession: 'Coiffeuse',
    avatarBg: '#FB7185',
    initials: 'LN',
    online: false,
    unread: 0,
    lastAt: 'il y a 2h',
    status: 'completed',
    preview: 'Merci pour la super coiffure ! À très vite 💛',
    messages: [
      { id: 'm1', from: 'me', text: 'Merci Lucie, tu as fait un travail super.', at: '11:40' },
      { id: 'm2', from: 'pro', text: 'Merci pour la super coiffure ! À très vite 💛', at: '12:05' },
    ],
  },
  {
    id: 't3',
    providerId: 'p2',
    providerName: 'Patrick Kabongo',
    profession: 'Électricien',
    avatarBg: '#F59E0B',
    initials: 'PK',
    online: true,
    unread: 0,
    lastAt: 'hier',
    status: 'quote',
    preview: 'Je vous envoie un devis ce soir.',
    messages: [
      { id: 'm1', from: 'me', text: "Bonjour, j'ai 3 prises à remplacer dans le salon.", at: 'hier 18:03' },
      { id: 'm2', from: 'pro', text: 'Bonjour ! Je vous envoie un devis ce soir.', at: 'hier 18:10' },
    ],
  },
  {
    id: 't4',
    providerId: 'p6',
    providerName: 'Sarah Mokonzi',
    profession: 'Jardinière',
    avatarBg: '#10B981',
    initials: 'SM',
    online: false,
    unread: 0,
    lastAt: 'lun.',
    status: 'completed',
    preview: 'Parfait, à jeudi alors !',
    messages: [{ id: 'm1', from: 'me', text: 'Parfait, à jeudi alors !', at: 'lun. 10:22' }],
  },
];
