"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { freshProgress, Progress, validateProgress } from "./progress";
import {
  CONFIG_KEY,
  GUEST_KEY,
  Connection,
  connect,
  readCloud,
  writeCloud,
} from "./storage";
import { localGet, localSet } from "./local-db";
export function useTraining() {
  const [progress, setProgress] = useState<Progress>(freshProgress),
    [ready, setReady] = useState(false),
    [user, setUser] = useState<User | null>(null),
    [config, setConfig] = useState<Connection | null>(null),
    [sync, setSync] = useState("Loading your workspace…"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const current = useRef(progress),
    client = useRef<SupabaseClient | null>(null),
    identity = useRef<User | null>(null),
    revision = useRef(0),
    pending = useRef<Progress | null>(null),
    saving = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    blocked = useRef(false),
    loaded = useRef(false),
    generation = useRef(0);
  const show = useCallback((p: Progress) => {
    current.current = p;
    setProgress(p);
  }, []);
  const drain = useCallback(async () => {
    if (saving.current || blocked.current || !pending.current) return;
    saving.current = true;
    const gen = generation.current;
    try {
      while (pending.current) {
        const p = pending.current;
        pending.current = null;
        validateProgress(p);
        if (client.current && identity.current) {
          setSync("Saving to Supabase…");
          const savedRevision = await writeCloud(
            client.current,
            p,
            revision.current,
          );
          if (gen !== generation.current) break;
          revision.current = savedRevision;
          setSync("Saved to Supabase");
        } else {
          await localSet("progress", p);
          setSync("Saved on this device");
        }
      }
    } catch (e) {
      blocked.current = true;
      pending.current = current.current;
      setError(e instanceof Error ? e.message : "Progress could not be saved.");
      setSync("Unsaved changes — export a backup");
    } finally {
      saving.current = false;
    }
  }, []);
  const commit = useCallback(
    (p: Progress) => {
      if (!loaded.current) {
        setNotice("Wait until your progress has loaded.");
        return;
      }
      show(p);
      pending.current = p;
      setSync(
        identity.current
          ? "Changes waiting to sync…"
          : "Saving on this device…",
      );
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void drain(), 600);
    },
    [drain, show],
  );
  const guest = useCallback(async () => {
    const stored = await localGet<Progress>("progress");
    if (stored) return validateProgress(stored);
    const raw = localStorage.getItem(GUEST_KEY);
    const value = raw ? validateProgress(JSON.parse(raw)) : freshProgress();
    await localSet("progress", value);
    return value;
  }, []);
  useEffect(() => {
    let canceled = false;
    void (async () => {
      try {
        const saved = await guest();
        if (canceled) return;
        show(saved);
        const raw = localStorage.getItem(CONFIG_KEY);
        if (raw) setConfig(JSON.parse(raw));
        else if (
          process.env.SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        )
          setConfig({
            url: process.env.SUPABASE_URL,
            key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          });
        loaded.current = true;
        setSync("Saved on this device");
      } catch {
        setError(
          "Saved data could not be read. Recover your original browser data before replacing it.",
        );
        blocked.current = true;
        loaded.current = false;
      }
      if (!canceled) setReady(true);
    })();
    return () => {
      canceled = true;
    };
  }, [guest, show]);
  useEffect(() => {
    if (!ready || !config) return;
    let canceled = false,
      subscription: { unsubscribe: () => void } | undefined;
    try {
      const c = connect(config);
      client.current = c;
      const apply = async (u: User | null) => {
        if (canceled) return;
        if (identity.current?.id === u?.id && loaded.current) return;
        const gen = ++generation.current;
        loaded.current = false;
        setBusy(true);
        setError("");
        blocked.current = false;
        pending.current = null;
        if (timer.current) clearTimeout(timer.current);
        identity.current = u;
        setUser(u);
        try {
          if (u) {
            setSync("Loading cloud progress…");
            const row = await readCloud(c, u.id);
            if (canceled || gen !== generation.current) return;
            revision.current = row?.revision || 0;
            show(row?.progress || freshProgress());
            setSync(
              row
                ? "Saved to Supabase"
                : "Connected · import guest progress or start fresh",
            );
          } else {
            revision.current = 0;
            show(await guest());
            setSync("Saved on this device");
          }
          loaded.current = true;
        } catch (e) {
          if (!canceled) {
            setError(
              e instanceof Error ? e.message : "Unable to load cloud progress.",
            );
            setSync("Cloud unavailable · editing paused");
            blocked.current = true;
          }
        } finally {
          if (!canceled) setBusy(false);
        }
      };
      c.auth.getSession().then(({ data, error: e }) => {
        if (e) {
          setError(e.message);
          return;
        }
        void apply(data.session?.user || null);
      });
      subscription = c.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT")
          setTimeout(() => void apply(session?.user || null), 0);
      }).data.subscription;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid Supabase settings.");
    }
    return () => {
      canceled = true;
      subscription?.unsubscribe();
    };
  }, [config, ready, show, guest]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (pending.current || saving.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(id);
  }, [notice]);
  const configure = async (c: Connection) => {
    if (pending.current || saving.current)
      throw new Error(
        "Wait for changes to save, or export a backup before changing the connection.",
      );
    const { validConnection } = await import("./storage");
    const valid = validConnection(c);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(valid));
    setConfig(valid);
    setNotice("Connection saved. Sign in below to enable cloud storage.");
  };
  const signIn = async (email: string) => {
    if (!client.current)
      throw new Error("Connect your Supabase project first.");
    if (pending.current || saving.current)
      throw new Error("Wait for your progress to save first.");
    const { error: e } = await client.current.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/" },
    });
    if (e) throw e;
    setNotice("Check your email for the sign-in link.");
  };
  const signOut = async () => {
    if (pending.current || saving.current)
      throw new Error(
        "Unsaved work remains. Retry saving or export it before signing out.",
      );
    const { error: e } = await client.current!.auth.signOut();
    if (e) throw e;
  };
  const retry = () => {
    blocked.current = false;
    setError("");
    void drain();
  };
  const reload = async () => {
    if (!client.current || !identity.current) return;
    setBusy(true);
    try {
      const row = await readCloud(client.current, identity.current.id);
      revision.current = row?.revision || 0;
      pending.current = null;
      blocked.current = false;
      loaded.current = true;
      setError("");
      show(row?.progress || freshProgress());
      setSync("Saved to Supabase");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setBusy(false);
    }
  };
  return {
    progress,
    commit,
    ready,
    user,
    config,
    sync,
    error,
    notice,
    setNotice,
    busy,
    configure,
    signIn,
    signOut,
    retry,
    reload,
    client: client.current,
    importGuest: async () => {
      try {
        commit(await guest());
      } catch {
        setNotice("Guest progress could not be imported.");
      }
    },
  };
}
