// QuoteCompose — pro builds a devis (quote) in response to an inbound request.
// Web + mobile. Line items, labor hours, materials, visit fee, optional discount,
// free-text message, estimated start date. Live total.

const PRESET_LINE_ITEMS = {
  plomberie: [
    { label: "Diagnostic + déplacement", unit: "Forfait", unitPrice: 5000 },
    { label: "Main-d'œuvre plombier",    unit: "Heure",   unitPrice: 8000 },
    { label: "Remplacement joint/robinet", unit: "Pièce", unitPrice: 4500 },
    { label: "Débouchage canalisation",  unit: "Forfait", unitPrice: 12000 },
  ],
  electricite: [
    { label: "Diagnostic électrique",    unit: "Forfait", unitPrice: 5000 },
    { label: "Main-d'œuvre électricien", unit: "Heure",   unitPrice: 8500 },
    { label: "Fourniture matériel",      unit: "Pièce",   unitPrice: 0 },
  ],
  default: [
    { label: "Déplacement",       unit: "Forfait", unitPrice: 5000 },
    { label: "Main-d'œuvre",      unit: "Heure",   unitPrice: 7500 },
    { label: "Matériel",          unit: "Pièce",   unitPrice: 0 },
  ],
};

function QuoteCompose({ nav, mobile, requestId }) {
  const req = INCOMING_REQUESTS.find(r => r.id === requestId) || INCOMING_REQUESTS[0];
  const cat = PORTFOLIO_BG[req.category] || PORTFOLIO_BG.plomberie;
  const presets = PRESET_LINE_ITEMS[req.category] || PRESET_LINE_ITEMS.default;

  // Seed with sensible defaults from the request
  const [lines, setLines] = React.useState([
    { id: 1, label: "Diagnostic + déplacement", qty: 1, unit: "Forfait", unitPrice: 5000 },
    { id: 2, label: "Main-d'œuvre", qty: req.estimatedHours, unit: "Heure", unitPrice: 8000 },
  ]);
  const [nextId, setNextId] = React.useState(3);
  const [message, setMessage] = React.useState(
    `Bonjour ${req.clientName.split(" ")[0]}, merci pour votre demande. Voici mon devis pour « ${req.service} ». Je peux intervenir dès que ça vous arrange. — Jean`
  );
  const [startDate, setStartDate] = React.useState(req.when.includes("aujourd") ? "today" : "tomorrow");
  const [validityDays, setValidityDays] = React.useState(7);
  const [discountPct, setDiscountPct] = React.useState(0);
  const [showPresets, setShowPresets] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const discountAmt = Math.round(subtotal * (discountPct / 100));
  const total = subtotal - discountAmt;
  const kayouFee = Math.round(total * 0.10);
  const payout = total - kayouFee;
  const vsBudget = total - req.budget;

  const addLine = (preset) => {
    setLines(prev => [...prev, { id: nextId, label: preset.label, qty: 1, unit: preset.unit, unitPrice: preset.unitPrice }]);
    setNextId(n => n + 1);
    setShowPresets(false);
  };
  const addBlank = () => {
    setLines(prev => [...prev, { id: nextId, label: "", qty: 1, unit: "Forfait", unitPrice: 0 }]);
    setNextId(n => n + 1);
  };
  const updateLine = (id, patch) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };
  const removeLine = (id) => {
    setLines(prev => prev.filter(l => l.id !== id));
  };

  if (sent) {
    return <QuoteSent req={req} total={total} mobile={mobile} nav={nav}/>;
  }

  if (mobile) {
    return (
      <div style={{ background: "var(--k-bg)", minHeight: "100%", paddingBottom: 20 }}>
        {/* Top bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "var(--k-bg)", borderBottom: "1px solid var(--k-border-subtle)",
          display: "flex", alignItems: "center", padding: "12px 16px", gap: 12,
        }}>
          <button onClick={() => nav("requests")} style={qcIconBtn}><I.arrowLeft size={18}/></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 16, color: "var(--k-text-primary)" }}>
              Nouveau devis
            </div>
            <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 12 }}>
              Pour {req.clientName}
            </div>
          </div>
        </div>

        {/* Request context card */}
        <div style={{ padding: 16 }}>
          <div style={{
            background: cat.bg,
            border: `1px solid ${cat.accent}30`,
            borderRadius: 14, padding: 14,
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "white", display: "flex", alignItems: "center", justifyContent: "center",
              color: cat.accent, flexShrink: 0,
            }}>
              <cat.icon size={20}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 14, color: "var(--k-text-primary)", marginBottom: 2 }}>
                {req.service}
              </div>
              <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 12, lineHeight: 1.5 }}>
                {req.when} · {req.address}
                <br/>
                Budget indicatif : <strong style={{ color: "var(--k-text-body)" }}>{req.budget.toLocaleString("fr-FR")} FC</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <Section title="Prestations" count={lines.length} mobile>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lines.map(l => (
              <MobileLineItem key={l.id} line={l} onChange={updateLine} onRemove={removeLine}/>
            ))}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={() => setShowPresets(s => !s)} className="k-btn k-btn-secondary" style={{ flex: 1 }}>
              <I.plus size={14}/> Ajouter
            </button>
            <button onClick={addBlank} className="k-btn k-btn-secondary" style={{ flex: 0 }}>
              <I.pencil size={14}/>
            </button>
          </div>

          {showPresets && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {presets.map((p, i) => (
                <button key={i} onClick={() => addLine(p)} style={qcPresetBtn}>
                  <span style={{ flex: 1, textAlign: "left", fontWeight: 500 }}>{p.label}</span>
                  <span className="k-price" style={{ fontSize: 13, color: "var(--k-text-muted)" }}>
                    {p.unitPrice > 0 ? `${p.unitPrice.toLocaleString("fr-FR")} FC / ${p.unit}` : `au ${p.unit}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Section>

        <Section title="Remise" mobile>
          <DiscountRow value={discountPct} onChange={setDiscountPct}/>
        </Section>

        <Section title="Message au client" mobile>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
            placeholder="Un petit mot personnel…"
            style={qcTextarea}/>
        </Section>

        <Section title="Détails" mobile>
          <DetailRow label="Date d'intervention proposée">
            <select value={startDate} onChange={e => setStartDate(e.target.value)} style={qcSelect}>
              <option value="today">Aujourd'hui</option>
              <option value="tomorrow">Demain</option>
              <option value="weekend">Ce week-end</option>
              <option value="nextweek">La semaine prochaine</option>
            </select>
          </DetailRow>
          <DetailRow label="Devis valable">
            <select value={validityDays} onChange={e => setValidityDays(Number(e.target.value))} style={qcSelect}>
              <option value={3}>3 jours</option>
              <option value={7}>7 jours</option>
              <option value={14}>14 jours</option>
              <option value={30}>30 jours</option>
            </select>
          </DetailRow>
        </Section>

        {/* Totals */}
        <div style={{ padding: 16 }}>
          <div style={{
            background: "var(--k-surface)", border: "1px solid var(--k-border)",
            borderRadius: 14, padding: 16, boxShadow: "var(--k-e1)",
          }}>
            <TotalRow label="Sous-total" value={subtotal}/>
            {discountPct > 0 && <TotalRow label={`Remise (${discountPct}%)`} value={-discountAmt} muted/>}
            <TotalRow label="Total client" value={total} bold big/>
            <div style={{ height: 10 }}/>
            <div style={{ borderTop: "1px dashed var(--k-border)", paddingTop: 10 }}>
              <TotalRow label="Commission KAYOU (10%)" value={-kayouFee} muted small/>
              <TotalRow label="Ce que vous touchez" value={payout} bold small accent/>
            </div>
            {vsBudget !== 0 && (
              <div style={{
                marginTop: 10, padding: "8px 10px", borderRadius: 8,
                background: vsBudget > 0 ? "#FEF2F2" : "#F0FDF4",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <I.info size={14} color={vsBudget > 0 ? "#DC2626" : "#16A34A"}/>
                <span style={{ fontSize: 12, color: vsBudget > 0 ? "#991B1B" : "#166534", lineHeight: 1.4 }}>
                  {vsBudget > 0
                    ? `+${vsBudget.toLocaleString("fr-FR")} FC au-dessus du budget client`
                    : `${Math.abs(vsBudget).toLocaleString("fr-FR")} FC sous le budget client 👍`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sticky send bar */}
        <div style={{
          position: "sticky", bottom: 0,
          background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--k-border)",
          padding: "14px 16px", zIndex: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11 }}>Total devis</div>
            <div style={{ fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 19, color: "var(--k-text-primary)" }}>
              {total.toLocaleString("fr-FR")} FC
            </div>
          </div>
          <button onClick={() => setSent(true)} className="k-btn k-btn-primary k-btn-lg"
            disabled={lines.length === 0 || total === 0}
            style={{ opacity: (lines.length === 0 || total === 0) ? 0.5 : 1 }}>
            Envoyer <I.send size={15}/>
          </button>
        </div>
      </div>
    );
  }

  // ─── WEB ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 40px 80px" }}>
      <button onClick={() => nav("requests")} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "transparent", border: 0, cursor: "pointer",
        color: "var(--k-text-muted)", fontSize: 13, padding: "6px 2px", marginBottom: 16,
      }}>
        <I.arrowLeft size={14}/> Retour aux demandes
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 24 }}>
        <div>
          <h1 className="k-display-2" style={{ margin: "0 0 6px" }}>Nouveau devis</h1>
          <div className="k-body" style={{ color: "var(--k-text-muted)" }}>
            Pour <strong style={{ color: "var(--k-text-primary)" }}>{req.clientName}</strong> · {req.service}
          </div>
        </div>
        <div style={{
          background: cat.bg, border: `1px solid ${cat.accent}40`,
          borderRadius: 999, padding: "6px 14px",
          display: "inline-flex", alignItems: "center", gap: 6,
          color: cat.accent, fontSize: 12, fontWeight: 600,
        }}>
          <cat.icon size={13}/> {cat.label}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, marginTop: 28 }}>
        {/* Left column — builder */}
        <div>
          {/* Request summary */}
          <div style={{
            background: "var(--k-surface-muted)", border: "1px solid var(--k-border)",
            borderRadius: "var(--k-r-md)", padding: 18, marginBottom: 20,
          }}>
            <div className="k-caption" style={{ color: "var(--k-text-muted)", marginBottom: 10, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Demande reçue {req.receivedAt}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <ReqFact icon={<I.calendar size={14}/>} label="Quand" value={req.when}/>
              <ReqFact icon={<I.mapPin size={14}/>} label="Où" value={`${req.address} · ${req.distance} km`}/>
              <ReqFact icon={<I.coins size={14}/>} label="Budget" value={`${req.budget.toLocaleString("fr-FR")} FC`}/>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--k-border-subtle)", color: "var(--k-text-body)", fontSize: 13.5, lineHeight: 1.55, fontStyle: "italic" }}>
              « {req.description} »
            </div>
          </div>

          {/* Line items */}
          <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-lg)", padding: 24, boxShadow: "var(--k-e1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 className="k-heading" style={{ margin: 0 }}>Prestations</h3>
              <span className="k-caption" style={{ color: "var(--k-text-muted)" }}>
                {lines.length} ligne{lines.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 100px 120px 120px 36px",
              gap: 12, padding: "8px 4px", fontSize: 11, fontWeight: 600,
              color: "var(--k-text-muted)", letterSpacing: "0.04em", textTransform: "uppercase",
              borderBottom: "1px solid var(--k-border-subtle)",
            }}>
              <div>Description</div>
              <div style={{ textAlign: "center" }}>Qté</div>
              <div style={{ textAlign: "right" }}>Prix unit.</div>
              <div style={{ textAlign: "right" }}>Total</div>
              <div/>
            </div>

            {lines.map(l => (
              <WebLineItem key={l.id} line={l} onChange={updateLine} onRemove={removeLine}/>
            ))}

            {lines.length === 0 && (
              <div style={{ padding: 28, textAlign: "center", color: "var(--k-text-muted)", fontSize: 13 }}>
                Aucune ligne. Ajoutez votre première prestation ci-dessous.
              </div>
            )}

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {presets.map((p, i) => (
                <button key={i} onClick={() => addLine(p)} style={qcPresetChip}>
                  <I.plus size={13}/> {p.label}
                </button>
              ))}
              <button onClick={addBlank} style={{ ...qcPresetChip, background: "transparent", borderStyle: "dashed" }}>
                <I.pencil size={13}/> Ligne personnalisée
              </button>
            </div>
          </div>

          {/* Message + details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-lg)", padding: 20, boxShadow: "var(--k-e1)" }}>
              <h4 style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 14, margin: "0 0 10px" }}>Message au client</h4>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                placeholder="Un petit mot personnel…" style={qcTextarea}/>
            </div>
            <div style={{ background: "var(--k-surface)", border: "1px solid var(--k-border)", borderRadius: "var(--k-r-lg)", padding: 20, boxShadow: "var(--k-e1)" }}>
              <h4 style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 14, margin: "0 0 14px" }}>Conditions</h4>
              <DetailRow label="Date proposée">
                <select value={startDate} onChange={e => setStartDate(e.target.value)} style={qcSelect}>
                  <option value="today">Aujourd'hui</option>
                  <option value="tomorrow">Demain</option>
                  <option value="weekend">Ce week-end</option>
                  <option value="nextweek">La semaine prochaine</option>
                </select>
              </DetailRow>
              <DetailRow label="Validité du devis">
                <select value={validityDays} onChange={e => setValidityDays(Number(e.target.value))} style={qcSelect}>
                  <option value={3}>3 jours</option>
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                </select>
              </DetailRow>
              <DetailRow label="Remise">
                <DiscountRow value={discountPct} onChange={setDiscountPct} compact/>
              </DetailRow>
            </div>
          </div>
        </div>

        {/* Right column — sticky totals */}
        <aside style={{ position: "sticky", top: 24 }}>
          <div style={{
            background: "var(--k-surface)", border: "1px solid var(--k-border)",
            borderRadius: "var(--k-r-lg)", padding: 24, boxShadow: "var(--k-e2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <I.fileText size={16} color="var(--k-text-muted)"/>
              <span style={{ fontFamily: "var(--k-font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--k-text-muted)" }}>
                Résumé du devis
              </span>
            </div>

            <TotalRow label="Sous-total" value={subtotal}/>
            {discountPct > 0 && <TotalRow label={`Remise (${discountPct}%)`} value={-discountAmt} muted/>}

            <div style={{ height: 16 }}/>
            <div style={{
              padding: "16px 0", borderTop: "1px solid var(--k-border)",
              borderBottom: "1px solid var(--k-border)",
            }}>
              <TotalRow label="Total client" value={total} big bold/>
            </div>

            <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 6 }}>
              <TotalRow label="Commission KAYOU (10%)" value={-kayouFee} muted small/>
              <TotalRow label="Ce que vous touchez" value={payout} bold small accent/>
            </div>

            {vsBudget !== 0 && (
              <div style={{
                marginTop: 8, padding: 12, borderRadius: 10,
                background: vsBudget > 0 ? "#FEF2F2" : "#F0FDF4",
                display: "flex", alignItems: "flex-start", gap: 9,
              }}>
                <I.info size={14} color={vsBudget > 0 ? "#DC2626" : "#16A34A"} style={{ marginTop: 1, flexShrink: 0 }}/>
                <div style={{ fontSize: 12, color: vsBudget > 0 ? "#991B1B" : "#166534", lineHeight: 1.5 }}>
                  {vsBudget > 0 ? (
                    <>
                      <strong>+{vsBudget.toLocaleString("fr-FR")} FC</strong> au-dessus du budget indicatif.
                      Expliquez la différence dans votre message pour maximiser vos chances.
                    </>
                  ) : (
                    <>
                      <strong>{Math.abs(vsBudget).toLocaleString("fr-FR")} FC</strong> sous le budget du client. Bonne posture pour être choisi·e. 👍
                    </>
                  )}
                </div>
              </div>
            )}

            <button onClick={() => setSent(true)}
              disabled={lines.length === 0 || total === 0}
              className="k-btn k-btn-primary k-btn-lg"
              style={{ width: "100%", marginTop: 20, opacity: (lines.length === 0 || total === 0) ? 0.5 : 1 }}>
              Envoyer le devis <I.send size={15}/>
            </button>
            <button className="k-btn k-btn-secondary" style={{ width: "100%", marginTop: 8 }}>
              Enregistrer brouillon
            </button>

            <div className="k-caption" style={{ marginTop: 14, color: "var(--k-text-muted)", fontSize: 11, lineHeight: 1.5, textAlign: "center" }}>
              Valable {validityDays} jour{validityDays > 1 ? "s" : ""} après envoi.
              Le client peut accepter, refuser ou demander un ajustement.
            </div>
          </div>

          <div style={{
            marginTop: 16, padding: 16,
            background: "var(--k-surface-primary)", borderRadius: "var(--k-r-md)",
            display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <I.sparkles size={16} color="var(--k-primary)" style={{ marginTop: 2, flexShrink: 0 }}/>
            <div style={{ fontSize: 12, color: "var(--k-text-body)", lineHeight: 1.55 }}>
              <strong>Conseil KAYOU :</strong> les devis détaillés (3+ lignes) sont acceptés 2× plus souvent que les forfaits uniques.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────

function WebLineItem({ line, onChange, onRemove }) {
  const total = line.qty * line.unitPrice;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 100px 120px 120px 36px",
      gap: 12, padding: "12px 4px", alignItems: "center",
      borderBottom: "1px solid var(--k-border-subtle)",
    }}>
      <input value={line.label} onChange={e => onChange(line.id, { label: e.target.value })}
        placeholder="Description de la prestation"
        style={qcInput}/>
      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
        <input type="number" min={0} step={0.5} value={line.qty}
          onChange={e => onChange(line.id, { qty: parseFloat(e.target.value) || 0 })}
          style={{ ...qcInput, width: 52, textAlign: "center", fontFamily: "var(--k-font-mono)" }}/>
        <select value={line.unit} onChange={e => onChange(line.id, { unit: e.target.value })}
          style={{ ...qcInput, padding: "6px 4px", fontSize: 12 }}>
          <option>Heure</option>
          <option>Forfait</option>
          <option>Pièce</option>
          <option>Jour</option>
          <option>m²</option>
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
        <input type="number" min={0} step={500} value={line.unitPrice}
          onChange={e => onChange(line.id, { unitPrice: parseInt(e.target.value) || 0 })}
          style={{ ...qcInput, width: 80, textAlign: "right", fontFamily: "var(--k-font-mono)" }}/>
        <span style={{ fontSize: 11, color: "var(--k-text-muted)" }}>FC</span>
      </div>
      <div className="k-price" style={{ textAlign: "right", fontSize: 14, color: "var(--k-text-primary)" }}>
        {total.toLocaleString("fr-FR")} FC
      </div>
      <button onClick={() => onRemove(line.id)} style={qcIconBtn} title="Supprimer la ligne">
        <I.trash size={14}/>
      </button>
    </div>
  );
}

function MobileLineItem({ line, onChange, onRemove }) {
  const total = line.qty * line.unitPrice;
  return (
    <div style={{
      background: "var(--k-surface)", border: "1px solid var(--k-border)",
      borderRadius: 12, padding: 12,
    }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
        <input value={line.label} onChange={e => onChange(line.id, { label: e.target.value })}
          placeholder="Description"
          style={{ ...qcInput, flex: 1, fontWeight: 500, fontSize: 14 }}/>
        <button onClick={() => onRemove(line.id)} style={qcIconBtn}>
          <I.trash size={13}/>
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr", gap: 8, alignItems: "center" }}>
        <input type="number" min={0} step={0.5} value={line.qty}
          onChange={e => onChange(line.id, { qty: parseFloat(e.target.value) || 0 })}
          style={{ ...qcInput, textAlign: "center", fontFamily: "var(--k-font-mono)" }}/>
        <select value={line.unit} onChange={e => onChange(line.id, { unit: e.target.value })}
          style={{ ...qcInput, fontSize: 12 }}>
          <option>Heure</option>
          <option>Forfait</option>
          <option>Pièce</option>
          <option>Jour</option>
          <option>m²</option>
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="number" min={0} step={500} value={line.unitPrice}
            onChange={e => onChange(line.id, { unitPrice: parseInt(e.target.value) || 0 })}
            style={{ ...qcInput, textAlign: "right", fontFamily: "var(--k-font-mono)" }}/>
          <span style={{ fontSize: 11, color: "var(--k-text-muted)" }}>FC</span>
        </div>
      </div>
      <div style={{
        marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--k-border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11 }}>Total ligne</span>
        <span className="k-price" style={{ fontSize: 14, color: "var(--k-text-primary)" }}>
          {total.toLocaleString("fr-FR")} FC
        </span>
      </div>
    </div>
  );
}

function Section({ title, count, children, mobile }) {
  if (!mobile) return children;
  return (
    <div style={{ padding: "8px 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em", margin: 0, color: "var(--k-text-primary)" }}>
          {title}
        </h3>
        {count !== undefined && (
          <span className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11 }}>
            {count} ligne{count > 1 ? "s" : ""}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function DetailRow({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", gap: 12 }}>
      <span className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 12.5, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, maxWidth: 200, display: "flex", justifyContent: "flex-end" }}>{children}</div>
    </div>
  );
}

function DiscountRow({ value, onChange, compact }) {
  const presets = [0, 5, 10, 15];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: compact ? "flex-end" : "flex-start" }}>
      {presets.map(p => (
        <button key={p} onClick={() => onChange(p)} style={{
          padding: "6px 11px", borderRadius: 999,
          border: value === p ? "1px solid var(--k-primary)" : "1px solid var(--k-border)",
          background: value === p ? "var(--k-surface-primary)" : "white",
          color: value === p ? "var(--k-primary)" : "var(--k-text-body)",
          fontSize: 12.5, fontWeight: value === p ? 600 : 500, cursor: "pointer",
          fontFamily: "var(--k-font-mono)", letterSpacing: "-0.01em",
        }}>
          {p === 0 ? "Aucune" : `-${p}%`}
        </button>
      ))}
    </div>
  );
}

function TotalRow({ label, value, bold, big, muted, small, accent }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: big ? "4px 0" : "3px 0",
    }}>
      <span style={{
        fontSize: small ? 12 : (big ? 14 : 13),
        color: muted ? "var(--k-text-muted)" : "var(--k-text-body)",
        fontWeight: bold && !big ? 600 : 400,
      }}>
        {label}
      </span>
      <span className="k-price" style={{
        fontSize: big ? 22 : (small ? 13 : 14),
        color: accent ? "var(--k-primary)" : (muted ? "var(--k-text-muted)" : "var(--k-text-primary)"),
        fontWeight: bold ? 700 : 600,
        fontFamily: big ? "var(--k-font-display)" : "var(--k-font-mono)",
        letterSpacing: big ? "-0.02em" : "-0.01em",
      }}>
        {value < 0 ? "−" : ""}{Math.abs(value).toLocaleString("fr-FR")} FC
      </span>
    </div>
  );
}

function ReqFact({ icon, label, value }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: "var(--k-text-muted)" }}>
        {icon}
        <span style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 13.5, color: "var(--k-text-primary)", fontWeight: 500, lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

// ─── Success state ──────────────────────────────────────────────────────

function QuoteSent({ req, total, mobile, nav }) {
  return (
    <div style={{
      minHeight: mobile ? "100%" : 680,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: mobile ? "40px 24px" : 60, textAlign: "center",
    }}>
      <div style={{
        width: 84, height: 84, borderRadius: "50%",
        background: "var(--k-success-subtle)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--k-success)", marginBottom: 24,
        boxShadow: "0 0 0 8px rgba(22,163,74,0.08)",
      }}>
        <I.check size={36} stroke={2.5}/>
      </div>
      <h2 style={{
        fontFamily: "var(--k-font-display)", fontWeight: 700,
        fontSize: mobile ? 24 : 30, letterSpacing: "-0.02em",
        margin: "0 0 10px",
      }}>
        Devis envoyé à {req.clientName.split(" ")[0]}
      </h2>
      <p className="k-body-l" style={{ color: "var(--k-text-muted)", maxWidth: 420, margin: "0 0 28px", lineHeight: 1.5 }}>
        Vous serez notifié·e dès que le client répond.
        La plupart des clients décident en moins de 2h.
      </p>

      <div style={{
        background: "var(--k-surface)", border: "1px solid var(--k-border)",
        borderRadius: 14, padding: 18, minWidth: mobile ? 0 : 360, width: "100%", maxWidth: 400,
        boxShadow: "var(--k-e1)", marginBottom: 28,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span className="k-caption" style={{ color: "var(--k-text-muted)" }}>{req.service}</span>
          <span className="k-price" style={{ fontSize: 15, color: "var(--k-text-primary)" }}>
            {total.toLocaleString("fr-FR")} FC
          </span>
        </div>
        <div className="k-caption" style={{ color: "var(--k-text-muted)", fontSize: 11 }}>
          Envoyé à l'instant · en attente de réponse
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexDirection: mobile ? "column" : "row", width: "100%", maxWidth: 400 }}>
        <button onClick={() => nav("requests")} className="k-btn k-btn-primary k-btn-lg" style={{ flex: 1 }}>
          Voir autres demandes
        </button>
        <button onClick={() => nav("provider")} className="k-btn k-btn-secondary k-btn-lg" style={{ flex: 1 }}>
          Tableau de bord
        </button>
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────

const qcIconBtn = {
  width: 34, height: 34, borderRadius: 10,
  border: "1px solid var(--k-border)", background: "white",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--k-text-muted)", cursor: "pointer", flexShrink: 0,
};

const qcInput = {
  border: "1px solid var(--k-border)", borderRadius: 8,
  padding: "8px 10px", fontSize: 13, fontFamily: "var(--k-font-body)",
  background: "white", color: "var(--k-text-primary)", outline: "none",
  width: "100%",
};

const qcTextarea = {
  width: "100%", border: "1px solid var(--k-border)", borderRadius: 10,
  padding: 12, fontSize: 13.5, fontFamily: "var(--k-font-body)",
  color: "var(--k-text-primary)", background: "var(--k-surface-muted)",
  outline: "none", resize: "vertical", lineHeight: 1.5,
};

const qcSelect = {
  border: "1px solid var(--k-border)", borderRadius: 8,
  padding: "7px 10px", fontSize: 13, fontFamily: "var(--k-font-body)",
  background: "white", color: "var(--k-text-primary)", cursor: "pointer",
  outline: "none",
};

const qcPresetBtn = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "12px 14px", borderRadius: 10,
  border: "1px solid var(--k-border)", background: "white",
  fontSize: 13, fontFamily: "var(--k-font-body)", color: "var(--k-text-body)",
  cursor: "pointer", textAlign: "left",
};

const qcPresetChip = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "7px 12px", borderRadius: 999,
  border: "1px solid var(--k-border)", background: "var(--k-surface-muted)",
  fontSize: 12.5, fontFamily: "var(--k-font-body)", color: "var(--k-text-body)",
  cursor: "pointer", fontWeight: 500,
};

Object.assign(window, { QuoteCompose });
