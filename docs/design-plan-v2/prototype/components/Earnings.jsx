// Earnings — pro-side weekly summary, Mobile Money payouts, transactions.
// This is the differentiator for DRC/Congo-B; Mobile Money is first-class.

const EARNINGS_WEEKLY = [
  { day: "Lun", amount: 12000 },
  { day: "Mar", amount: 28000 },
  { day: "Mer", amount: 18000 },
  { day: "Jeu", amount: 22000 },
  { day: "Ven", amount: 34000 },
  { day: "Sam", amount: 10000, isToday: true },
  { day: "Dim", amount: 0, isFuture: true },
];

const TRANSACTIONS = [
  {
    id: "t1", type: "earning", at: "Il y a 2h",
    label: "Réparation fuite · Famille Mutombo",
    amount: 22000, fee: -1540, net: 20460,
    status: "pending", paymentMethod: "cash",
  },
  {
    id: "t2", type: "payout", at: "Hier · 16:42",
    label: "Virement vers M-Pesa",
    amount: -85000, method: "M-Pesa",
    status: "completed", ref: "MP-7X42ZC",
  },
  {
    id: "t3", type: "earning", at: "Hier · 11:15",
    label: "Installation robinet · Joseph Mbuyi",
    amount: 28000, fee: -1960, net: 26040,
    status: "completed", paymentMethod: "mpesa",
  },
  {
    id: "t4", type: "earning", at: "Mar 15 · 14:30",
    label: "Débouchage · Marie K.",
    amount: 15000, fee: -1050, net: 13950,
    status: "completed", paymentMethod: "airtel",
  },
  {
    id: "t5", type: "earning", at: "Lun 14 · 09:00",
    label: "Fuite chauffe-eau · Papa Léon",
    amount: 34000, fee: -2380, net: 31620,
    status: "completed", paymentMethod: "cash",
  },
  {
    id: "t6", type: "bonus", at: "Lun 14 · 00:01",
    label: "Bonus « 10 missions ★ 4.9+ »",
    amount: 5000,
    status: "completed",
  },
];

function MoneyBar({ day, max, color }) {
  const h = day.amount === 0 ? 2 : Math.max(6, (day.amount / max) * 100);
  const isToday = day.isToday;
  const isFuture = day.isFuture;
  return (
    <div style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6}}>
      <div style={{
        height: 100, width: "100%", display: "flex", alignItems: "flex-end",
        justifyContent: "center", padding: "0 2px",
      }}>
        <div style={{
          width: "100%", height: `${h}%`, borderRadius: 6,
          background: isFuture
            ? "var(--k-surface-muted)"
            : isToday
              ? `linear-gradient(to top, ${color}, ${color}bb)`
              : `linear-gradient(to top, ${color}88, ${color}44)`,
          boxShadow: isToday ? `0 0 0 2px var(--k-bg), 0 0 0 3.5px ${color}` : "none",
          transition: "height 320ms var(--k-ease-emph)",
        }}/>
      </div>
      <span style={{
        fontFamily: "var(--k-font-mono)", fontSize: 10.5, fontWeight: 500,
        color: isToday ? color : isFuture ? "var(--k-text-subtle)" : "var(--k-text-muted)",
        letterSpacing: "0.04em", textTransform: "uppercase",
      }}>
        {day.day}
      </span>
    </div>
  );
}

function MoneyChart() {
  const max = Math.max(...EARNINGS_WEEKLY.map(d => d.amount), 1);
  const total = EARNINGS_WEEKLY.reduce((s, d) => s + d.amount, 0);
  const lastWeek = 108000;
  const change = ((total - lastWeek) / lastWeek) * 100;
  const up = change > 0;
  return (
    <div>
      <div style={{display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, gap: 12}}>
        <div>
          <div className="k-caption" style={{color:"var(--k-text-muted)", marginBottom: 4}}>Cette semaine</div>
          <div style={{
            fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 30,
            letterSpacing: "-0.025em", lineHeight: 1,
          }}>
            <span className="k-num">{total.toLocaleString("fr-FR")}</span>
            <span style={{fontSize: 18, color: "var(--k-text-muted)", marginLeft: 4, fontWeight: 600}}>FC</span>
          </div>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: up ? "var(--k-success-subtle)" : "var(--k-danger-subtle)",
          color: up ? "#047857" : "#BE123C",
          padding: "4px 10px", borderRadius: 999,
          fontSize: 12, fontWeight: 700, fontFamily: "var(--k-font-mono)",
        }}>
          <span style={{fontSize: 13}}>{up ? "↑" : "↓"}</span>
          {Math.abs(change).toFixed(0)}%
        </div>
      </div>
      <div style={{display: "flex", gap: 6, alignItems: "flex-end"}}>
        {EARNINGS_WEEKLY.map((d, i) => (
          <MoneyBar key={i} day={d} max={max} color="var(--k-primary)"/>
        ))}
      </div>
    </div>
  );
}

