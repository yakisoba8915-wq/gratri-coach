"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { dataRepository } from "@/lib/storage";
import type { Stance } from "@/lib/types";
import LoginPromptModal from "./LoginPromptModal";
import OnboardingTutorial from "./OnboardingTutorial";
import ProfileSetupModal from "./ProfileSetupModal";

const LOGIN_DISMISSED_KEY = "gratri-login-prompt-dismissed";
const TUTORIAL_SEEN_KEY = "gratri_onboarding_seen";
const APP_READY_EVENT = "gratri-app-onboarding-ready";
const APP_READY_KEY = "gratri-app-onboarding-ready";
const GUEST_MODE_KEY = "gratri_guest_mode";

export default function AppOnboarding() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [profile, refreshProfile] = useSupabaseData(dataRepository.getProfile);
  const [browserStorageReady, setBrowserStorageReady] = useState(false);
  const [loginPromptDismissed, setLoginPromptDismissed] = useState(false);
  const [tutorialSeen, setTutorialSeen] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    setLoginPromptDismissed(sessionStorage.getItem(LOGIN_DISMISSED_KEY) === "true");
    setTutorialSeen(localStorage.getItem(TUTORIAL_SEEN_KEY) === "true");
    setGuestMode(localStorage.getItem(GUEST_MODE_KEY) === "true");
    setBrowserStorageReady(true);
  }, []);

  const appOnboardingComplete =
    !loading &&
    browserStorageReady &&
    tutorialSeen &&
    ((Boolean(user) && Boolean(profile?.displayName.trim()) && Boolean(profile?.stance)) ||
      (!user && loginPromptDismissed));

  useEffect(() => {
    if (!appOnboardingComplete) {
      sessionStorage.removeItem(APP_READY_KEY);
      return;
    }
    sessionStorage.setItem(APP_READY_KEY, "true");
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event(APP_READY_EVENT));
    }, 50);
    return () => window.clearTimeout(timer);
  }, [appOnboardingComplete]);

  function completeTutorial(): void {
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    setTutorialSeen(true);
  }

  function dismissLoginPrompt(): void {
    sessionStorage.setItem(LOGIN_DISMISSED_KEY, "true");
    setLoginPromptDismissed(true);
  }

  async function saveProfile(next: { displayName: string; stance: Stance }): Promise<void> {
    await dataRepository.saveProfile(next);
    const saved = await dataRepository.getProfile();
    if (!saved.displayName.trim() || !saved.stance) {
      throw new Error("プロフィールを保存できませんでした。");
    }
    await refreshProfile();
  }

  if (loading || !browserStorageReady) return null;

  if (!user && pathname === "/" && !guestMode) return null;

  if (!tutorialSeen) {
    return <OnboardingTutorial onComplete={completeTutorial} />;
  }

  if (!user && !loginPromptDismissed) {
    return <LoginPromptModal onLater={dismissLoginPrompt} />;
  }

  if (user && profile && (!profile.displayName.trim() || !profile.stance)) {
    return <ProfileSetupModal onSave={saveProfile} />;
  }

  return null;
}
