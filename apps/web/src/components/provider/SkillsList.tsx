import type { ProviderPublic } from "@kayu/schemas";
import { providerCopy } from "@/copy/provider";

/** Reference skills then free-text skills as chips. Server-safe. */
export function SkillsList({ provider }: { provider: Pick<ProviderPublic, "skills" | "freeSkills"> }) {
  const chips = [...provider.skills.map((skill) => skill.label), ...provider.freeSkills];
  if (chips.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-extrabold text-foreground">{providerCopy.skills.title}</h2>
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <li key={`${chip}-${index}`} className="inline-flex min-h-9 items-center rounded-full bg-muted px-3 text-sm font-medium text-foreground/80">
            {chip}
          </li>
        ))}
      </ul>
    </section>
  );
}
