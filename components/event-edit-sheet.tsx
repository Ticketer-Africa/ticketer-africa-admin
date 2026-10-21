"use client";

import { useId, useState } from "react";
import { ActionSheet } from "@/components/actions/action-sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { auditKey } from "@/services/v2/audit";
import {
  EVENT_CATEGORY_LABELS,
  eventsKey,
  updateEventContent,
  type AdminEventDetail,
  type EventCategory,
  type EventContentInput,
} from "@/services/v2/events";

const LAGOS_OFFSET_MS = 60 * 60 * 1000;

/** ISO instant → "YYYY-MM-DDTHH:mm" in Lagos time, for a datetime-local input. */
function toLagosInput(iso: string): string {
  return new Date(new Date(iso).getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:mm" read as Lagos time → ISO instant. */
function fromLagosInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}:00.000Z`) - LAGOS_OFFSET_MS;
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

interface Draft {
  name: string;
  description: string;
  venueName: string;
  venueAddress: string;
  date: string;
  category: EventCategory;
}

function draftOf(event: AdminEventDetail): Draft {
  return {
    name: event.name,
    description: event.description ?? "",
    venueName: event.venueName ?? "",
    venueAddress: event.venueAddress ?? "",
    date: toLagosInput(event.date),
    category: event.category,
  };
}

interface EventEditSheetProps {
  event: AdminEventDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  available: boolean;
}

/**
 * Tier 1: the event's public details. Fees and access go through their own,
 * reasoned actions; ticket categories and the page layout stay with the
 * organizer's editor. Only changed fields are sent.
 */
export function EventEditSheet({ event, open, onOpenChange, available }: EventEditSheetProps) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(event));
  const ids = {
    name: useId(),
    description: useId(),
    venueName: useId(),
    venueAddress: useId(),
    date: useId(),
    category: useId(),
  };

  const original = draftOf(event);
  const changes: EventContentInput = {};
  if (draft.name.trim() !== original.name) changes.name = draft.name.trim();
  if (draft.description !== original.description) changes.description = draft.description;
  if (draft.venueName.trim() !== original.venueName) changes.venueName = draft.venueName.trim();
  if (draft.venueAddress.trim() !== original.venueAddress) changes.venueAddress = draft.venueAddress.trim();
  if (draft.category !== original.category) changes.category = draft.category;
  const dateIso = fromLagosInput(draft.date);
  if (draft.date !== original.date && dateIso) changes.date = dateIso;

  const nameMissing = draft.name.trim().length === 0;
  const dateInvalid = dateIso === null;
  const canSubmit = !nameMissing && !dateInvalid && Object.keys(changes).length > 0;

  function handleOpenChange(next: boolean) {
    if (next) setDraft(draftOf(event));
    onOpenChange(next);
  }

  const set = <K extends keyof Draft>(key: K) => (value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <ActionSheet
      tier={1}
      open={open}
      onOpenChange={handleOpenChange}
      available={available}
      title="Edit event details"
      description="What buyers see on the event page. Times are Lagos time."
      confirmLabel="Save changes"
      successMessage="Event updated"
      invalidate={[eventsKey, auditKey]}
      canSubmit={canSubmit}
      onSubmit={() => updateEventContent(event.id, changes)}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={ids.name}>Name</Label>
          <Input
            id={ids.name}
            value={draft.name}
            aria-invalid={nameMissing || undefined}
            onChange={(e) => set("name")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={ids.date}>Date and time</Label>
          <Input
            id={ids.date}
            type="datetime-local"
            className="num"
            value={draft.date}
            aria-invalid={dateInvalid || undefined}
            onChange={(e) => set("date")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={ids.category}>Category</Label>
          <Select value={draft.category} onValueChange={(v) => set("category")(v as EventCategory)}>
            <SelectTrigger id={ids.category}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={ids.venueName}>Venue</Label>
          <Input id={ids.venueName} value={draft.venueName} onChange={(e) => set("venueName")(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={ids.venueAddress}>Address</Label>
          <Input
            id={ids.venueAddress}
            value={draft.venueAddress}
            onChange={(e) => set("venueAddress")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={ids.description}>Description</Label>
          <Textarea
            id={ids.description}
            rows={6}
            value={draft.description}
            onChange={(e) => set("description")(e.target.value)}
          />
        </div>
      </div>
    </ActionSheet>
  );
}
