"use client";

import { useEffect,useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { dataRepository } from "@/lib/storage";
import type { Stance } from "@/lib/types";
import LoginPromptModal from "./LoginPromptModal";
import ProfileSetupModal from "./ProfileSetupModal";

const DISMISSED_KEY="gratri-login-prompt-dismissed";
export default function AppOnboarding(){
  const {user,loading}=useAuth();
  const [profile,refreshProfile]=useSupabaseData(dataRepository.getProfile);
  const [sessionReady,setSessionReady]=useState(false);
  const [dismissed,setDismissed]=useState(false);
  useEffect(()=>{setDismissed(sessionStorage.getItem(DISMISSED_KEY)==="true");setSessionReady(true);},[]);
  function later(){sessionStorage.setItem(DISMISSED_KEY,"true");setDismissed(true);}
  async function saveProfile(next:{displayName:string;stance:Stance}){await dataRepository.saveProfile(next);const saved=await dataRepository.getProfile();if(!saved.displayName.trim()||!saved.stance)throw new Error("プロフィールを保存できませんでした");await refreshProfile();}
  if(loading||!sessionReady)return null;
  if(!user&&!dismissed)return <LoginPromptModal onLater={later}/>;
  if(user&&profile&&(!profile.displayName.trim()||!profile.stance))return <ProfileSetupModal onSave={saveProfile}/>;
  return null;
}
