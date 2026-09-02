"use client";

import { useState } from "react";
import { TextInput } from "@/components/ui/field";

export type EditableLink = { name: string; url: string };

function labelFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Add/remove UI for a task's resource links, backed by a hidden "notes" field in bullet form. */
export function LinkListEditor({ initialLinks = [], notesFieldName = "notes" }: { initialLinks?: EditableLink[]; notesFieldName?: string }) {
  const [links, setLinks] = useState<EditableLink[]>(initialLinks);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  function addLink() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    const withProtocol = /^https?:\/\//.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
    setLinks((prev) => [...prev, { name: name.trim() || labelFromUrl(withProtocol), url: withProtocol }]);
    setName("");
    setUrl("");
  }

  const serialized = links.length ? links.map((l) => `- ${l.name}: ${l.url}`).join("\n") : "";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ink">Links</label>
      <input type="hidden" name={notesFieldName} value={serialized} />

      {links.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {links.map((link, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-2 py-1 pl-2.5 pr-1.5 text-xs">
              <span className="max-w-[10rem] truncate">{link.name}</span>
              <button
                type="button"
                onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${link.name}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-ink-faint hover:bg-danger-soft hover:text-danger"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <TextInput
          placeholder="Label (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-1/3"
        />
        <TextInput
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLink();
            }
          }}
          className="flex-1"
        />
        <button
          type="button"
          onClick={addLink}
          className="flex-none rounded-lg border border-border-strong px-3 text-sm font-medium text-ink-soft hover:bg-surface-2"
        >
          Add
        </button>
      </div>
    </div>
  );
}
