// Search results page — web (map + list + filters) and mobile (list + filter sheet)
function SearchPage({ nav, mobile }) {
  const [filters, setFilters] = React.useState({ verified: false, available: false, distance: 20, category: null });
  const [sort, setSort] = React.useState("pertinence");
  const [hoveredId, setHoveredId] = React.useState(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const providers = PROVIDERS.filter(p => !filters.category || p.categories.includes(filters.category));

  if (mobile) {
    return <MobileSearch nav={nav}/>;
  }

  // WEB
  return (
    <div style={{ background: "var(--k-bg)", minHeight: "100%" }}>
      <WebHeader nav={nav}/>
      {/* Thin search strip */}
      <div style={{ background: "var(--k-surface)", borderBottom: "1px solid var(--k-border)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 32px", display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: "10px 14px", flex: 1.2 }}>
            <I.search size={16} color="var(--k-text-muted)"/>
            <input defaultValue="Plombier" style={{ border: 0, outline: 0, flex: 1, fontSize: 14 }}/>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: "10px 14px", flex: 1 }}>
            <I.mapPin size={16} color="var(--k-text-muted)"/>
            <input defaultValue="Kinshasa, Gombe" style={{ border: 0, outline: 0, flex: 1, fontSize: 14 }}/>
          </div>
          <button className="k-btn k-btn-primary">Rechercher</button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px", display: "grid", gridTemplateColumns: "260px 1fr 440px", gap: 24 }}>
        {/* FILTERS */}
        <aside style={{ position: "sticky", top: 80, alignSelf: "start", maxHeight: "calc(100vh - 100px)", overflow: "auto" }} className="k-scroll">
          <FilterPanel filters={filters} setFilters={setFilters}/>
        </aside>

        {/* LIST */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div>
              <h1 className="k-display-m" style={{ margin: 0 }}>Plombiers à Kinshasa</h1>
              <div className="k-body-m" style={{ color: "var(--k-text-muted)", marginTop: 4 }}>
                <b className="k-num" style={{ color: "var(--k-text-primary)" }}>{providers.length}</b> pros · mis à jour il y a 2 min
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="k-caption">Trier par</span>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{
                border: "1px solid var(--k-border)", borderRadius: "var(--k-r-sm)", padding: "6px 10px",
                background: "var(--k-surface)", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>
                <option value="pertinence">Pertinence</option>
                <option value="note">Note</option>
                <option value="distance">Distance</option>
                <option value="prix">Prix</option>
              </select>
            </div>
          </div>

          {/* quick pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <FilterPill active={filters.available} onClick={() => setFilters(f => ({...f, available: !f.available}))}><I.check size={13}/> Disponible maintenant</FilterPill>
            <FilterPill active={filters.verified} onClick={() => setFilters(f => ({...f, verified: !f.verified}))}><I.badgeCheck size={13}/> Vérifié</FilterPill>
            <FilterPill>{`< 20 km`}</FilterPill>
            <FilterPill>Top rated</FilterPill>
            <FilterPill><I.award size={13}/> Expert</FilterPill>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {providers.map(p => (
              <div key={p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}>
                <ProviderCard p={p} onClick={() => nav("profile", p.id)}/>
              </div>
            ))}
          </div>
        </div>

        {/* MAP */}
        <aside style={{ position: "sticky", top: 80, alignSelf: "start", height: "calc(100vh - 100px)" }}>
          <MapPanel providers={providers} hoveredId={hoveredId} onClickPin={id => nav("profile", id)}/>
        </aside>
      </div>
    </div>
  );
}

function FilterPill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      height: 34, padding: "0 14px", borderRadius: 999,
      border: `1px solid ${active ? "var(--k-primary)" : "var(--k-border)"}`,
      background: active ? "var(--k-primary-subtle)" : "var(--k-surface)",
      color: active ? "var(--k-primary-hover)" : "var(--k-text-body)",
      fontSize: 13, fontWeight: 500, cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
      flexShrink: 0,
    }}>
      {children}
    </button>
  );
}

