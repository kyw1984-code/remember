import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fileSystemStorage } from '../services/storage';

interface SettingsState {
  dailyGoal: number;
  notificationsEnabled: boolean;
  notificationTime: string;
  setDailyGoal: (goal: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationTime: (time: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dailyGoal: 20,
      notificationsEnabled: true,
      notificationTime: '09:00',
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setNotificationTime: (time) => set({ notificationTime: time }),
    }),
    {
      name: 'remember-settings',
      storage: createJSONStorage(() => fileSystemStorage),
    }
  )
);
