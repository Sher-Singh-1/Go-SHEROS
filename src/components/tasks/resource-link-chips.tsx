import type { ResourceLink } from "@/lib/tasks/resource-links";

export function ResourceLinkChips({ links }: { links: ResourceLink[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((link, i) =>
        link.url ? (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-border-strong px-2.5 py-1 text-xs font-medium text-teal hover:bg-teal-soft"
          >
            {link.name} ↗
          </a>
        ) : (
          <span key={i} className="rounded-full border border-border-strong px-2.5 py-1 text-xs text-ink-faint">
            {link.name}
          </span>
        )
      )}
    </div>
  );
}
