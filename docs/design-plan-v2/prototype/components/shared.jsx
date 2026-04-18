// Shared KAYOU data, icons, and primitive components.
// All exported to window for cross-script access.

// ─── Icons (lucide-style, 1.75 stroke on 24, inherit color) ──────────────────
const Icon = ({ d, size = 20, stroke = 1.75, fill = "none", ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d}
  </svg>
);
const I = {
  search:   (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>}/>,
  mapPin:   (p) => <Icon {...p} d={<><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>}/>,
  star:     (p) => <Icon {...p} fill="currentColor" stroke="none" d={<path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2Z"/>}/>,
  heart:    (p) => <Icon {...p} d={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/>}/>,
  badgeCheck: (p) => <Icon {...p} d={<><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></>}/>,
  shieldCheck: (p) => <Icon {...p} d={<><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/><path d="m9 12 2 2 4-4"/></>}/>,
  award:    (p) => <Icon {...p} d={<><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></>}/>,
  clock:    (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>,
  wrench:   (p) => <Icon {...p} d={<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>}/>,
  messageCircle: (p) => <Icon {...p} d={<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>}/>,
  coins:    (p) => <Icon {...p} d={<><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></>}/>,
  zap:      (p) => <Icon {...p} d={<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z"/>}/>,
  sparkles: (p) => <Icon {...p} d={<><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></>}/>,
  scissors: (p) => <Icon {...p} d={<><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></>}/>,
  laptop:   (p) => <Icon {...p} d={<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>}/>,
  leaf:     (p) => <Icon {...p} d={<><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.8.8c0 6-2 14-10 16.24"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></>}/>,
  paintbrush: (p) => <Icon {...p} d={<><path d="m14.622 17.897-10.68-2.913"/><path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z"/><path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15"/></>}/>,
  car:      (p) => <Icon {...p} d={<><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></>}/>,
  hammer:   (p) => <Icon {...p} d={<><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/></>}/>,
  arrowRight: (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>}/>,
  arrowLeft: (p) => <Icon {...p} d={<><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>}/>,
  chevronRight: (p) => <Icon {...p} d={<polyline points="9 18 15 12 9 6"/>}/>,
  chevronDown: (p) => <Icon {...p} d={<polyline points="6 9 12 15 18 9"/>}/>,
  menu: (p) => <Icon {...p} d={<><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></>}/>,
  x: (p) => <Icon {...p} d={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>}/>,
  filter: (p) => <Icon {...p} d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>}/>,
  sliders: (p) => <Icon {...p} d={<><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></>}/>,
  home: (p) => <Icon {...p} d={<><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>}/>,
  user: (p) => <Icon {...p} d={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>,
  calendar: (p) => <Icon {...p} d={<><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></>}/>,
  inbox: (p) => <Icon {...p} d={<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></>}/>,
  plus: (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="M12 5v14"/></>}/>,
  check: (p) => <Icon {...p} d={<polyline points="20 6 9 17 4 12"/>}/>,
  share: (p) => <Icon {...p} d={<><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></>}/>,
  phone: (p) => <Icon {...p} d={<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>}/>,
  send: (p) => <Icon {...p} d={<><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></>}/>,
  trash: (p) => <Icon {...p} d={<><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></>}/>,
  pencil: (p) => <Icon {...p} d={<><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></>}/>,
  fileText: (p) => <Icon {...p} d={<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></>}/>,
  percent: (p) => <Icon {...p} d={<><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>}/>,
  copy: (p) => <Icon {...p} d={<><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></>}/>,
  info: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></>}/>,
  alertTriangle: (p) => <Icon {...p} d={<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></>}/>,
  eye: (p) => <Icon {...p} d={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>}/>,
  camera: (p) => <Icon {...p} d={<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></>}/>,
  upload: (p) => <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></>}/>,
  flag: (p) => <Icon {...p} d={<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z"/><line x1="4" x2="4" y1="22" y2="15"/></>}/>,
  bell: (p) => <Icon {...p} d={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>}/>,
  settings: (p) => <Icon {...p} d={<><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/></>}/>,
  globe: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></>}/>,
  lock: (p) => <Icon {...p} d={<><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>,
  logout: (p) => <Icon {...p} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></>}/>,
  chevronLeft: (p) => <Icon {...p} d={<polyline points="15 18 9 12 15 6"/>}/>,
  refresh: (p) => <Icon {...p} d={<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></>}/>,
  wifi: (p) => <Icon {...p} d={<><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></>}/>,
  wifiOff: (p) => <Icon {...p} d={<><path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/></>}/>,
  creditCard: (p) => <Icon {...p} d={<><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></>}/>,
  trendingUp: (p) => <Icon {...p} d={<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>}/>,
  trendingDown: (p) => <Icon {...p} d={<><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>}/>,
  users: (p) => <Icon {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>,
  moreVertical: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></>}/>,
  fileCheck: (p) => <Icon {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></>}/>,
  xCircle: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></>}/>,
  checkCircle: (p) => <Icon {...p} d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}/>,
  server: (p) => <Icon {...p} d={<><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></>}/>,
  rotate: (p) => <Icon {...p} d={<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>}/>,
  selfie: (p) => <Icon {...p} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><circle cx="12" cy="9" r="4"/><path d="M8 13c1 1 2.5 2 4 2s3-1 4-2"/></>}/>,
  idCard: (p) => <Icon {...p} d={<><rect width="18" height="14" x="3" y="5" rx="2"/><circle cx="9" cy="11" r="2"/><line x1="15" x2="19" y1="10" y2="10"/><line x1="15" x2="19" y1="14" y2="14"/></>}/>,
  logo: ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path d="M16 2 L28 9 V23 L16 30 L4 23 V9 Z" fill="#0EA5E9"/>
      <path d="M11 10 v12 M11 16 L19 10 M11 16 L19 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
};

