import { useEffect, useState } from "react";

/** Spinner that explains the wait once Gemini takes long (it is retrying overloads behind the scenes). */
export function Analyzing({
  label,
  slowNote = "Gemini está con mucha demanda; reintentando automáticamente…",
}: {
  label: string;
  slowNote?: string;
}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="analyzing">
      <span className="spinner" />
      <span>
        {label}
        {slow && <small className="muted slow-note">{slowNote}</small>}
      </span>
    </div>
  );
}
