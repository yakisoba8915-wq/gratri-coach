"use client";

import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export async function getCurrentUser():Promise<User | null> {
  if (!supabase) return null;
  const { data,error }=await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user??null;
}

export async function signInWithGoogle():Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const redirectTo=typeof window === "undefined" ? undefined : `${window.location.origin}/profile`;
  const { error }=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo}});
  if (error) throw error;
}

export async function signOut():Promise<void> {
  if (!supabase) return;
  const { error }=await supabase.auth.signOut();
  if (error) throw error;
}