// ─── Data ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: "plomberie",    label: "Plomberie",    icon: I.wrench,     tint: "#0D9488", tintBg: "#CCFBF1", count: 342 },
  { slug: "electricite",  label: "Électricité",  icon: I.zap,        tint: "#D97706", tintBg: "#FEF3C7", count: 218 },
  { slug: "menage",       label: "Ménage",       icon: I.sparkles,   tint: "#E11D48", tintBg: "#FFE4E6", count: 497 },
  { slug: "coiffure",     label: "Coiffure",     icon: I.scissors,   tint: "#BE185D", tintBg: "#FCE7F3", count: 286 },
  { slug: "informatique", label: "Informatique", icon: I.laptop,     tint: "#7C3AED", tintBg: "#EDE9FE", count: 164 },
  { slug: "jardinage",    label: "Jardinage",    icon: I.leaf,       tint: "#059669", tintBg: "#D1FAE5", count: 129 },
  { slug: "peinture",     label: "Peinture",     icon: I.paintbrush, tint: "#2563EB", tintBg: "#DBEAFE", count: 87 },
  { slug: "transport",    label: "Transport",    icon: I.car,        tint: "#475569", tintBg: "#E2E8F0", count: 203 },
  { slug: "menuiserie",   label: "Menuiserie",   icon: I.hammer,     tint: "#B45309", tintBg: "#FEF3C7", count: 94 },
];