function PayoutMethodRow({ op, balance, selected, onClick, mobile }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: mobile ? "12px 14px" : "14px 16px", width: "100%",
      border: `2px solid ${selected ? op.color : "var(--k-border-subtle)"}`,
      background: "white", borderRadius: 14, cursor: "pointer",
      textAlign: "left",
      transition: "border-color 140ms",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: op.color, color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 18,
      }}>{op.init}</div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontFamily: "var(--k-font-display)", fontWeight: 600, fontSize: 14.5}}>{op.name}</div>
        <div className="k-caption" style={{color:"var(--k-text-muted)", marginTop: 1}}>
          {op.number}
        </div>
      </div>
      {selected && (
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: op.color, color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><I.check size={14} stroke={2.5}/></div>
      )}
    </button>
  );
}

function TransactionRow({ tx, last, mobile }) {
  const isEarning = tx.type === "earning";
  const isPayout = tx.type === "payout";
  const isBonus = tx.type === "bonus";

  const iconColor = isPayout ? "var(--k-primary)" : isBonus ? "var(--k-accent)" : "var(--k-success)";
  const iconBg    = isPayout ? "var(--k-primary-subtle)" : isBonus ? "var(--k-accent-subtle)" : "var(--k-success-subtle)";
  const iconNode  = isPayout ? <I.arrowRight size={18}/> : isBonus ? <I.sparkles size={18}/> : <I.check size={18}/>;

  const methodChip = tx.paymentMethod === "cash" ? { label: "Cash", bg: "var(--k-warning-subtle)", color: "#B45309" }
                   : tx.paymentMethod === "mpesa" ? { label: "M-Pesa", bg: "#ECFDF5", color: "#10B981" }
                   : tx.paymentMethod === "airtel" ? { label: "Airtel", bg: "#FEF2F2", color: "#E11D48" }
                   : tx.paymentMethod === "orange" ? { label: "Orange", bg: "#FFF7ED", color: "#F97316" }
                   : null;

  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "center",
      padding: mobile ? "12px 0" : "14px 4px",
      borderBottom: last ? 0 : "1px solid var(--k-border-subtle)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: iconBg, color: iconColor,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{iconNode}</div>

      <div style={{flex: 1, minWidth: 0}}>
        <div style={{
          fontFamily: "var(--k-font-body)", fontWeight: 600, fontSize: 14,
          color: "var(--k-text-primary)",
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 1, overflow: "hidden",
        }}>
          {tx.label}
        </div>
        <div style={{display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap"}}>
          <span className="k-caption" style={{color:"var(--k-text-muted)"}}>{tx.at}</span>
          {methodChip && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
              background: methodChip.bg, color: methodChip.color,
              fontFamily: "var(--k-font-mono)", letterSpacing: "0.02em",
            }}>{methodChip.label}</span>
          )}
          {tx.status === "pending" && (
            <span className="k-chip k-chip-sm k-chip-warning">En attente</span>
          )}
          {tx.ref && (
            <span className="k-caption" style={{color:"var(--k-text-subtle)", fontFamily: "var(--k-font-mono)"}}>
              {tx.ref}
            </span>
          )}
        </div>
      </div>

      <div style={{textAlign: "right", flexShrink: 0}}>
        <div className="k-price" style={{
          fontSize: 14.5,
          color: tx.amount < 0 ? "var(--k-text-primary)" : isEarning || isBonus ? "var(--k-success)" : "var(--k-text-primary)",
          fontWeight: 600,
        }}>
          {tx.amount > 0 && "+"}{tx.amount.toLocaleString("fr-FR")} <span style={{color:"var(--k-text-muted)", fontSize: 12}}>FC</span>
        </div>
        {tx.fee && (
          <div className="k-caption" style={{color:"var(--k-text-muted)", marginTop: 2, fontSize: 11}}>
            Net : <span className="k-num">{tx.net.toLocaleString("fr-FR")}</span> FC
          </div>
        )}
      </div>
    </div>
  );
}

