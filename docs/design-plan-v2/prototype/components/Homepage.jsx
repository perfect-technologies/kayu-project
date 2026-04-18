// Homepage — web + mobile side by side
function Homepage({ nav, mobile }) {
  const [query, setQuery] = React.useState("");
  const [where, setWhere] = React.useState("Kinshasa");

  const featured = PROVIDERS.slice(0, 3);

  if (mobile) {
    return <MobileHome nav={nav}/>;
  }

  // WEB
  return (
    <div style={{ background: "var(--k-bg)", minHeight: "100%" }}>
      <WebHeader nav={nav}/>

      {/* HERO — radial tint */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 18% 30%, rgba(14,165,233,0.09), transparent 50%), radial-gradient(circle at 82% 70%, rgba(251,113,133,0.06), transparent 48%)", pointerEvents:"none" }}/>

        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 40px 64px", position: "relative" }}>
          <div style={{ maxWidth: 820 }}>
            <div className="k-overline" style={{ marginBottom: 18, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px 6px 8px", borderRadius: 999, background: "var(--k-surface)", border: "1px solid var(--k-border)" }}>
              <span style={{ background: "var(--k-success)", color: "white", borderRadius: 999, padding: "2px 8px", fontSize: 10 }}>NOUVEAU</span>
              Marketplace #1 de services au Congo
            </div>
            <h1 className="k-display-xl" style={{ margin: "0 0 18px" }}>
              Le bon pro,<br/>
              <span style={{
                background: "linear-gradient(100deg, #0EA5E9 0%, #0EA5E9 40%, #FB7185 90%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>près de chez toi.</span>
            </h1>
            <p className="k-body-l" style={{ color: "var(--k-text-body)", maxWidth: 580, margin: "0 0 34px" }}>
              2 400 pros vérifiés à Kinshasa, Brazzaville, Lubumbashi, Matadi, Pointe-Noire.
              Plombiers, électriciens, coiffeurs, ménage… Réserve en quelques clics.
            </p>

            {/* Search — inline, oversized */}
            <div className="k-card" style={{ padding: 8, boxShadow: "var(--k-e2)", display: "flex", alignItems: "center", gap: 0, borderRadius: "var(--k-r-lg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", flex: 1.2 }}>
                <I.search size={20} color="var(--k-text-muted)"/>
                <div style={{flex:1}}>
                  <div className="k-caption" style={{fontWeight:600, color:"var(--k-text-primary)", marginBottom:2}}>Quel service ?</div>
                  <input placeholder="Plomberie, coiffure, ménage…" value={query} onChange={e=>setQuery(e.target.value)}
                    style={{ border:0, outline:0, width:"100%", background:"transparent", fontSize: 15, color:"var(--k-text-body)" }}/>
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: "var(--k-border)" }}/>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", flex: 1 }}>
                <I.mapPin size={20} color="var(--k-text-muted)"/>
                <div style={{flex:1}}>
                  <div className="k-caption" style={{fontWeight:600, color:"var(--k-text-primary)", marginBottom:2}}>Où ?</div>
                  <input value={where} onChange={e=>setWhere(e.target.value)}
                    style={{ border:0, outline:0, width:"100%", background:"transparent", fontSize: 15, color:"var(--k-text-body)" }}/>
                </div>
              </div>
              <button className="k-btn k-btn-primary" style={{ height: 56, padding: "0 28px", fontSize: 16 }}
                onClick={() => nav("search")}>
                <I.search size={18}/> Rechercher
              </button>
            </div>

            {/* trust strip */}
            <div style={{ display: "flex", gap: 32, marginTop: 22, color: "var(--k-text-muted)", flexWrap: "wrap" }}>
              <div style={{display:"flex", gap:8, alignItems:"center"}}><I.badgeCheck size={16} color="var(--k-success)"/><span className="k-body-m"><b className="k-num" style={{color:"var(--k-text-primary)"}}>2 400</b> pros vérifiés</span></div>
              <div style={{display:"flex", gap:8, alignItems:"center"}}><I.star size={16} color="var(--k-warning)"/><span className="k-body-m"><b className="k-num" style={{color:"var(--k-text-primary)"}}>4.8</b> moyenne</span></div>
              <div style={{display:"flex", gap:8, alignItems:"center"}}><I.clock size={16} color="var(--k-primary)"/><span className="k-body-m">Réponse en <b className="k-num" style={{color:"var(--k-text-primary)"}}>~1h</b></span></div>
            </div>
          </div>

          {/* Asymmetric floating cards */}
          <FloatingProofCluster/>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 40px 40px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="k-display-m">Trouve ton métier</h2>
          <button className="k-btn k-btn-ghost">Toutes les catégories <I.arrowRight size={14}/></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
          {CATEGORIES.slice(0, 6).map(c =>
            <CategoryTile key={c.slug} cat={c} size="lg" onClick={() => nav("search")}/>
          )}
        </div>
      </section>

      {/* FEATURED */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 40px 40px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div className="k-overline" style={{ color: "var(--k-accent)", marginBottom: 6 }}>Top rated cette semaine</div>
            <h2 className="k-display-m">Pros vérifiés à Kinshasa</h2>
          </div>
          <button className="k-btn k-btn-ghost">Voir tous les pros <I.arrowRight size={14}/></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {featured.map(p => <ProviderCard key={p.id} p={p} onClick={() => nav("profile", p.id)}/>)}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 40px" }}>
        <h2 className="k-display-m" style={{ marginBottom: 32 }}>Comment ça marche</h2>
        <HowItWorks/>
      </section>

      {/* PROVIDER CTA */}
      <section style={{ padding: "48px 40px 80px" }}>
        <div style={{
          maxWidth: 1240, margin: "0 auto",
          borderRadius: "var(--k-r-xl)", padding: "56px 60px",
          background: "linear-gradient(120deg, #FFF1F2 0%, #FFE4E6 60%, #FFFBEB 100%)",
          border: "1px solid #FECDD3", position: "relative", overflow: "hidden",
          display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center",
        }}>
          <div style={{ position: "absolute", right: -100, top: -80, width: 360, height: 360,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(251,113,133,0.25), transparent 70%)" }}/>
          <div style={{ position: "relative" }}>
            <div className="k-overline" style={{ color: "#BE123C", marginBottom: 12 }}>Pour les pros</div>
            <h3 className="k-display-l" style={{ margin: "0 0 14px", fontSize: 40 }}>
              Tu es un pro ?<br/>Rejoins KAYOU.
            </h3>
            <p className="k-body-l" style={{ color: "#9F1239", margin: "0 0 24px", maxWidth: 460 }}>
              Crée ton profil, reçois des demandes qualifiées, construis ta réputation.
              Zéro frais d'inscription.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button className="k-btn k-btn-primary k-btn-lg">Devenir pro <I.arrowRight size={16}/></button>
              <button className="k-btn k-btn-ghost k-btn-lg">En savoir plus</button>
            </div>
          </div>

          {/* mini provider earnings card */}
          <div style={{ position: "relative", display: "flex", justifyContent: "flex-end" }}>
            <div className="k-card" style={{ padding: 20, width: 280, boxShadow: "var(--k-e3)" }}>
              <div className="k-caption">Revenus ce mois</div>
              <div style={{ fontFamily: "var(--k-font-mono)", fontWeight: 600, fontSize: 32, marginTop: 4 }}>
                842 500 <span style={{ fontSize: 14, color: "var(--k-text-muted)" }}>FC</span>
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center", color: "var(--k-success)", marginTop: 4 }}>
                <span style={{fontSize:14, fontWeight:600}}>↑ +23%</span>
                <span className="k-caption" style={{color:"var(--k-text-muted)"}}>vs mois dernier</span>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 18, alignItems: "flex-end", height: 56 }}>
                {[32, 48, 38, 56, 42, 64, 72].map((h, i) =>
                  <div key={i} style={{ flex: 1, height: h, background: i === 6 ? "var(--k-primary)" : "var(--k-primary-subtle)", borderRadius: 4 }}/>
                )}
              </div>
              <div className="k-caption" style={{marginTop:8}}>7 derniers jours</div>
            </div>
          </div>
        </div>
      </section>

      <WebFooter/>
    </div>
  );
}

function FloatingProofCluster() {
  // Three small cards arranged aysmmetrically to the right
  return (
    <div style={{ position: "absolute", right: 40, top: 100, width: 380, pointerEvents: "none", display: "none" }}/>
  );
}

function HowItWorks({ mobile }) {
  const steps = [
    { n: "01", title: "Dis-nous ce dont tu as besoin", desc: "Décris ton projet en une phrase. Ajoute photos et adresse si tu veux.", icon: I.search },
    { n: "02", title: "Compare les pros qui répondent", desc: "Certifications, avis, prix — tout est transparent. Choisis celui qui te parle.", icon: I.badgeCheck },
    { n: "03", title: "Réserve et paye en toute sécurité", desc: "Confirme la date, discute via KAYOU, paye quand le travail est fait.", icon: I.check },
  ];
  if (mobile) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {steps.map((s) => (
          <div key={s.n} className="k-card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ fontFamily:"var(--k-font-mono)", fontWeight:600, fontSize:24, color:"var(--k-primary)", minWidth: 34 }}>{s.n}</div>
            <div>
              <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{s.title}</div>
              <div className="k-body" style={{color:"var(--k-text-muted)"}}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ padding: "28px 8px 0", borderTop: "2px solid var(--k-border)", position: "relative" }}>
          <div style={{ position: "absolute", top: -2, left: 0, width: i === 0 ? "100%" : "50%", height: 2, background: "var(--k-primary)" }}/>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ fontFamily:"var(--k-font-mono)", fontWeight:600, fontSize:28, color:"var(--k-primary)" }}>{s.n}</div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--k-primary-subtle)", color:"var(--k-primary)", display:"flex", alignItems:"center", justifyContent:"center"}}>
              <s.icon size={20}/>
            </div>
          </div>
          <div className="k-heading" style={{ marginBottom: 8 }}>{s.title}</div>
          <div className="k-body" style={{color:"var(--k-text-body)"}}>{s.desc}</div>
        </div>
      ))}
    </div>
  );
}

