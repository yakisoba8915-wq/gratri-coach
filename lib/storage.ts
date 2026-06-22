"use client";

import { initialGoals, initialPracticeLogs, initialProfile, initialTricks } from "./mockData";
import type { Goal, PracticeLog, Profile, Trick } from "./types";

const keys = { tricks:"gratri-tricks", logs:"gratri-logs", goals:"gratri-goals", profile:"gratri-profile" } as const;
function read<T>(key: string, fallback: T): T { if (typeof window === "undefined") return fallback; try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function write<T>(key: string, value: T): void { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new Event("gratri-storage")); }

export const localData = {
  getTricks: () => read<Trick[]>(keys.tricks, initialTricks), saveTricks: (v: Trick[]) => write(keys.tricks, v),
  getLogs: () => read<PracticeLog[]>(keys.logs, initialPracticeLogs), saveLogs: (v: PracticeLog[]) => write(keys.logs, v),
  getGoals: () => read<Goal[]>(keys.goals, initialGoals), saveGoals: (v: Goal[]) => write(keys.goals, v),
  getProfile: () => read<Profile>(keys.profile, initialProfile), saveProfile: (v: Profile) => write(keys.profile, v)
};

// Supabase移行時は、このオブジェクトと同じ境界を持つ非同期repositoryへ置換する。
