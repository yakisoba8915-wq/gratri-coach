"use client";

import { supabase } from "./supabase";
import { generateOffTrainingPlan as generateBasePlan } from "./offTrainingPlanner";
import type { OffTrainingPreferences, SelectedShibakatsuMenu, ShibakatsuTrick } from "./types";

interface ShibakatsuTrickRow {
  id: string;
  name: string;
  difficulty: number;
  category: string;
  related_snow_trick: string | null;
  description: string | null;
  tips: string | null;
  cautions: string | null;
}

const includes = (value: string, keyword: string): boolean => value.includes(keyword);

export async function fetchShibakatsuTricks(): Promise<ShibakatsuTrick[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tricks")
    .select("id,name,difficulty,category,related_snow_trick,description,tips,cautions")
    .eq("trick_type", "shibakatsu")
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[Gratri Coach] Failed to load DB shibakatsu tricks. Using fallback menus.", error);
    return [];
  }

  return ((data ?? []) as ShibakatsuTrickRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    difficulty: row.difficulty,
    category: row.category,
    relatedSnowTrick: row.related_snow_trick ?? "",
    description: row.description ?? "",
    tips: row.tips ?? "",
    cautions: row.cautions ?? "",
  }));
}

function difficultyScore(difficulty: number, intensity: OffTrainingPreferences["intensity"]): number {
  const range =
    intensity === "軽め" ? [1, 4] :
    intensity === "きつめ" ? [6, 10] :
    [3, 7];
  if (difficulty >= range[0] && difficulty <= range[1]) return 5;
  const distance = difficulty < range[0] ? range[0] - difficulty : difficulty - range[1];
  return Math.max(0, 4 - distance);
}

function preferenceScore(trick: ShibakatsuTrick, preferences: OffTrainingPreferences): number {
  let score = difficultyScore(trick.difficulty, preferences.intensity);
  const category = trick.category;
  const searchable = `${trick.relatedSnowTrick} ${trick.description}`;

  for (const focus of preferences.focusAbility) {
    if (focus === "プレス安定" && includes(category, "プレス")) score += 8;
    if (focus === "弾き" && includes(category, "弾き")) score += 8;
    if (focus === "回転力" && includes(category, "回転")) score += 8;
    if (focus === "着地安定" && (includes(category, "バランス") || includes(category, "連続動作"))) score += 8;
  }

  for (const target of preferences.targetTrickType) {
    if (target === "オーリー系" && includes(searchable, "オーリー")) score += 7;
    if (target === "ノーリー系" && includes(searchable, "ノーリー")) score += 7;
    if (target === "プレス系" && (includes(trick.relatedSnowTrick, "プレス") || includes(category, "プレス"))) score += 7;
    if (target === "360系" && includes(searchable, "360")) score += 7;
    if (target === "540系" && includes(searchable, "540")) score += 7;
  }

  return score;
}

export function pickShibakatsuMenusFromDb(
  tricks: ShibakatsuTrick[],
  preferences: OffTrainingPreferences,
): SelectedShibakatsuMenu[] {
  return tricks
    .map((trick) => ({ ...trick, score: preferenceScore(trick, preferences) }))
    .sort((a, b) => b.score - a.score || a.difficulty - b.difficulty || a.name.localeCompare(b.name, "ja"));
}

export async function generateOffTrainingPlan(
  preferences: OffTrainingPreferences,
  userId: string,
) {
  const dbMenus = pickShibakatsuMenusFromDb(await fetchShibakatsuTricks(), preferences);
  return generateBasePlan(preferences, userId, dbMenus);
}