function WebHeader({ nav }) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 20,
      background: "rgba(250,250,249,0.85)",
      backdropFilter: "saturate(140%) blur(8px)",
      WebkitBackdropFilter: "saturate(140%) blur(8px)",
      borderBottom: "1px solid var(--k-border)",
    }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 40px", display: "flex", alignItems: "center", gap: 40 }}>
        <button onClick={() => nav("home")} style={{ display: "flex", alignItems: "center", gap: 10, border: 0, background: "transparent", cursor: "pointer" }}>
          <I.logo size={30}/>
          <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>KAYOU</span>
        </button>
        <nav style={{ display: "flex", gap: 28, flex: 1 }}>
          <a onClick={() => nav("search")} style={navLink}>Trouver un pro</a>
          <a style={navLink}>Catégories</a>
          <a style={navLink}>Comment ça marche</a>
          <a style={navLink}>Devenir pro</a>
        </nav>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="k-btn k-btn-ghost">Se connecter</button>
          <button className="k-btn k-btn-primary">S'inscrire</button>
        </div>
      </div>
    </header>
  );
}
const navLink = { fontSize: 14, fontWeight: 500, color: "var(--k-text-body)", cursor: "pointer", textDecoration: "none" };

function WebFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--k-border)", background: "var(--k-surface)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "48px 40px 32px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <I.logo size={28}/>
            <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 800, fontSize: 20 }}>KAYOU</span>
          </div>
          <p className="k-body" style={{ color: "var(--k-text-muted)", maxWidth: 320, margin: 0 }}>
            Trouvez la bonne personne. Kinshasa · Brazzaville · Lubumbashi · Matadi · Pointe-Noire.
          </p>
        </div>
        {[
          ["Clients", ["Trouver un pro","Catégories","Comment ça marche","Avis"]],
          ["Pros", ["Devenir pro","Tarifs","Ressources","Communauté"]],
          ["KAYOU", ["À propos","Blog","Carrières","Contact"]],
        ].map(([t, items]) => (
          <div key={t}>
            <div className="k-overline" style={{ marginBottom: 12 }}>{t}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map(i => <a key={i} style={{ ...navLink, fontSize: 14 }}>{i}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--k-border)", padding: "18px 40px", maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", color: "var(--k-text-muted)" }}>
        <span className="k-caption">© 2026 KAYOU · Tous droits réservés</span>
        <span className="k-caption">Fait à Kinshasa, avec soin.</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Homepage, WebHeader, WebFooter });

