// BookingDetail — unified reservation detail page used by BOTH client and pro.
// Shows: status timeline, counterparty, service, address/map, devis breakdown,
// chat preview, action buttons contextualized to status and viewer role.

// Look up a booking by id from EITHER list. Derive perspective from which list it came from.
function lookupBooking(id) {
  const client = (typeof BOOKINGS !== "undefined" ? BOOKINGS : []).find(b => b.id === id);
  if (client) {
    const p = PROVIDERS.find(x => x.id === client.providerId);
    return { perspective: "client", booking: client, counterparty: p };
  }
  const pro = (typeof PRO_ACTIVE_JOBS !== "undefined" ? PRO_ACTIVE_JOBS : []).find(j => j.id === id);
  if (pro) {
    return {
      perspective: "pro",
      booking: { ...pro, when: pro.when, service: pro.service, address: pro.address, price: pro.payout, priceLabel: "Payout" },
      counterparty: { firstName: pro.clientName.split(" ")[0], lastName: pro.clientName.split(" ")[1] || "", initials: pro.clientInitials, avatarBg: pro.clientBg, profession: "Client", rating: null, reviews: null, id: pro.id },
    };
  }
  return null;
}

const TIMELINE_STEPS = {
  upcoming:  ["booked", "confirmed", "enroute", "inprogress", "done"],
  active:    ["booked", "confirmed", "enroute", "inprogress", "done"],
  completed: ["booked", "confirmed", "enroute", "inprogress", "done", "paid"],
  cancelled: ["booked", "cancelled"],
  scheduled: ["booked", "confirmed", "enroute", "inprogress", "done"],
  in_progress: ["booked", "confirmed", "enroute", "inprogress", "done"],
};

const STEP_META = {
  booked:     { label: "Réservation créée", icon: "calendar" },
  confirmed:  { label: "Devis accepté",     icon: "check" },
  enroute:    { label: "En route",          icon: "mapPin" },
  inprogress: { label: "Intervention",      icon: "wrench" },
  done:       { label: "Terminée",          icon: "badgeCheck" },
  paid:       { label: "Payée",             icon: "coins" },
  cancelled:  { label: "Annulée",           icon: "x" },
};

// Current step from status
function currentStep(status) {
  if (status === "upcoming")    return 1; // confirmed
  if (status === "active")      return 3; // in progress
  if (status === "in_progress") return 3;
  if (status === "scheduled")   return 1;
  if (status === "completed")   return 5; // paid
  if (status === "cancelled")   return 1;
  return 0;
}

