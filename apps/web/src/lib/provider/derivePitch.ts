export function derivePitch(description: string | null | undefined): string | null {
  if (!description) return null;
  const trimmed = description.trim();
  if (trimmed.length < 20) return null;

  const match = trimmed.match(/^([^.!?]+[.!?])/);
  const sentence = (match ? match[1] : trimmed).trim();

  if (sentence.length < 20) return null;
  if (sentence.length > 180) return sentence.slice(0, 177).trimEnd() + "…";
  return sentence;
}