function PayoutSheet({ open, onClose, mobile, operators, selected, setSelected, amount, setAmount, balance }) {
  if (!open) return null;
  const fee = Math.max(500, Math.round(amount * 0.015));
  const receiving = amount - fee;
  const invalid = amount <= 0 || amount > balance;

  const Body = () => (
    <>
      <div style={{marginBottom: 18}}>
        <div className="k-caption" style={{color:"var(--k-text-muted)", marginBottom: 6}}>Montant à retirer</div>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 6, padding: "14px 16px",
          background: "var(--k-bg)", borderRadius: 12,
        }}>
          <input
            type="text" inputMode="numeric"
            value={amount === 0 ? "" : amount.toLocaleString("fr-FR")}
            onChange={(e) => setAmount(parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
            placeholder="0"
            style={{
              flex: 1, border: 0, outline: "none", background: "transparent",
              fontFamily: "var(--k-font-display)", fontWeight: 700, fontSize: 30,
              letterSpacing: "-0.02em", color: "var(--k-text-primary)",
            }}
          />
          <span style={{fontFamily: "var(--k-font-mono)", fontWeight: 600, fontSize: 16, color:"var(--k-text-muted)"}}>FC</span>
        </div>
        <div style={{display:"flex", gap: 6, marginTop: 10}}>
          {[25000, 50000, 100000, balance].map((v, i) => (
            <button key={i} onClick={() => setAmount(v)} style={{
              flex: 1, padding: "8px 4px", borderRadius: 10, border: "1px solid var(--k-border)",
              background: amount === v ? "var(--k-primary-subtle)" : "white",
              color: amount === v ? "var(--k-primary-hover)" : "var(--k-text-body)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--k-font-mono)",
            }}>
              {i === 3 ? "Tout" : `${(v/1000).toFixed(0)}k`}
            </button>
          ))}
        </div>
        <div className="k-caption" style={{color:"var(--k-text-muted)", marginTop: 8}}>
          Solde disponible : <span className="k-price" style={{color:"var(--k-text-primary)"}}>{balance.toLocaleString("fr-FR")} FC</span>
        </div>
      </div>

      <div className="k-caption" style={{color:"var(--k-text-muted)", marginBottom: 8}}>Envoyer vers</div>
      <div style={{display: "flex", flexDirection: "column", gap: 8, marginBottom: 18}}>
        {operators.map(op => (
          <PayoutMethodRow key={op.id} op={op} mobile={mobile}
            selected={selected === op.id} onClick={() => setSelected(op.id)}/>
        ))}
      </div>

      {amount > 0 && !invalid && (
        <div style={{
          padding: "12px 14px", background: "var(--k-surface-primary)",
          borderRadius: 12, marginBottom: 14,
        }}>
          <div style={{display:"flex", justifyContent:"space-between", fontSize: 13, marginBottom: 4}}>
            <span style={{color:"var(--k-text-muted)"}}>Montant</span>
            <span className="k-price">{amount.toLocaleString("fr-FR")} FC</span>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", fontSize: 13, marginBottom: 4}}>
            <span style={{color:"var(--k-text-muted)"}}>Frais ({((fee/amount)*100).toFixed(1)}%)</span>
            <span className="k-price" style={{color:"var(--k-text-body)"}}>− {fee.toLocaleString("fr-FR")} FC</span>
          </div>
          <div style={{
            display:"flex", justifyContent:"space-between", fontSize: 14, fontWeight: 700,
            paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--k-border-subtle)",
          }}>
            <span>Vous recevez</span>
            <span className="k-price" style={{color:"var(--k-success)"}}>{receiving.toLocaleString("fr-FR")} FC</span>
          </div>
        </div>
      )}

      <button className="k-btn k-btn-primary k-btn-lg" style={{
        width:"100%",
        opacity: invalid ? 0.5 : 1, cursor: invalid ? "not-allowed" : "pointer",
      }} disabled={invalid}>
        Virer maintenant
      </button>
      <div className="k-caption" style={{textAlign:"center", marginTop: 10, color:"var(--k-text-muted)"}}>
        Arrive généralement en moins de 2 minutes.
      </div>
    </>
  );

  if (mobile) {
    return (
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, zIndex: 60,
        background: "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "flex-end",
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: "100%", background: "white",
          borderRadius: "20px 20px 0 0", padding: "14px 20px 28px",
          boxShadow: "0 -10px 30px rgba(15,23,42,0.18)",
          animation: "kslide-up 280ms var(--k-ease-emph)",
        }}>
          <div style={{
            width: 40, height: 4, borderRadius: 999, background: "var(--k-border-strong)",
            margin: "0 auto 14px",
          }}/>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 18}}>
            <div style={{fontFamily:"var(--k-font-display)", fontWeight: 700, fontSize: 19}}>Retirer vers Mobile Money</div>
            <button onClick={onClose} style={{background:"transparent", border:0, cursor:"pointer", color:"var(--k-text-muted)", padding: 4}}>
              <I.x size={20}/>
            </button>
          </div>
          <Body/>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 480, maxWidth: "92vw", background: "white",
        borderRadius: 20, padding: "24px 28px 28px",
        boxShadow: "0 30px 60px rgba(15,23,42,0.3)",
        animation: "kscale-in 240ms var(--k-ease-emph)",
      }}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 20}}>
          <div style={{fontFamily:"var(--k-font-display)", fontWeight: 700, fontSize: 22, letterSpacing:"-0.01em"}}>
            Retirer vers Mobile Money
          </div>
          <button onClick={onClose} style={{background:"transparent", border:0, cursor:"pointer", color:"var(--k-text-muted)", padding: 4}}>
            <I.x size={22}/>
          </button>
        </div>
        <Body/>
      </div>
    </div>
  );
}

