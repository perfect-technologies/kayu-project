export function Greeting({
  firstName,
  summary,
  isDesktop,
}: {
  firstName: string;
  summary: string;
  isDesktop: boolean;
}) {
  return (
    <header style={{ marginBottom: 14 }}>
      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: isDesktop ? 26 : 22,
          fontWeight: 700,
          letterSpacing: "-0.015em",
          color: "var(--k-text-primary)",
          margin: 0,
        }}
      >
        Bonjour {firstName}
        {isDesktop && (
          <span style={{ fontWeight: 400, color: "var(--k-text-body)" }}>
            {" — voici l'état de tes services"}
          </span>
        )}
      </h1>
      <p style={{ fontSize: 12.5, color: "var(--k-text-muted)", marginTop: 2, marginBottom: 0 }}>
        {summary}
      </p>
    </header>
  );
}
