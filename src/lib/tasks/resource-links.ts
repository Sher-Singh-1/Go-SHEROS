export type ResourceLink = { name: string; url: string | null };

/** Parses the "- Name: https://…" lines this app writes into a task's notes field. */
export function parseResourceLinks(notes: string | null | undefined): ResourceLink[] {
  if (!notes) return [];
  const links: ResourceLink[] = [];
  for (const line of notes.split("\n")) {
    const match = line.match(/^-\s*(.+?):\s*(https?:\/\/\S+)$/) || line.match(/^-\s*(.+)$/);
    if (!match) continue;
    links.push({ name: match[1].trim(), url: match[2]?.trim() ?? null });
  }
  return links;
}
