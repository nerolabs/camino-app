import { createContext, useContext, useState, type ReactNode } from 'react';
import { type Profile } from './interview-controller';

type ProfileContextValue = {
  profile: Profile | null;
  // null clears the in-memory profile (account deletion) — matches the state's real shape.
  setProfile: (p: Profile | null) => void;
  // Server-owned staff flag (from the profiles table). Gates non-sensitive dev/staff tooling
  // (test personas, the webinar cross-check link). Defaults false; set by an admin in the DB.
  isStaff: boolean;
  setIsStaff: (v: boolean) => void;
  // Has SessionSync SETTLED the profile question for the current auth state? "profile is null"
  // alone can't distinguish "still fetching" from "this account has nothing saved" — which left
  // /plan showing "Loading your roadmap…" forever (build-28 family finding).
  profileLoaded: boolean;
  setProfileLoaded: (v: boolean) => void;
};

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  setProfile: () => {},
  isStaff: false,
  setIsStaff: () => {},
  profileLoaded: false,
  setProfileLoaded: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  return (
    <ProfileContext.Provider
      value={{ profile, setProfile, isStaff, setIsStaff, profileLoaded, setProfileLoaded }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