const PROVIDERS = [
  {
    id: "p1", firstName: "Jean", lastName: "Mubake", initials: "JM",
    profession: "Plombier certifié",
    city: "Kinshasa", commune: "Gombe",
    avatarBg: "#0EA5E9",
    rating: 4.9, reviews: 127, jobs: 284, years: 8,
    verified: true, trust: "EXPERT", topRated: true, premium: true,
    response: "15 min", hourly: 15000,
    categories: ["plomberie"],
    distance: 2.3,
    quote: "« Très professionnel, travail propre et rapide. Je recommande sans hésiter. »",
    quoteAuthor: "Marie K.",
    categoryRatings: [{c:"punctuality",s:5},{c:"quality",s:5},{c:"communication",s:5},{c:"value",s:4},{c:"professionalism",s:5}],
    skills: ["Fuites d'eau", "Chauffe-eau", "Installation sanitaire", "Débouchage", "Canalisations"],
    bio: "Plombier depuis 2018, formé à l'INPP Kinshasa. J'interviens dans tout Kinshasa pour les dépannages et installations. Devis gratuit, intervention sous 2h.",
    online: true,
  },
  {
    id: "p2", firstName: "Grâce", lastName: "Tshilumba", initials: "GT",
    profession: "Électricienne", city: "Kinshasa", commune: "Lemba",
    avatarBg: "#FB7185",
    rating: 4.8, reviews: 89, jobs: 156, years: 5,
    verified: true, trust: "TRUSTED", topRated: false, premium: false,
    response: "1h", hourly: 12000,
    categories: ["electricite"], distance: 4.1,
    quote: "« Interventions rapides, toujours de bon conseil. Prix correct. »",
    quoteAuthor: "Papa Léon",
    categoryRatings: [{c:"punctuality",s:5},{c:"quality",s:5},{c:"communication",s:4},{c:"value",s:5},{c:"professionalism",s:5}],
    skills: ["Tableaux électriques", "Dépannage", "Mise aux normes"],
    bio: "Installations et dépannage électrique résidentiel. 5 ans d'expérience, certifiée SNEL.",
    online: true,
  },
  {
    id: "p3", firstName: "Patrick", lastName: "Nzeba", initials: "PN",
    profession: "Peintre en bâtiment", city: "Brazzaville", commune: "Poto-Poto",
    avatarBg: "#10B981",
    rating: 4.7, reviews: 64, jobs: 98, years: 12,
    verified: true, trust: "TRUSTED", topRated: true, premium: false,
    response: "3h", hourly: 8000,
    categories: ["peinture"], distance: 6.8,
    quote: "« Résultat impeccable, il a pris soin des meubles. »",
    quoteAuthor: "Christelle M.",
    categoryRatings: [{c:"punctuality",s:4},{c:"quality",s:5},{c:"communication",s:5},{c:"value",s:5},{c:"professionalism",s:5}],
    skills: ["Intérieur", "Façade", "Décoratif"],
    bio: "12 ans à embellir les maisons de Brazzaville.",
    online: false,
  },
  {
    id: "p4", firstName: "Lucie", lastName: "Kabasele", initials: "LK",
    profession: "Coiffeuse à domicile", city: "Lubumbashi", commune: "Kamalondo",
    avatarBg: "#F59E0B",
    rating: 4.9, reviews: 203, jobs: 412, years: 7,
    verified: true, trust: "EXPERT", topRated: true, premium: true,
    response: "20 min", hourly: 10000,
    categories: ["coiffure"], distance: 1.2,
    quote: "« Douce, créative, et toujours à l'heure. Ma go-to. »",
    quoteAuthor: "Esther B.",
    categoryRatings: [{c:"punctuality",s:5},{c:"quality",s:5},{c:"communication",s:5},{c:"value",s:5},{c:"professionalism",s:5}],
    skills: ["Tresses", "Coloration", "Mariages", "Enfants"],
    bio: "Coiffeuse à domicile, spécialisée en tresses protectrices et événementiel.",
    online: true,
  },
  {
    id: "p5", firstName: "Samuel", lastName: "Okito", initials: "SO",
    profession: "Technicien informatique", city: "Kinshasa", commune: "Limete",
    avatarBg: "#4F46E5",
    rating: 4.6, reviews: 41, jobs: 73, years: 3,
    verified: true, trust: "ESTABLISHED", topRated: false, premium: false,
    response: "2h", hourly: 20000,
    categories: ["informatique"], distance: 3.7,
    quote: "« Il a sauvé toutes mes données, merci ! »",
    quoteAuthor: "Ingrid L.",
    categoryRatings: [{c:"punctuality",s:4},{c:"quality",s:5},{c:"communication",s:5},{c:"value",s:4},{c:"professionalism",s:5}],
    skills: ["Réparation PC", "Récupération données", "Réseau"],
    bio: "Technicien informatique certifié CompTIA A+.",
    online: true,
  },
  {
    id: "p6", firstName: "Bernadette", lastName: "Mupenda", initials: "BM",
    profession: "Agent de ménage", city: "Pointe-Noire", commune: "Tié-Tié",
    avatarBg: "#BE185D",
    rating: 4.8, reviews: 156, jobs: 289, years: 6,
    verified: true, trust: "TRUSTED", topRated: false, premium: false,
    response: "30 min", hourly: 5000,
    categories: ["menage"], distance: 2.9,
    quote: "« Très consciencieuse, maison toujours impeccable. »",
    quoteAuthor: "Famille Mabiala",
    categoryRatings: [{c:"punctuality",s:5},{c:"quality",s:5},{c:"communication",s:4},{c:"value",s:5},{c:"professionalism",s:5}],
    skills: ["Ménage régulier", "Grand nettoyage", "Repassage"],
    bio: "Je prends soin de vos intérieurs avec rigueur et discrétion.",
    online: true,
  },
];

