import type { Profile, Trick, TrickStance } from "./types";

export const trickStanceLabels: Record<TrickStance, string> = {
  both: "両方",
  regular: "レギュラー",
  goofy: "グーフィー",
};

export type TrickStanceView = "own" | "all";

export function profileStanceToTrickStance(stance: Profile["stance"] | undefined): TrickStance {
  if (stance === "レギュラー") return "regular";
  if (stance === "グーフィー") return "goofy";
  return "both";
}

export function matchesTrickStance(trick: Trick, profileStance: Profile["stance"] | undefined, view: TrickStanceView): boolean {
  if (view === "all") return true;
  const target = profileStanceToTrickStance(profileStance);
  const trickStance = trick.stance ?? "both";
  if (target === "regular") return trickStance === "regular" || trickStance === "both";
  if (target === "goofy") return trickStance === "goofy" || trickStance === "both";
  return trickStance === "both";
}
