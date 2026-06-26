"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useSupabaseData } from "./useSupabaseData";
import { dataRepository } from "@/lib/storage";
import { profileStanceToSelectedStance, type SelectedTrickDisplayStance } from "@/lib/trickStance";

const storageKey = "gratri_selected_trick_display_stance";

function readStoredStance(): SelectedTrickDisplayStance | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(storageKey);
  return value === "goofy" || value === "regular" ? value : null;
}

export function useSelectedTrickStance(): [SelectedTrickDisplayStance, (stance: SelectedTrickDisplayStance) => void] {
  const { user, loading } = useAuth();
  const [profile] = useSupabaseData(dataRepository.getProfile);
  const [selectedStance, setSelectedStanceState] = useState<SelectedTrickDisplayStance>("regular");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || loading) return;
    const stored = readStoredStance();
    if (stored) {
      setSelectedStanceState(stored);
      setInitialized(true);
      return;
    }
    if (!user) {
      setSelectedStanceState("regular");
      setInitialized(true);
      return;
    }
    if (profile) {
      setSelectedStanceState(profileStanceToSelectedStance(profile.stance));
      setInitialized(true);
    }
  }, [initialized, loading, profile, user]);

  function setSelectedStance(stance: SelectedTrickDisplayStance): void {
    setSelectedStanceState(stance);
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, stance);
  }

  return [selectedStance, setSelectedStance];
}
