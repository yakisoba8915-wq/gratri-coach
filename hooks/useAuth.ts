"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect,useState } from "react";
import { isSupabaseConfigured,supabase } from "@/lib/supabase";

export function useAuth():{user:User|null;loading:boolean;configured:boolean} {
  const [user,setUser]=useState<User|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!supabase){setLoading(false);return;}
    let active=true;
    void supabase.auth.getSession().then(({data})=>{if(active){setUser(data.session?.user??null);setLoading(false);}});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      setUser(session?.user??null);setLoading(false);
      window.dispatchEvent(new Event("gratri-storage"));
    });
    return()=>{active=false;subscription.unsubscribe();};
  },[]);

  return {user,loading,configured:isSupabaseConfigured};
}
