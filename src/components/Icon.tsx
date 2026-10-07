/**
 * Material Symbols Rounded icon. Only the names listed in index.html are downloaded,
 * so add new names there (alphabetically) before using them here.
 */
export type IconName =
  | "arrow_back"
  | "arrow_forward"
  | "auto_awesome"
  | "bar_chart"
  | "check"
  | "check_circle"
  | "close"
  | "delete"
  | "error"
  | "expand_more"
  | "graphic_eq"
  | "home"
  | "info"
  | "keyboard"
  | "key"
  | "lightbulb"
  | "local_fire_department"
  | "menu_book"
  | "mic"
  | "play_arrow"
  | "record_voice_over"
  | "refresh"
  | "school"
  | "search"
  | "settings"
  | "slow_motion_video"
  | "stop"
  | "task_alt"
  | "timer"
  | "translate"
  | "tune"
  | "visibility"
  | "visibility_off"
  | "volume_up"
  | "warning";

export function Icon({ name, filled = false, size, className = "" }: { name: IconName; filled?: boolean; size?: number; className?: string }) {
  return (
    <span
      className={`msr ${filled ? "msr-fill" : ""} ${className}`}
      style={size ? { fontSize: size } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
