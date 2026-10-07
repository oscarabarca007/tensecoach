import { Icon } from "./Icon";

/** Top app bar for full-screen flows: close, title, counter and a linear progress indicator. */
export function FlowHeader({
  title,
  index,
  total,
  onClose,
  closeLabel,
}: {
  title: string;
  index: number;
  total: number;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <div className="flow-head">
      <header className="topbar">
        <button className="icon-btn" onClick={onClose} aria-label={closeLabel}>
          <Icon name="close" />
        </button>
        <h1 className="title-l" style={{ fontSize: 18 }}>{title}</h1>
        <span className="label-l on-variant trailing">{Math.min(index + 1, total)} / {total}</span>
      </header>
      <div className="linear" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index}>
        <span style={{ width: `${(index / total) * 100}%` }} />
      </div>
    </div>
  );
}

export function ErrorBanner({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel: string }) {
  return (
    <div className="banner error" role="alert">
      <Icon name="error" />
      <div className="banner-body">
        <span className="body-m">{message}</span>
        {onRetry && (
          <button className="btn btn-text" style={{ color: "inherit", marginLeft: -12 }} onClick={onRetry}>
            <Icon name="refresh" /> {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** Extra-large FAB microphone with its status line. */
export function MicFab({
  recording,
  elapsed,
  onClick,
  idleLabel,
  recordingLabel,
  startAria,
  stopAria,
}: {
  recording: boolean;
  elapsed: number;
  onClick: () => void;
  idleLabel: string;
  recordingLabel: (s: number) => string;
  startAria: string;
  stopAria: string;
}) {
  return (
    <div className="mic-area">
      <button className={`fab ${recording ? "recording" : ""}`} onClick={onClick} aria-label={recording ? stopAria : startAria}>
        <Icon name={recording ? "stop" : "mic"} filled />
      </button>
      <p className="body-m on-variant center" aria-live="polite">{recording ? recordingLabel(elapsed) : idleLabel}</p>
    </div>
  );
}
