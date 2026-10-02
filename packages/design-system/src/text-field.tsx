import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };
export function TextField({ label, error, id, ...props }: Props) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const errorId = `${inputId}-error`;
  return <label className="bz-field" htmlFor={inputId}>
    <span>{label}</span>
    <input id={inputId} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...props} />
    {error ? <span id={errorId} role="alert" className="bz-field-error">{error}</span> : null}
  </label>;
}
