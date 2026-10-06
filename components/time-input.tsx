"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

/**
 * Parse a loosely-typed time into canonical 24-hour "HH:MM", or null if it
 * isn't a valid time. Accepts "9:00", "09:00", "0900", "930", "7h5", "23:59".
 */
export function normalizeTime(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const cleaned = value.toLowerCase().replace(/[h.\s]/g, ":");
  let hours: number;
  let minutes: number;

  if (cleaned.includes(":")) {
    const [h, m] = cleaned.split(":");
    if (h === "" || m === "" || !/^\d{1,2}$/.test(h) || !/^\d{1,2}$/.test(m)) {
      return null;
    }
    hours = Number(h);
    minutes = Number(m);
  } else {
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length === 3) {
      hours = Number(digits.slice(0, 1));
      minutes = Number(digits.slice(1));
    } else if (digits.length === 4) {
      hours = Number(digits.slice(0, 2));
      minutes = Number(digits.slice(2));
    } else {
      return null;
    }
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

type TimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
};

/**
 * A 24-hour time field. Native <input type="time"> renders AM/PM based on the
 * browser locale (not the page), so we use a plain text input and normalize to
 * "HH:MM" instead.
 */
export function TimeInput({ value, onChange, className, ...rest }: TimeInputProps) {
  const [display, setDisplay] = useState(value);
  const lastEmitted = useRef(value);

  useEffect(() => {
    // Only sync from the outside (e.g. entering edit mode) — not from our own
    // emissions, so half-typed values aren't clobbered.
    if (value !== lastEmitted.current) {
      setDisplay(value);
      lastEmitted.current = value;
    }
  }, [value]);

  const handleChange = (raw: string) => {
    setDisplay(raw);
    const normalized = normalizeTime(raw) ?? "";
    lastEmitted.current = normalized;
    onChange(normalized);
  };

  const handleBlur = () => {
    const normalized = normalizeTime(display);
    if (normalized) {
      setDisplay(normalized);
      lastEmitted.current = normalized;
      onChange(normalized);
    } else {
      setDisplay(lastEmitted.current);
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={5}
      placeholder="HH:MM"
      value={display}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={handleBlur}
      className={className}
      {...rest}
    />
  );
}
