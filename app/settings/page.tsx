"use client";

import Link from "next/link";
import { useProfilesStore } from "@/lib/profiles";
import { ageLabel } from "@/lib/date";
import { stageFor, STAGE_DISCLAIMER } from "@/lib/stages";
import { Card } from "@/components/common";
import { CloseIcon } from "@/components/icons";

const COLOR_PRESETS = [
  "var(--color-autumn)",
  "var(--color-alma)",
  "var(--color-amber)",
  "var(--color-cat-fruit)",
  "var(--color-cat-dairy)",
  "var(--color-cat-grain)",
  "var(--color-cat-veg)",
  "var(--color-alert)",
];

export default function SettingsPage() {
  const { profiles, ready, updateProfile } = useProfilesStore();

  return (
    <div className="animate-soft-in">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-ink-faint">
            Settings
          </p>
          <h1 className="mt-1 font-serif text-[2rem] leading-tight text-ink">
            You &amp; the girls
          </h1>
        </div>
        <Link
          href="/"
          aria-label="Done"
          className="mt-1 grid h-9 w-9 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:bg-paper-sunk"
        >
          <CloseIcon className="h-5 w-5" />
        </Link>
      </header>

      {ready && (
        <div className="space-y-5">
          {profiles.map((p) => {
            const stage = p.birthday ? stageFor(p.birthday) : null;
            return (
              <Card key={p.id} className="p-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ background: p.colorVar }}
                  />
                  <span className="font-serif text-[1.3rem] text-ink">
                    {p.name}
                  </span>
                  {p.birthday && (
                    <span className="ml-auto rounded-full bg-paper-sunk px-2.5 py-1 text-[12px] font-medium text-ink-soft">
                      {ageLabel(p.birthday)}
                    </span>
                  )}
                </div>

                <Field label="Name">
                  <input
                    value={p.name}
                    onChange={(e) => updateProfile(p.id, { name: e.target.value })}
                    className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-amber-soft focus:bg-paper-raised"
                  />
                </Field>

                <Field label="Birthday">
                  <input
                    type="date"
                    value={p.birthday ?? ""}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) =>
                      updateProfile(p.id, {
                        birthday: e.target.value || undefined,
                      })
                    }
                    className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-amber-soft focus:bg-paper-raised"
                  />
                  {stage && (
                    <p className="mt-2 px-1 text-[12.5px] leading-relaxed text-ink-soft">
                      <span className="font-medium text-ink">{stage.title}.</span>{" "}
                      {stage.tip}
                    </p>
                  )}
                </Field>

                <Field label="Colour">
                  <div className="flex flex-wrap gap-2.5">
                    {COLOR_PRESETS.map((c) => {
                      const active = p.colorVar === c;
                      return (
                        <button
                          key={c}
                          aria-label="Choose colour"
                          onClick={() => updateProfile(p.id, { colorVar: c })}
                          className={`h-8 w-8 rounded-full transition-transform active:scale-90 ${
                            active
                              ? "ring-2 ring-ink ring-offset-2 ring-offset-paper-raised"
                              : ""
                          }`}
                          style={{ background: c }}
                        />
                      );
                    })}
                  </div>
                </Field>
              </Card>
            );
          })}

          <p className="px-1 text-center text-[11.5px] leading-relaxed text-ink-faint">
            {STAGE_DISCLAIMER}
          </p>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </div>
      {children}
    </div>
  );
}
