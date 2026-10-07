import { useEffect, useState } from "react";

/** Progress indicator that explains the wait once Gemini takes long (it is retrying overloads behind the scenes). */
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
    <div className="analyzing" role="status">
      <span className="spinner" />
      <span className="body-l">
        {label}
        {slow && <span className="body-s slow-note">{slowNote}</span>}
      </span>
    </div>
  );
}
