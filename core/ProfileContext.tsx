import { createContext, useContext, useState, type ReactNode } from 'react';
import { type Profile } from './interview-controller';

type ProfileContextValue = {
  profile: Profile | null;
  setProfile: (p: Profile) => void;
};

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  setProfile: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
