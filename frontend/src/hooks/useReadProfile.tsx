"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ReadProfile } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export function useReadProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ReadProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const snap = await getDoc(doc(db, "students", user.uid));
    setProfile(snap.exists() ? (snap.data().readProfile as ReadProfile) ?? null : null);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading, refetch };
}
