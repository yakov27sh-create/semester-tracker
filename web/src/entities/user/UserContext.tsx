import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/shared/supabase";

import type { DiakstraUser } from "./types";

type UserContextType = {
  loading: boolean;
  user: User | null;
  profile: DiakstraUser | undefined;
};

const UserContext = createContext<UserContextType | null>(null);

const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("Error: User context used outside provider");
  return ctx;
};

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const profile: DiakstraUser | undefined = user ? { userId: user.id } : undefined;

  return (
    <UserContext.Provider value={{ loading, user, profile }}>
      {loading ? "...loading" : children}
    </UserContext.Provider>
  );
}

export { UserProvider, useUserContext };
