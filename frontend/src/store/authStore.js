// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,             // { _id, username, email }
      accessToken: null,      // SHORT-LIVED — in memory only, NEVER localStorage

      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      setAccessToken: (accessToken) => set({ accessToken }),
    }),
    {
      name: 'livecollab-auth',
    }
  )
);

export default useAuthStore;
