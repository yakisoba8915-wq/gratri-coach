"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { dataRepository } from "@/lib/storage";
import type { Stance } from "@/lib/types";
import LoginPromptModal from "./LoginPromptModal";
import OnboardingTutorial from "./OnboardingTutorial";
import ProfileSetupModal from "./ProfileSetupModal";

const LOGIN_DISMISSED_KEY = "gratri-login-prompt-dismissed";
const TUTORIAL_SEEN_KEY = "gratri_onboarding_seen";

export default function AppOnboarding() {
  const { user, loading } = useAuth();
  const [profile, refreshProfile] = useSupabaseData(dataRepository.getProfile);
  const [browserStorageReady, setBrowserStorageReady] = useState(false);
  const [loginPromptDismissed, setLoginPromptDismissed] = useState(false);
  const [tutorialSeen, setTutorialSeen] = useState(false);

  useEffect(() => {
    setLoginPromptDismissed(sessionStorage.getItem(LOGIN_DISMISSED_KEY) === "true");
    setTutorialSeen(localStorage.getItem(TUTORIAL_SEEN_KEY) === "true");
    setBrowserStorageReady(true);
  }, []);

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
