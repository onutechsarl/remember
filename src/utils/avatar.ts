/** Initiales d'un nom : « Tantine Marie » → « TM », « Awa » → « AW », « Paul (cousin) » → « PC ». */
export function initials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.length === 1 ? Array.from(words[0]).slice(0, 2) : [Array.from(words[0])[0], Array.from(words[1])[0]];
  return letters.join('').toLocaleUpperCase();
}

/** Indice stable dans une liste de `count` couleurs, calculé à partir d'un identifiant. */
export function stableIndex(id: string, count: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % count;
}