function BookingDetail({ nav, mobile, bookingId }) {
  const rec = lookupBooking(bookingId);
  if (!rec) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--k-text-muted)" }}>
        Réservation introuvable.
        <div style={{ marginTop: 16 }}>
          <button onClick={() => nav("bookings")} className="k-btn k-btn-primary">Retour</button>
        </div>
      </div>
    );
  }
  const { perspective, booking, counterparty } = rec;
  const isClient = perspective === "client";
  const steps = TIMELINE_STEPS[booking.status] || TIMELINE_STEPS.upcoming;
  const step = currentStep(booking.status);

  const onBack = () => nav(isClient ? "bookings" : "requests");
  const statusChipText = {
    upcoming: "À venir", active: "En cours", completed: "Terminée", cancelled: "Annulée",
    scheduled: "Planifiée", in_progress: "En cours",
  }[booking.status] || booking.status;

  // ─── Shared primitives ────────────────────────────────────────────────
  const Timeline = () => (
    <div style={{ position: "relative", padding: "4px 0" }}>
      {steps.map((s, i) => {
        const meta = STEP_META[s];
        const done = i < step;
        const current = i === step;
        const Icon = I[meta.icon] || I.check;
        const isLast = i === steps.length - 1;
        return (
          <div key={s} style={{ display: "flex", gap: 12, paddingBottom: isLast ? 0 : 16, position: "relative" }}>
            {!isLast && (
              <div style={{
                position: "absolute", left: 15, top: 28, bottom: 0,
                width: 2, background: done ? "var(--k-success)" : "var(--k-border)",
              }}/>
            )}
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: done ? "var(--k-success)" : current ? "var(--k-primary)" : "var(--k-surface)",
              color: (done || current) ? "white" : "var(--k-text-muted)",
              border: `2px solid ${done ? "var(--k-success)" : current ? "var(--k-primary)" : "var(--k-border)"}`,
              boxShadow: current ? "0 0 0 4px var(--k-primary-subtle)" : "none",
              position: "relative", zIndex: 1,
            }}>
              <Icon size={14} stroke={2}/>
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{
                fontWeight: current ? 600 : 500, fontSize: 13.5,
                color: done || current ? "var(--k-text-primary)" : "var(--k-text-muted)",
              }}>
                {meta.label}
              </div>
              {current && booking.progress && (
                <div className="k-caption" style={{ color: "var(--k-text-muted)", marginTop: 2, fontSize: 12 }}>
                  {booking.progress}
                </div>
              )}
              {current && !booking.progress && (
                <div className="k-caption" style={{ color: "var(--k-text-muted)", marginTop: 2, fontSize: 12 }}>
                  En cours · maintenant
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const QuoteBreakdown = () => {
    // Synthesize line items — pull from booking.quote if present
    const lines = booking.quote?.lines || [
      { label: "Diagnostic + déplacement", qty: 1, unit: "Forfait", unitPrice: 5000 },
      { label: "Main-d'œuvre", qty: 1.5, unit: "Heure", unitPrice: 8000 },
      { label: "Joint + raccord", qty: 1, unit: "Pièce", unitPrice: 2000 },
    ];
    const subtotal = lines.reduce((a, b) => a + b.qty * b.unitPrice, 0);
    const commission = Math.round(subtotal * 0.10);
    const total = booking.price || subtotal;
    return (
      <div>
        {lines.map((l, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12,
            padding: "10px 0", borderBottom: "1px solid var(--k-border-subtle)",
            alignItems: "baseline",
          }}>
            <div>
              <div style={{ fontSize: 13.5, color: "var(--k-text-primary)", fontWeight: 500 }}>{l.label}</div>
              <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11 }}>
                {l.qty} × {l.unit}
              </div>
            </div>
            <div style={{ fontFamily: "var(--k-font-mono)", fontSize: 12, color: "var(--k-text-muted)" }}>
              {l.unitPrice.toLocaleString("fr-FR")} FC
            </div>
            <div className="k-price" style={{ fontSize: 13, color: "var(--k-text-primary)", fontFamily: "var(--k-font-mono)" }}>
              {(l.qty * l.unitPrice).toLocaleString("fr-FR")} FC
            </div>
          </div>
        ))}
        <div style={{
          marginTop: 10, paddingTop: 12, borderTop: "2px solid var(--k-text-primary)",
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
        }}>
          <span style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 14 }}>Total</span>
          <span className="k-price" style={{
            fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 20,
            letterSpacing: "-0.02em", color: "var(--k-text-primary)",
          }}>
            {total.toLocaleString("fr-FR")} FC
          </span>
        </div>
        {!isClient && (
          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--k-text-muted)" }}>Commission KAYOU (10%)</span>
            <span className="k-price" style={{ color: "var(--k-text-muted)", fontSize: 12 }}>
              −{commission.toLocaleString("fr-FR")} FC
            </span>
          </div>
        )}
        {!isClient && (
          <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
            <span style={{ color: "var(--k-text-body)" }}>Votre payout</span>
            <span className="k-price" style={{ color: "var(--k-primary)", fontWeight: 700 }}>
              {(total - commission).toLocaleString("fr-FR")} FC
            </span>
          </div>
        )}
      </div>
    );
  };

  const CounterpartyCard = () => {
    const name = `${counterparty.firstName} ${counterparty.lastName}`.trim();
    const roleLabel = isClient ? "Votre pro" : "Client";
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Avatar name={name} bg={counterparty.avatarBg || "#0EA5E9"} size={52} initials={counterparty.initials}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
            {roleLabel}
          </div>
          <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--k-text-primary)", marginBottom: 2 }}>
            {name}
          </div>
          {isClient && counterparty.rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <I.star size={12} style={{ color: "var(--k-accent)" }}/>
              <strong style={{ color: "var(--k-text-primary)" }}>{counterparty.rating}</strong>
              <span style={{ color: "var(--k-text-muted)" }}>({counterparty.reviews} avis)</span>
            </div>
          )}
          {!isClient && (
            <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 12 }}>
              {booking.clientJobs ? `${booking.clientJobs} missions` : "Nouveau client"}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={bdIconBtn} title="Appeler"><I.phone size={15}/></button>
          <button onClick={() => nav("messages")} style={bdIconBtn} title="Message">
            <I.messageCircle size={15}/>
          </button>
        </div>
      </div>
    );
  };

  const ActionButtons = () => {
    // Context-aware primary actions
    if (booking.status === "upcoming") {
      return (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => nav("messages")} className="k-btn k-btn-primary" style={{ flex: 1 }}>
            <I.messageCircle size={15}/> {isClient ? "Contacter le pro" : "Contacter le client"}
          </button>
          <button className="k-btn k-btn-secondary">
            {isClient ? "Annuler" : "Se désister"}
          </button>
        </div>
      );
    }
    if (booking.status === "active" || booking.status === "in_progress") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {!isClient && (
            <button className="k-btn k-btn-primary k-btn-lg" style={{ width: "100%" }}>
              <I.check size={15}/> Marquer comme terminée
            </button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => nav("messages")} className="k-btn k-btn-secondary" style={{ flex: 1 }}>
              <I.messageCircle size={14}/> Message
            </button>
            {isClient && (
              <button className="k-btn k-btn-secondary" style={{ flex: 1 }}>
                <I.mapPin size={14}/> Suivre en temps réel
              </button>
            )}
          </div>
        </div>
      );
    }
    if (booking.status === "completed") {
      return (
        <div style={{ display: "flex", gap: 8 }}>
          {isClient && !booking.reviewed && (
            <button onClick={() => nav("review", booking.providerId)} className="k-btn k-btn-primary" style={{ flex: 1 }}>
              <I.star size={14}/> Laisser un avis
            </button>
          )}
          {isClient && booking.reviewed && (
            <button onClick={() => nav("profile", booking.providerId)} className="k-btn k-btn-primary" style={{ flex: 1 }}>
              Réserver à nouveau
            </button>
          )}
          <button className="k-btn k-btn-secondary">
            <I.fileText size={14}/> Facture
          </button>
        </div>
      );
    }
    return (
      <button onClick={onBack} className="k-btn k-btn-secondary" style={{ width: "100%" }}>
        Retour
      </button>
    );
  };

  const AddressCard = () => (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
        <I.mapPin size={16} color="var(--k-text-muted)" style={{ marginTop: 2, flexShrink: 0 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, color: "var(--k-text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
            {booking.address}
          </div>
          <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11, marginTop: 2 }}>
            {isClient ? "Adresse d'intervention" : "Adresse client"}
          </div>
        </div>
      </div>
      {/* Mini map placeholder */}
      <div style={{
        height: 110, borderRadius: 10,
        background: "linear-gradient(135deg, #ECFDF5 0%, #DBEAFE 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <svg width="100%" height="100%" viewBox="0 0 400 110" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
          <path d="M0 70 Q 100 30 200 60 T 400 50" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeDasharray="3 3"/>
          <path d="M0 90 L 400 90" stroke="#D1D5DB" strokeWidth="0.8" fill="none"/>
          <circle cx="80" cy="55" r="3" fill="#9CA3AF"/>
          <circle cx="250" cy="65" r="3" fill="#9CA3AF"/>
          <circle cx="350" cy="40" r="3" fill="#9CA3AF"/>
        </svg>
        <div style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          background: "var(--k-primary)", color: "white", padding: "6px 10px",
          borderRadius: 999, fontSize: 11, fontWeight: 600,
          display: "inline-flex", alignItems: "center", gap: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          <I.mapPin size={11}/> {booking.address.split(",")[1]?.trim() || "Kinshasa"}
        </div>
        <button style={{
          position: "absolute", bottom: 8, right: 8,
          background: "white", border: "1px solid var(--k-border)",
          borderRadius: 8, padding: "5px 10px",
          fontSize: 11, fontWeight: 600, color: "var(--k-text-primary)", cursor: "pointer",
        }}>
          Itinéraire ↗
        </button>
      </div>
    </div>
  );

  const ChatPreview = () => (
    <button onClick={() => nav("messages")} style={{
      width: "100%", textAlign: "left",
      display: "flex", alignItems: "center", gap: 12,
      background: "var(--k-surface-muted)", border: 0, padding: 12,
      borderRadius: 10, cursor: "pointer",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "var(--k-primary)", color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <I.messageCircle size={16}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--k-text-primary)", marginBottom: 2 }}>
          Conversation
        </div>
        <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {isClient
            ? "Pro : « Je serai là dans 15 min, merci de patienter »"
            : "Client : « Merci, à tout à l'heure ! »"}
        </div>
      </div>
      <I.chevronRight size={14} color="var(--k-text-muted)"/>
    </button>
  );

  // ─── MOBILE ────────────────────────────────────────────────────────────
  if (mobile) {
    return (
      <div style={{ background: "var(--k-bg)", minHeight: "100%" }}>
        {/* Top bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "rgba(250,250,249,0.94)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--k-border-subtle)",
          display: "flex", alignItems: "center", padding: "12px 16px", gap: 12,
        }}>
          <button onClick={onBack} style={bdIconBtn}><I.arrowLeft size={17}/></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 15, color: "var(--k-text-primary)" }}>
              Réservation
            </div>
            <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11, fontFamily: "var(--k-font-mono)" }}>
              #{booking.id.toUpperCase()}
            </div>
          </div>
          <BdStatusChip status={booking.status}/>
        </div>

        {/* Hero card — service + when + price */}
        <div style={{ padding: 16 }}>
          <div style={{
            background: "var(--k-surface)", border: "1px solid var(--k-border)",
            borderRadius: 16, padding: 18, boxShadow: "var(--k-e1)",
          }}>
            <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              {booking.when}
            </div>
            <h2 style={{
              fontFamily: "var(--k-font-display)", fontWeight: 700,
              fontSize: 22, letterSpacing: "-0.02em",
              margin: "0 0 14px", lineHeight: 1.15,
            }}>
              {booking.service}
            </h2>
            <div style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              paddingTop: 14, borderTop: "1px solid var(--k-border-subtle)",
            }}>
              <span className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 12 }}>
                {booking.priceLabel}
              </span>
              <span className="k-price" style={{
                fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 22,
                letterSpacing: "-0.02em", color: "var(--k-text-primary)",
              }}>
                {booking.price?.toLocaleString("fr-FR")} FC
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "0 16px 16px" }}>
          <ActionButtons/>
        </div>

        {/* Counterparty */}
        <div style={{ padding: "8px 16px 16px" }}>
          <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 14, padding: 14 }}>
            <CounterpartyCard/>
          </div>
        </div>

        {/* Chat preview */}
        <div style={{ padding: "0 16px 16px" }}>
          <ChatPreview/>
        </div>

        {/* Timeline */}
        <MobileSection title="Suivi">
          <Timeline/>
        </MobileSection>

        {/* Address */}
        <MobileSection title={isClient ? "Où" : "Adresse"}>
          <AddressCard/>
        </MobileSection>

        {/* Quote */}
        <MobileSection title="Devis" subtitle={booking.quote ? "Accepté" : "Estimation"}>
          <QuoteBreakdown/>
        </MobileSection>

        {/* Meta */}
        <MobileSection title="Détails">
          <MetaRow label="N° de réservation" value={`#${booking.id.toUpperCase()}`} mono/>
          <MetaRow label="Créée" value={booking.createdAt}/>
          {!isClient && <MetaRow label="Paiement" value="Via KAYOU"/>}
          {isClient && <MetaRow label="Moyen de paiement" value="M-Pesa · •• 4521"/>}
        </MobileSection>

        {/* Footer help */}
        <div style={{ padding: "8px 16px 40px" }}>
          <button style={{
            width: "100%", background: "transparent", border: "1px solid var(--k-border)",
            borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 10,
            color: "var(--k-text-body)", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            <I.shieldCheck size={16} color="var(--k-primary)"/>
            <span style={{ flex: 1, textAlign: "left" }}>Un problème ? Contactez KAYOU</span>
            <I.chevronRight size={13} color="var(--k-text-muted)"/>
          </button>
        </div>
      </div>
    );
  }

  // ─── WEB ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 40px 60px" }}>
      <button onClick={onBack} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "transparent", border: 0, cursor: "pointer",
        color: "var(--k-text-muted)", fontSize: 13, padding: "6px 2px", marginBottom: 12,
      }}>
        <I.arrowLeft size={14}/> {isClient ? "Mes réservations" : "Mes demandes"}
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span className="k-caption" style={{
              color: "var(--k-text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
              fontFamily: "var(--k-font-mono)",
            }}>
              #{booking.id.toUpperCase()}
            </span>
            <BdStatusChip status={booking.status}/>
          </div>
          <h1 className="k-display-2" style={{ margin: "0 0 6px" }}>
            {booking.service}
          </h1>
          <div className="k-body" style={{ color: "var(--k-text-muted)" }}>
            {booking.when} · {booking.address}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
            {booking.priceLabel}
          </div>
          <div className="k-price" style={{
            fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 28,
            letterSpacing: "-0.02em", color: "var(--k-text-primary)",
          }}>
            {booking.price?.toLocaleString("fr-FR")} FC
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
        {/* Main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <WebCard title="Suivi" count={`${step + 1}/${steps.length}`}>
            <Timeline/>
          </WebCard>

          <WebCard title="Devis" subtitle={booking.quote ? "Accepté par le client" : "Estimation initiale"}>
            <QuoteBreakdown/>
          </WebCard>

          <WebCard title={isClient ? "Adresse d'intervention" : "Adresse client"}>
            <AddressCard/>
          </WebCard>

          <WebCard title="Conversation">
            <ChatPreview/>
            <button onClick={() => nav("messages")} className="k-btn k-btn-secondary" style={{ marginTop: 10, width: "100%" }}>
              Ouvrir la conversation <I.arrowRight size={13}/>
            </button>
          </WebCard>
        </div>

        {/* Sidebar */}
        <aside style={{ position: "sticky", top: 24, alignSelf: "start", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-lg)", padding: 20, boxShadow: "var(--k-e1)" }}>
            <div style={{ marginBottom: 16 }}>
              <CounterpartyCard/>
            </div>
            <ActionButtons/>
          </div>

          <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-lg)", padding: 20, boxShadow: "var(--k-e1)" }}>
            <h4 style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 13, margin: "0 0 10px", color: "var(--k-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Détails
            </h4>
            <MetaRow label="Réservation" value={`#${booking.id.toUpperCase()}`} mono/>
            <MetaRow label="Créée" value={booking.createdAt}/>
            {isClient && <MetaRow label="Paiement" value="M-Pesa · •• 4521"/>}
            {!isClient && <MetaRow label="Paiement" value="Via KAYOU"/>}
            {!isClient && <MetaRow label="Zone" value={(booking.address || "").split(",").pop()?.trim()}/>}
          </div>

          <div style={{
            padding: 14, background: "var(--k-surface-primary)",
            borderRadius: "var(--k-r-md)",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <I.shieldCheck size={16} color="var(--k-primary)" style={{ marginTop: 2, flexShrink: 0 }}/>
            <div style={{ fontSize: 12, color: "var(--k-text-body)", lineHeight: 1.5 }}>
              <strong>Garantie KAYOU</strong>
              <div style={{ color: "var(--k-text-muted)", marginTop: 3 }}>
                Paiement sécurisé · remboursement si le pro ne se présente pas.
              </div>
              <button style={{
                marginTop: 8, background: "transparent", border: 0, padding: 0,
                color: "var(--k-primary-hover)", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                Signaler un problème
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────

function WebCard({ title, subtitle, count, children }) {
  return (
    <section style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-lg)", padding: 24, boxShadow: "var(--k-e1)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <div>
          <h3 className="k-heading" style={{ margin: 0 }}>{title}</h3>
          {subtitle && <div className="k-caption" style={{ color: "var(--k-text-muted)", marginTop: 3, fontSize: 12 }}>{subtitle}</div>}
        </div>
        {count && <span className="k-caption" style={{ color: "var(--k-text-muted)", fontFamily: "var(--k-font-mono)", fontSize: 12 }}>{count}</span>}
      </div>
      {children}
    </section>
  );
}

function MobileSection({ title, subtitle, children }) {
  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--k-text-muted)", margin: 0 }}>
          {title}
        </h3>
        {subtitle && <span className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11 }}>{subtitle}</span>}
      </div>
      <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: 12, padding: 14 }}>
        {children}
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 0", borderBottom: "1px solid var(--k-border-subtle)",
      fontSize: 13,
    }}>
      <span style={{ color: "var(--k-text-muted)" }}>{label}</span>
      <span style={{
        color: "var(--k-text-primary)", fontWeight: 500,
        fontFamily: mono ? "var(--k-font-mono)" : "var(--k-font-body)",
        fontSize: mono ? 12 : 13,
      }}>
        {value}
      </span>
    </div>
  );
}

// Local status chip for this page (avoids collision with MyBookings' version)
function BdStatusChip({ status }) {
  const map = {
    upcoming:    { label: "À venir",    cls: "k-chip-primary" },
    active:      { label: "En cours",   cls: "k-chip-success" },
    in_progress: { label: "En cours",   cls: "k-chip-success" },
    scheduled:   { label: "Planifiée",  cls: "k-chip-primary" },
    completed:   { label: "Terminée",   cls: "" },
    cancelled:   { label: "Annulée",    cls: "k-chip-danger" },
  };
  const c = map[status] || { label: status, cls: "" };
  return <span className={`k-chip k-chip-sm ${c.cls}`}>{c.label}</span>;
}

const bdIconBtn = {
  width: 36, height: 36, borderRadius: 10,
  border: "1px solid var(--k-border)", background: "white",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--k-text-body)", cursor: "pointer", flexShrink: 0,
};

Object.assign(window, { BookingDetail });
