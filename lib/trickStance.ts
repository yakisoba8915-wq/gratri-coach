import type { Profile, TrickStance } from "./types";

export type SelectedTrickDisplayStance = "regular" | "goofy";

export const trickStanceLabels: Record<TrickStance, string> = {
  both: "両方",
  regular: "レギュラー",
  goofy: "グーフィー",
};

export const selectedStanceLabels: Record<SelectedTrickDisplayStance, string> = {
  regular: "レギュラー表示",
  goofy: "グーフィー表示",
};

export function profileStanceToTrickStance(stance: Profile["stance"] | undefined): TrickStance {
  if (stance === "レギュラー") return "regular";
  if (stance === "グーフィー") return "goofy";
  return "both";
}

export function profileStanceToSelectedStance(stance: Profile["stance"] | undefined): SelectedTrickDisplayStance {
  return stance === "グーフィー" ? "goofy" : "regular";
}
