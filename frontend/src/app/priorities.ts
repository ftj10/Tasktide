// INPUT: planner items with emergency and completion state
// OUTPUT: shared accent colors and calendar-ready priority colors
// EFFECT: Keeps urgency-based styling aligned across task, reminder, and calendar surfaces
type PriorityItem = {
  emergency?: number;
  completedAt?: string | null;
};

export function getPriorityAccent(emergency = 5) {
  switch (emergency) {
    case 1:
      return "#ef4444";
    case 2:
      return "#f97316";
    case 3:
      return "#f59e0b";
    case 4:
      return "#10b981";
    case 5:
    default:
      return "#0ea5e9";
  }
}

export function getPriorityColors(item?: PriorityItem) {
  if (item?.completedAt) {
    return { bg: "#e5e7eb", border: "#cbd5e1", text: "#6b7280" };
  }

  const accent = getPriorityAccent(item?.emergency ?? 5);

  return {
    bg: accent,
    border: accent,
    text: "#ffffff",
  };
}
