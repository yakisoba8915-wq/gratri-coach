import { initialTricks } from "./mockData";
import type { AiFeatureType, PlanType, Trick } from "./types";

const initialFreeTrickIds = new Set(initialTricks.map((trick) => trick.id));

export function isPremiumPlan(planType: PlanType | null | undefined): boolean {
  return planType === "premium" || planType === "admin" || planType === "beta_tester" || planType === "editor";
}

export function isEditor(planType: PlanType | null | undefined): boolean {
  return planType === "editor";
}

export function isAdmin(planType: PlanType | null | undefined): boolean {
  return planType === "admin";
}

export function canManageTricks(planType: PlanType | null | undefined): boolean {
  return planType === "admin" || planType === "editor";
}

export function canEditTricks(planType: PlanType | null | undefined): boolean {
  return canManageTricks(planType);
}

export function canDeleteTricks(planType: PlanType | null | undefined): boolean {
  return canManageTricks(planType);
}

export function canAccessAdminPage(planType: PlanType | null | undefined): boolean {
  return planType === "admin";
}

export function canUseAI(featureType: AiFeatureType, planType: PlanType | null | undefined, isLoggedIn: boolean): boolean {
  if (featureType === "ai_video_analysis") return false;
  if (featureType === "ai_chat") return true;
  return isLoggedIn || planType === "admin";
}

export function isAiUnlimited(planType: PlanType | null | undefined): boolean {
  return planType === "admin";
}

export function aiLimitPlan(planType: PlanType | null | undefined): Exclude<PlanType, "admin"> {
  if (planType === "premium" || planType === "beta_tester" || planType === "editor") return planType;
  return "free";
}

export function canUsePremiumTricks(planType: PlanType | null | undefined): boolean {
  return isPremiumPlan(planType);
}

export function isInitialFreeTrick(trick: Trick): boolean {
  return initialFreeTrickIds.has(trick.id);
}

export function canUseTrick(trick: Trick, planType: PlanType | null | undefined): boolean {
  if (isInitialFreeTrick(trick)) return true;
  if ((trick.accessType ?? "premium") === "free") return true;
  return canUsePremiumTricks(planType);
}

export function planLabel(planType: PlanType | null | undefined): string {
  if (planType === "premium") return "Premium";
  if (planType === "admin") return "Admin";
  if (planType === "beta_tester") return "Beta Tester";
  if (planType === "editor") return "Editor";
  return "Free";
}