// ─── Primitives ──────────────────────────────────────────────────────────────
function Avatar({ name, bg = "#0EA5E9", size = 56, initials, online, ring }) {
  const style = {
    width: size, height: size, borderRadius: "50%",
    background: bg, color: "white", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontFamily: "var(--k-font-display)", fontWeight: 600,
    fontSize: size * 0.38, letterSpacing: "-0.02em",
    flexShrink: 0, position: "relative",
    boxShadow: ring ? "0 0 0 2px white, 0 0 0 4px var(--k-primary)" : "0 0 0 2px white",
  };
  return (
    <div style={style} aria-label={name}>
      {initials || (name || "").split(" ").map(p => p[0]).join("").slice(0,2)}
      {online && (
        <span style={{
          position: "absolute", bottom: 0, right: 0, width: size*0.24, height: size*0.24,
          borderRadius: "50%", background: "var(--k-success)",
          boxShadow: "0 0 0 2px white",
        }}/>
      )}
    </div>
  );
}

function StarRating({ value, count, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--k-warning)" }}>
      <I.star size={size}/>
      <span className="k-num" style={{ color: "var(--k-text-primary)", fontWeight: 600, fontSize: size + 0 }}>
        {value.toFixed(1)}
      </span>
      {count != null && (
        <span className="k-num" style={{ color: "var(--k-text-muted)", fontWeight: 400, fontSize: size - 1 }}>
          ({count})
        </span>
      )}
    </span>
  );
}

function TrustChip({ trust }) {
  if (trust === "EXPERT") return <span className="k-chip k-chip-sm k-chip-expert"><I.shieldCheck size={12}/> Expert</span>;
  if (trust === "TRUSTED") return <span className="k-chip k-chip-sm k-chip-success"><I.badgeCheck size={12}/> De confiance</span>;
  if (trust === "ESTABLISHED") return <span className="k-chip k-chip-sm">Établi</span>;
  if (trust === "NEWCOMER") return <span className="k-chip k-chip-sm">Nouveau</span>;
  return null;
}

function TopRatedRibbon() {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, width: 88, height: 88, overflow: "hidden",
      pointerEvents: "none", borderTopLeftRadius: "inherit",
    }}>
      <div style={{
        position: "absolute", top: 14, left: -24, width: 120, transform: "rotate(-45deg)",
        background: "linear-gradient(90deg, #F59E0B, #FBBF24)", color: "white",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textAlign: "center",
        padding: "4px 0", textTransform: "uppercase",
        boxShadow: "0 2px 6px rgba(245,158,11,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
      }}>
        <I.award size={10}/> Top Rated
      </div>
    </div>
  );
}