function Earnings({ nav, mobile }) {
  const balance = 89500;
  const pending = 22000;
  const allTime = 1240000;
  const operators = [
    { ...MM_OPERATORS[0], number: "+243 897 ••• 456" },
    { ...MM_OPERATORS[1], number: "+243 991 ••• 102" },
    { ...MM_OPERATORS[2], number: "Non configuré", unconfigured: true },
  ].filter(op => !op.unconfigured || false); // keep all for demo

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [selectedOp, setSelectedOp] = React.useState("mpesa");
  const [payoutAmount, setPayoutAmount] = React.useState(balance);

  const Header = () => (
    <>
      <div className="k-overline" style={{color:"var(--k-accent)", marginBottom: 6}}>Espace pro</div>
      <h1 className="k-display-m" style={{margin: "0 0 6px"}}>Mes gains</h1>
      <div className="k-body-m" style={{color:"var(--k-text-muted)"}}>
        Virement Mobile Money en moins de 2 minutes, à toute heure.
      </div>
    </>
  );

  // Balance card (same on web + mobile, sized differently)
  const BalanceCard = () => (
    <div style={{
      background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
      color: "white", borderRadius: 20, padding: mobile ? 20 : 24,
      position: "relative", overflow: "hidden",
      boxShadow: "0 20px 40px -20px rgba(15,23,42,0.5)",
    }}>
      {/* Decoration */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 180, height: 180, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14,165,233,0.35) 0%, transparent 70%)",
      }}/>
      <div style={{position: "relative"}}>
        <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 10, opacity: 0.75}}>
          <I.coins size={14}/>
          <span className="k-overline" style={{color: "white", opacity: 0.8}}>Solde disponible</span>
        </div>
        <div style={{
          fontFamily: "var(--k-font-display)", fontWeight: 700,
          fontSize: mobile ? 40 : 52, letterSpacing: "-0.035em", lineHeight: 1, marginBottom: 12,
        }}>
          <span className="k-num">{balance.toLocaleString("fr-FR")}</span>
          <span style={{fontSize: mobile ? 20 : 24, fontWeight: 600, marginLeft: 6, opacity: 0.7}}>FC</span>
        </div>
        <div style={{display: "flex", gap: mobile ? 14 : 24, marginBottom: 18, flexWrap: "wrap"}}>
          <div>
            <div className="k-caption" style={{opacity: 0.6, color: "white"}}>En attente</div>
            <div className="k-price" style={{fontSize: 14, marginTop: 2, opacity: 0.9}}>
              {pending.toLocaleString("fr-FR")} FC
            </div>
          </div>
          <div>
            <div className="k-caption" style={{opacity: 0.6, color: "white"}}>Total cumulé</div>
            <div className="k-price" style={{fontSize: 14, marginTop: 2, opacity: 0.9}}>
              {(allTime/1000).toFixed(0)}k FC
            </div>
          </div>
        </div>
        <button onClick={() => setSheetOpen(true)} style={{
          width: "100%", height: 48, borderRadius: 12, border: 0, cursor: "pointer",
          background: "white", color: "var(--k-text-primary)",
          fontFamily: "var(--k-font-body)", fontWeight: 700, fontSize: 15,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
        }}>
          <I.arrowRight size={17}/> Retirer vers Mobile Money
        </button>
      </div>
    </div>
  );

  // Quick tips / bonus
  const BonusCard = () => (
    <div style={{
      border: "1px dashed var(--k-accent)", borderRadius: 14, padding: mobile ? 14 : 16,
      background: "var(--k-accent-subtle)", display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: "white", color: "var(--k-accent)",
        display: "flex", alignItems:"center", justifyContent:"center",
      }}><I.sparkles size={20}/></div>
      <div style={{flex: 1}}>
        <div style={{fontFamily:"var(--k-font-display)", fontWeight: 600, fontSize: 14.5, color: "var(--k-text-primary)"}}>
          Bonus débloqué à 15 missions
        </div>
        <div className="k-caption" style={{color:"var(--k-text-body)", marginTop: 3, lineHeight: 1.5}}>
          Encore <strong>4 missions à 4,8 ★+</strong> cette semaine pour toucher <strong>10 000 FC</strong> de bonus fidélité.
        </div>
        <div style={{marginTop: 8, height: 5, background: "white", borderRadius: 999, overflow: "hidden"}}>
          <div style={{height: "100%", width: "73%", background: "var(--k-accent)", borderRadius: 999}}/>
        </div>
      </div>
    </div>
  );

  const ChartCard = () => (
    <div style={{
      background: "white", border: "1px solid var(--k-border-subtle)", borderRadius: 16,
      padding: mobile ? 18 : 22,
    }}>
      <MoneyChart/>
    </div>
  );

  const TxList = () => (
    <div style={{
      background: "white", border: "1px solid var(--k-border-subtle)", borderRadius: 16,
      padding: mobile ? "4px 16px 8px" : "8px 20px 12px",
    }}>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding: mobile ? "14px 0 8px" : "16px 0 12px",
        borderBottom: "1px solid var(--k-border-subtle)",
      }}>
        <div style={{fontFamily:"var(--k-font-display)", fontWeight: 600, fontSize: 15.5}}>
          Transactions
        </div>
        <button style={{
          background:"transparent", border:0, cursor:"pointer",
          color:"var(--k-primary-hover)", fontSize: 13, fontWeight: 600,
        }}>
          Tout voir
        </button>
      </div>
      {TRANSACTIONS.map((tx, i) => (
        <TransactionRow key={tx.id} tx={tx} last={i === TRANSACTIONS.length - 1} mobile={mobile}/>
      ))}
    </div>
  );

  if (mobile) {
    return (
      <div style={{paddingBottom: 110, position: "relative"}}>
        <div style={{padding: "18px 20px 10px"}}>
          <Header/>
        </div>
        <div style={{padding: "0 20px", display: "flex", flexDirection: "column", gap: 14}}>
          <BalanceCard/>
          <ChartCard/>
          <BonusCard/>
          <TxList/>
        </div>
        <PayoutSheet
          open={sheetOpen} onClose={() => setSheetOpen(false)} mobile={true}
          operators={operators} selected={selectedOp} setSelected={setSelectedOp}
          amount={payoutAmount} setAmount={setPayoutAmount} balance={balance}
        />
      </div>
    );
  }

  // WEB
  return (
    <div style={{maxWidth: 1100, margin: "0 auto", padding: "32px 32px 48px"}}>
      <div style={{marginBottom: 24, display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap: 16}}>
        <div>
          <Header/>
        </div>
        <button className="k-btn k-btn-secondary" onClick={() => nav("provider")}>
          Dashboard pro <I.arrowRight size={14}/>
        </button>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 20, marginBottom: 20}}>
        <BalanceCard/>
        <ChartCard/>
      </div>

      <div style={{marginBottom: 20}}>
        <BonusCard/>
      </div>

      <TxList/>

      <PayoutSheet
        open={sheetOpen} onClose={() => setSheetOpen(false)} mobile={false}
        operators={operators} selected={selectedOp} setSelected={setSelectedOp}
        amount={payoutAmount} setAmount={setPayoutAmount} balance={balance}
      />
    </div>
  );
}

Object.assign(window, { Earnings });

if (!document.getElementById("kslide-up-style")) {
  const s = document.createElement("style");
  s.id = "kslide-up-style";
  s.textContent = `@keyframes kslide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`;
  document.head.appendChild(s);
}