// ─── Airbnb-style mobile homepage ─────────────────────────────────────────
function MobileHome({ nav }) {
  const [favs, setFavs] = React.useState({});
  const toggleFav = (id) => setFavs(f => ({ ...f, [id]: !f[id] }));
  const featured = PROVIDERS.slice(0, 4);
  const nearby = PROVIDERS.slice(1, 5);

  // Shrinking search: track scroll
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const root = document.getElementById("mobile-root");
    if (!root) return;
    // The scrolling element is the inner absolute-positioned div
    const scroller = root.querySelector(".k-scroll");
    if (!scroller) return;
    const onScroll = () => setScrolled(scroller.scrollTop > 40);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "var(--k-bg)", minHeight: "100%", paddingBottom: 100 }}>
      {/* Sticky header — brand + search pill, shrinks on scroll */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--k-bg)",
        paddingTop: 10,
        transition: "box-shadow 240ms",
        boxShadow: scrolled ? "0 1px 0 var(--k-border-subtle)" : "none",
      }}>
        <div style={{
          padding: "4px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          height: scrolled ? 0 : 40, overflow: "hidden", opacity: scrolled ? 0 : 1,
          transition: "height 240ms var(--k-ease-std), opacity 180ms",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <I.logo size={22}/>
            <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>KAYOU</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={mhIconBtn}><I.inbox size={18}/></button>
            <button style={mhIconBtn}><I.user size={18}/></button>
          </div>
        </div>

        {/* Search pill */}
        <div style={{ padding: "8px 16px 14px" }}>
          <button onClick={() => nav("search")} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: scrolled ? "10px 16px" : "14px 18px",
            background: "white", border: 0,
            borderRadius: 999,
            boxShadow: "0 10px 28px -10px rgba(15,23,42,0.22), 0 2px 6px -2px rgba(15,23,42,0.08)",
            cursor: "pointer", transition: "padding 200ms",
          }}>
            <I.search size={18} color="var(--k-text-primary)"/>
            <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
              <div style={{ fontFamily: "var(--k-font-body)", fontWeight: 600, fontSize: 14, color: "var(--k-text-primary)" }}>
                Trouve un pro
              </div>
              {!scrolled && (
                <div className="k-caption" style={{ marginTop: 1 }}>
                  Plomberie · Coiffure · Ménage · …
                </div>
              )}
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--k-primary-subtle)", color: "var(--k-primary-hover)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <I.sliders size={15}/>
            </div>
          </button>
        </div>
      </div>

      {/* Category strip */}
      <CategoryStrip nav={nav}/>

      {/* Hero intro — only shown up high */}
      <section style={{ padding: "18px 20px 4px" }}>
        <h1 style={{
          fontFamily: "var(--k-font-display)", fontWeight: 700,
          fontSize: 26, lineHeight: 1.1, margin: 0, letterSpacing: "-0.02em",
        }}>
          Le bon pro,<br/>près de toi.
        </h1>
        <p className="k-body" style={{ color: "var(--k-text-muted)", margin: "8px 0 0" }}>
          Des pros vérifiés à Kinshasa, prêts à intervenir.
        </p>
      </section>

      {/* Featured carousel — photo-forward */}
      <section style={{ marginTop: 22 }}>
        <div style={{ padding: "0 20px 10px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 style={mhSectionTitle}>Top pros cette semaine</h2>
          <button onClick={() => nav("search")} style={mhLinkBtn}>Tout voir</button>
        </div>
        <div className="k-scroll" style={{
          display: "flex", gap: 14, overflowX: "auto",
          padding: "4px 20px 8px", scrollSnapType: "x mandatory",
        }}>
          {featured.map(p => (
            <FeaturedProviderCard key={p.id} p={p}
              onClick={() => nav("profile", p.id)}
              favorited={!!favs[p.id]}
              onFavorite={toggleFav}/>
          ))}
        </div>
      </section>

      {/* Nearby list */}
      <section style={{ marginTop: 26, padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={mhSectionTitle}>Près de toi</h2>
          <button onClick={() => nav("search")} style={mhLinkBtn}>Carte</button>
        </div>
        <div style={{
          background: "white", borderRadius: 20, overflow: "hidden",
          boxShadow: "0 8px 28px -10px rgba(15,23,42,0.14), 0 2px 6px -2px rgba(15,23,42,0.05)",
          padding: "4px 16px",
        }}>
          {nearby.map((p, i, arr) => (
            <NearbyRow key={p.id} p={p}
              onClick={() => nav("profile", p.id)}
              last={i === arr.length - 1}/>
          ))}
        </div>
      </section>

      {/* How it works — minimal cards */}
      <section style={{ marginTop: 28, padding: "0 20px" }}>
        <h2 style={mhSectionTitle}>Comment ça marche</h2>
        <div style={{ marginTop: 12 }}><HowItWorks mobile/></div>
      </section>

      {/* Provider CTA */}
      <section style={{ padding: "28px 20px 20px" }}>
        <div style={{
          borderRadius: "var(--k-r-lg)", padding: 22,
          background: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
          border: "1px solid #FECDD3", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120,
            borderRadius: "50%", background: "rgba(251,113,133,0.2)" }}/>
          <div className="k-overline" style={{ color: "#BE123C", marginBottom: 8 }}>Pour les pros</div>
          <h3 className="k-display-m" style={{ margin: "0 0 8px", fontSize: 22 }}>Tu es un pro ? Rejoins-nous.</h3>
          <p className="k-body" style={{ color: "#9F1239", margin: "0 0 14px" }}>
            Crée ton profil, reçois des demandes qualifiées.
          </p>
          <button className="k-btn k-btn-primary">Devenir pro <I.arrowRight size={14}/></button>
        </div>
      </section>
    </div>
  );
}

const mhSectionTitle = { fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 20, margin: 0, letterSpacing: "-0.02em", color: "var(--k-text-primary)" };
const mhLinkBtn = { border: 0, background: "transparent", color: "var(--k-text-primary)", fontFamily: "var(--k-font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4, padding: 0 };
const mhIconBtn = { width: 36, height: 36, borderRadius: "50%", background: "white", border: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--k-text-body)", boxShadow: "0 3px 10px -3px rgba(15,23,42,0.14), 0 1px 2px rgba(15,23,42,0.06)" };

Object.assign(window, { MobileHome });
