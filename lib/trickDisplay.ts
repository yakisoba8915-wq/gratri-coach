import type { Trick } from "./types";
import type { SelectedTrickDisplayStance } from "./trickStance";

export function formatTrickName(name: string, stance: SelectedTrickDisplayStance): string {
  return `${name}（${stance === "regular" ? "レギュラー" : "グーフィー"}）`;
}

export function formatOptionalTrickName(name: string | undefined | null, stance: SelectedTrickDisplayStance, fallback = "未設定"): string {
  return name ? formatTrickName(name, stance) : fallback;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatTextWithTrickNames(text: string, tricks: Trick[], stance: SelectedTrickDisplayStance): string {
  const uniqueTricks = [...new Map(tricks.map((trick) => [trick.nameJa, trick])).values()].sort((a, b) => b.nameJa.length - a.nameJa.length);
  return uniqueTricks.reduce((current, trick) => {
    if (!trick.nameJa || !current.includes(trick.nameJa)) return current;
    return current.replace(new RegExp(`${escapeRegExp(trick.nameJa)}(?!（レギュラー）|（グーフィー）)`, "g"), formatTrickName(trick.nameJa, stance));
  }, text);
}
