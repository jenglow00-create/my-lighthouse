import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationSettings {
  enabled: boolean;
  studyReminder: boolean;
  reflectionReminder: boolean;
  goalReminder: boolean;
  examReminder: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
  frequency: 'low' | 'medium' | 'high';
}

interface NotificationStore {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  isQuietTime: () => boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: false,
  studyReminder: true,
  reflectionReminder: true,
  goalReminder: true,
  examReminder: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  frequency: 'medium'
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      isQuietTime: () => {
        const { settings } = get();

        if (!settings.quietHours.enabled) {
          return false;
        }

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const { start, end } = settings.quietHours;

        // 같은 날 (예: 08:00 - 22:00)
        if (start < end) {
          return currentTime >= start && currentTime < end;
        }

        // 다음 날 넘어감 (예: 22:00 - 08:00)
        return currentTime >= start || currentTime < end;
      }
    }),
    {
      name: 'notification-settings'
    }
  )
);