function FilterPanel({ filters, setFilters }) {
  return (
    <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-md)", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
        <h3 className="k-heading" style={{margin:0}}>Filtres</h3>
        <button className="k-btn k-btn-ghost k-btn-sm" style={{padding:0}}>Effacer</button>
      </div>

      <FilterSection title="Catégorie">
        <div style={{ display: "grid", gap: 6 }}>
          {CATEGORIES.slice(0, 6).map(c => (
            <label key={c.slug} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={filters.category === c.slug}
                onChange={() => setFilters(f => ({...f, category: f.category === c.slug ? null : c.slug}))}/>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: c.tintBg, color: c.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <c.icon size={14}/>
              </span>
              <span style={{ flex: 1 }}>{c.label}</span>
              <span className="k-caption k-num">{c.count}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Prix horaire">
        <div className="k-caption k-num" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span>3 000 FC</span><span>30 000 FC</span>
        </div>
        <div style={{ position: "relative", height: 28, padding: "10px 0" }}>
          <div style={{ height: 4, borderRadius: 2, background: "var(--k-border)" }}/>
          <div style={{ position: "absolute", top: 10, left: "20%", right: "30%", height: 4, borderRadius: 2, background: "var(--k-primary)" }}/>
          {[20, 70].map((v, i) => (
            <div key={i} style={{ position: "absolute", top: 5, left: `calc(${v}% - 7px)`, width: 14, height: 14, borderRadius: "50%", background: "white", border: "2px solid var(--k-primary)", cursor: "grab" }}/>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Note minimum">
        <div style={{ display: "flex", gap: 6 }}>
          {[5, 4, 3].map(n => (
            <button key={n} style={{
              border: "1px solid var(--k-border)", borderRadius: 999, background: "var(--k-surface)",
              padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              fontSize: 13, fontWeight: 500,
            }}>
              <I.star size={12} color="var(--k-warning)"/> {n}+
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Distance">
        <div className="k-caption k-num" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span>0 km</span><span>&lt; {filters.distance} km</span>
        </div>
        <input type="range" min={1} max={50} value={filters.distance}
          onChange={e => setFilters(f => ({...f, distance: +e.target.value}))}
          style={{ width: "100%", accentColor: "var(--k-primary)" }}/>
      </FilterSection>

      <FilterSection title="Disponibilité">
        <Toggle label="Disponible maintenant" value={filters.available} onChange={v => setFilters(f => ({...f, available: v}))}/>
        <Toggle label="Répond en < 30 min" value={false}/>
        <Toggle label="Accepte le week-end" value={false}/>
      </FilterSection>

      <FilterSection title="Confiance" last>
        <Toggle label="Vérifié" value={filters.verified} onChange={v => setFilters(f => ({...f, verified: v}))}/>
        <Toggle label="Top rated" value={false}/>
        <Toggle label="Expert" value={false}/>
      </FilterSection>
    </div>
  );
}

function FilterSection({ title, children, last }) {
  return (
    <div style={{ paddingBottom: last ? 0 : 20, marginBottom: last ? 0 : 20, borderBottom: last ? 0 : "1px solid var(--k-border-subtle)" }}>
      <div className="k-overline" style={{ marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", fontSize: 14, cursor: "pointer" }}>
      <span>{label}</span>
      <button onClick={(e) => { e.preventDefault(); onChange && onChange(!value); }} style={{
        width: 36, height: 20, borderRadius: 999, border: 0,
        background: value ? "var(--k-primary)" : "var(--k-border)",
        position: "relative", cursor: "pointer", transition: "background 160ms",
      }}>
        <span style={{ position: "absolute", top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 160ms", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}/>
      </button>
    </label>
  );
}

function MapPanel({ providers, hoveredId, onClickPin }) {
  // Stylized map — no real tiles, just a hand-crafted abstraction of Kinshasa
  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      borderRadius: "var(--k-r-md)", overflow: "hidden",
      border: "1px solid var(--k-border)", boxShadow: "var(--k-e1)",
      background: "#F0F9FF",
    }}>
      <svg viewBox="0 0 440 800" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" stroke="#E0F2FE" strokeWidth="1" fill="none"/>
          </pattern>
        </defs>
        <rect width="440" height="800" fill="#F0F9FF"/>
        <rect width="440" height="800" fill="url(#mapGrid)"/>
        {/* River (Congo) */}
        <path d="M -20 420 Q 80 390 160 440 T 320 480 T 480 430" stroke="#BAE6FD" strokeWidth="64" fill="none" strokeLinecap="round"/>
        <path d="M -20 420 Q 80 390 160 440 T 320 480 T 480 430" stroke="#7DD3FC" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
        {/* Roads */}
        <path d="M 40 80 L 200 200 L 240 360 L 180 520 L 220 700" stroke="#CBD5E1" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 400 60 L 320 180 L 280 340 L 300 520 L 360 720" stroke="#CBD5E1" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 20 220 Q 220 240 420 240" stroke="#CBD5E1" strokeWidth="2" fill="none"/>
        <path d="M 20 340 Q 220 320 420 360" stroke="#CBD5E1" strokeWidth="2" fill="none"/>
        <path d="M 20 620 Q 220 640 420 600" stroke="#CBD5E1" strokeWidth="2" fill="none"/>
        {/* Parks / green spots */}
        <ellipse cx="110" cy="270" rx="50" ry="32" fill="#DCFCE7" opacity="0.7"/>
        <ellipse cx="340" cy="580" rx="44" ry="38" fill="#DCFCE7" opacity="0.7"/>
        {/* Area labels */}
        <text x="100" y="170" fontFamily="var(--k-font-body)" fontSize="11" fill="#94A3B8" fontWeight="500">GOMBE</text>
        <text x="320" y="280" fontFamily="var(--k-font-body)" fontSize="11" fill="#94A3B8" fontWeight="500">LIMETE</text>
        <text x="90" y="560" fontFamily="var(--k-font-body)" fontSize="11" fill="#94A3B8" fontWeight="500">LEMBA</text>
        <text x="300" y="700" fontFamily="var(--k-font-body)" fontSize="11" fill="#94A3B8" fontWeight="500">NGABA</text>
      </svg>

      {/* Pins */}
      {providers.slice(0, 6).map((p, i) => {
        const positions = [
          { x: 30, y: 22 }, { x: 65, y: 35 }, { x: 42, y: 55 },
          { x: 72, y: 62 }, { x: 25, y: 70 }, { x: 55, y: 80 },
        ];
        const pos = positions[i] || { x: 50, y: 50 };
        const isHovered = hoveredId === p.id;
        return (
          <button key={p.id} onClick={() => onClickPin(p.id)} style={{
            position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`,
            transform: `translate(-50%, -100%) scale(${isHovered ? 1.15 : 1})`,
            transition: "transform 200ms var(--k-ease-bounce)",
            border: 0, background: "transparent", cursor: "pointer", padding: 0,
            zIndex: isHovered ? 10 : 1,
          }}>
            <div style={{
              background: isHovered ? "var(--k-primary)" : "white",
              color: isHovered ? "white" : "var(--k-text-primary)",
              border: `2px solid ${isHovered ? "var(--k-primary)" : "var(--k-border-strong)"}`,
              borderRadius: 999, padding: "4px 10px 4px 4px",
              boxShadow: isHovered ? "var(--k-e3)" : "var(--k-e1)",
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
              fontSize: 13, fontWeight: 600,
            }}>
              <Avatar name={`${p.firstName} ${p.lastName}`} bg={p.avatarBg} size={22} initials={p.initials}/>
              <span className="k-price" style={{ fontSize: 13 }}>{(p.hourly / 1000).toFixed(0)}k</span>
            </div>
            <div style={{
              width: 10, height: 10, background: isHovered ? "var(--k-primary)" : "white",
              border: `2px solid ${isHovered ? "var(--k-primary)" : "var(--k-border-strong)"}`,
              transform: "rotate(45deg) translate(-50%, 0)",
              marginLeft: "50%", marginTop: -5, position: "relative",
            }}/>
          </button>
        );
      })}

      {/* Zoom controls */}
      <div style={{ position: "absolute", right: 12, top: 12, display: "flex", flexDirection: "column", background: "white", borderRadius: 8, overflow: "hidden", boxShadow: "var(--k-e2)" }}>
        <button style={zoomBtn}><I.plus size={16}/></button>
        <div style={{ height: 1, background: "var(--k-border)" }}/>
        <button style={zoomBtn}>–</button>
      </div>
      <div style={{
        position: "absolute", left: 12, bottom: 12,
        background: "white", border: "1px solid var(--k-border)", borderRadius: 999,
        padding: "6px 12px", fontSize: 12, fontWeight: 500, color: "var(--k-text-muted)",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <I.mapPin size={12}/> Kinshasa
      </div>
    </div>
  );
}
const zoomBtn = { border: 0, background: "transparent", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--k-text-body)" };

function MobileFilterSheet({ filters, setFilters, onClose }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", flexDirection: "column", background: "rgba(15,23,42,0.4)" }} onClick={onClose}>
      <div style={{ flex: 1 }}/>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--k-bg)", borderRadius: "var(--k-r-xl) var(--k-r-xl) 0 0",
        padding: "14px 20px 24px", maxHeight: "82%", overflow: "auto",
      }} className="k-scroll">
        <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--k-border-strong)", margin: "0 auto 16px" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 className="k-heading" style={{margin:0}}>Filtres</h3>
          <button onClick={onClose} style={{ border:0, background:"transparent", padding:4 }}><I.x size={22}/></button>
        </div>
        <FilterPanel filters={filters} setFilters={setFilters}/>
        <button className="k-btn k-btn-primary" style={{ width: "100%", height: 48, marginTop: 16 }} onClick={onClose}>
          Voir {PROVIDERS.length} résultats
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { SearchPage });

// ─── Airbnb-style mobile search ──────────────────────────────────────────
function MobileSearch({ nav }) {
  const [filters, setFilters] = React.useState({ verified: false, available: false, distance: 20, category: null });
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [view, setView] = React.useState("list");
  const [favs, setFavs] = React.useState({});
  const providers = PROVIDERS.filter(p => !filters.category || p.categories.includes(filters.category));
  const toggleFav = (id) => setFavs(f => ({ ...f, [id]: !f[id] }));

  return (
    <div style={{ background: "var(--k-bg)", minHeight: "100%", paddingBottom: 110 }}>
      {/* Sticky compact search header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--k-bg)", paddingTop: 10 }}>
        <div style={{ padding: "4px 16px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => nav("home")} style={msIconBtn}><I.arrowLeft size={18}/></button>
          <button onClick={() => nav("home")} style={{
            flex: 1, display: "flex", alignItems: "center", gap: 10,
            padding: "10px 16px", border: 0,
            background: "white", borderRadius: 999, cursor: "pointer",
            boxShadow: "0 8px 22px -10px rgba(15,23,42,0.2), 0 2px 5px -2px rgba(15,23,42,0.08)",
          }}>
            <I.search size={16} color="var(--k-text-primary)"/>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--k-text-primary)" }}>Plombier</div>
              <div className="k-caption" style={{ marginTop: 1 }}>Kinshasa · {providers.length} pros</div>
            </div>
          </button>
          <button onClick={() => setSheetOpen(true)} style={msIconBtn}><I.sliders size={18}/></button>
        </div>

        {/* Category strip */}
        <CategoryStrip nav={(s, slug) => setFilters(f => ({ ...f, category: f.category === slug ? null : slug }))}
          active={filters.category}/>

        {/* Filter chips */}
        <div className="k-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 12px" }}>
          <FilterPill active={filters.available} onClick={() => setFilters(f => ({...f, available: !f.available}))}>Disponible</FilterPill>
          <FilterPill active={filters.verified} onClick={() => setFilters(f => ({...f, verified: !f.verified}))}>Vérifié</FilterPill>
          <FilterPill>{`< 20 km`}</FilterPill>
          <FilterPill>Top rated</FilterPill>
          <FilterPill><I.award size={12}/> Expert</FilterPill>
        </div>
      </div>

      {/* Result summary + list/map toggle */}
      <div style={{ padding: "6px 20px 14px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 19, margin: 0, letterSpacing: "-0.02em" }}>
          {providers.length} pros disponibles
        </h2>
        <button className="k-btn k-btn-ghost k-btn-sm" style={{ padding: 0 }}>
          Trier <I.chevronDown size={13}/>
        </button>
      </div>

      {view === "list" ? (
        <div style={{ padding: "0 20px", display: "grid", gap: 16 }}>
          {providers.map(p => (
            <WideProviderCard key={p.id} p={p}
              onClick={() => nav("profile", p.id)}
              favorited={!!favs[p.id]}
              onFavorite={toggleFav}/>
          ))}
        </div>
      ) : (
        <div style={{ padding: "0 16px", height: 500 }}>
          <MapPanel providers={providers} hoveredId={null} onClickPin={(id) => nav("profile", id)}/>
        </div>
      )}

      {/* Floating map/list toggle — Airbnb pattern */}
      <button onClick={() => setView(v => v === "list" ? "map" : "list")} style={{
        position: "fixed", left: "50%", transform: "translateX(-50%)",
        bottom: 84, zIndex: 25,
        background: "var(--k-text-primary)", color: "white",
        border: 0, borderRadius: 999, padding: "12px 20px",
        fontFamily: "var(--k-font-body)", fontSize: 14, fontWeight: 600,
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
        boxShadow: "0 8px 20px -4px rgba(15,23,42,0.3)",
      }}>
        {view === "list" ? <><I.mapPin size={16}/> Carte</> : <><I.menu size={16}/> Liste</>}
      </button>

      {sheetOpen && <MobileFilterSheet filters={filters} setFilters={setFilters} onClose={() => setSheetOpen(false)}/>}
    </div>
  );
}

const msIconBtn = { width: 40, height: 40, borderRadius: "50%", background: "white", border: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--k-text-primary)", flexShrink: 0, boxShadow: "0 4px 12px -4px rgba(15,23,42,0.16), 0 1px 3px -1px rgba(15,23,42,0.06)" };

Object.assign(window, { MobileSearch });