function CategoryTile({ cat, onClick, size = "md" }) {
  const IconC = cat.icon;
  const isLg = size === "lg";
  return (
    <button onClick={onClick} style={{
      background: "var(--k-surface)", border: "1px solid var(--k-border)",
      borderRadius: "var(--k-r-md)", padding: isLg ? 20 : 16,
      display: "flex", flexDirection: "column", gap: isLg ? 16 : 12,
      alignItems: "flex-start", cursor: "pointer",
      transition: "transform 160ms var(--k-ease-std), box-shadow 160ms var(--k-ease-std)",
      textAlign: "left", width: "100%",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--k-e2)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{
        width: isLg ? 48 : 40, height: isLg ? 48 : 40, borderRadius: 10,
        background: cat.tintBg, color: cat.tint,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IconC size={isLg ? 24 : 20}/>
      </div>
      <div>
        <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: isLg ? 17 : 15, color: "var(--k-text-primary)" }}>
          {cat.label}
        </div>
        <div className="k-caption k-num" style={{ marginTop: 2 }}>{cat.count} pros</div>
      </div>
    </button>
  );
}

// Provider card — canonical component
function ProviderCard({ p, onClick, compact = false, favorited, onFavorite }) {
  return (
    <article
      onClick={onClick}
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-border)",
        borderRadius: "var(--k-r-md)",
        boxShadow: "var(--k-e1)",
        padding: compact ? 16 : 20,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        transition: "transform 160ms var(--k-ease-std), box-shadow 160ms var(--k-ease-std)",
        borderTop: p.premium ? "2px solid var(--k-primary)" : undefined,
      }}
      onMouseEnter={e => { if(onClick){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="var(--k-e2)"; }}}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
    >
      {p.topRated && <TopRatedRibbon/>}

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ position: "relative" }}>
          <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={56} initials={p.initials} online={p.online}/>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 18, color: "var(--k-text-primary)" }}>
              {p.firstName} {p.lastName}
            </span>
            {p.verified && <span style={{ color: "var(--k-success)", display: "inline-flex" }}><I.badgeCheck size={16}/></span>}
            <span style={{ marginLeft: "auto" }}>
              <StarRating value={p.rating} count={p.reviews}/>
            </span>
          </div>
          <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 2 }}>
            {p.profession} · {p.city}{p.commune ? `, ${p.commune}` : ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, color: p.response.includes("min") ? "var(--k-success)" : "var(--k-text-muted)" }}>
            <I.clock size={13}/>
            <span className="k-caption" style={{ color: "inherit" }}>Réponse en ~{p.response}</span>
          </div>
        </div>

        {onFavorite && (
          <button onClick={(e) => { e.stopPropagation(); onFavorite(p.id); }}
            aria-label="Favori"
            style={{
              border: 0, background: "transparent", cursor: "pointer", padding: 6,
              color: favorited ? "var(--k-accent)" : "var(--k-text-subtle)",
            }}>
            <I.heart size={20} fill={favorited ? "currentColor" : "none"}/>
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
        {p.verified && <TrustChip trust={p.trust}/>}
        <span className="k-chip k-chip-sm"><I.award size={12}/> {p.years} ans</span>
        {p.distance != null && <span className="k-chip k-chip-sm"><I.mapPin size={12}/> {p.distance} km</span>}
      </div>

      {!compact && p.quote && (
        <p className="k-body" style={{ color: "var(--k-text-body)", marginTop: 14, marginBottom: 0,
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>
          {p.quote}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--k-border-subtle)" }}>
        <div>
          <div className="k-caption" style={{ marginBottom: 2 }}>À partir de</div>
          <div className="k-price" style={{ fontSize: 17, color: "var(--k-text-primary)" }}>
            {p.hourly.toLocaleString("fr-FR")} FC<span style={{ color: "var(--k-text-muted)", fontWeight: 400 }}>/h</span>
          </div>
        </div>
        <button className="k-btn k-btn-secondary k-btn-sm">
          Contacter <I.arrowRight size={14}/>
        </button>
      </div>
    </article>
  );
}

Object.assign(window, {
  I, Icon,
  CATEGORIES, PROVIDERS,
  Avatar, StarRating, TrustChip, TopRatedRibbon, CategoryTile, ProviderCard,
});
