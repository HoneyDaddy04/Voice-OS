
import { Entry } from './types';

const STORAGE_KEY = 'voice_suite_entries';

export const saveEntries = (entries: Entry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const loadEntries = (): Entry[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const formatTimestamp = (ts: number): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(ts));
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data:*/*;base64, prefix
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const scheduleNotification = (text: string, time: string) => {
  const triggerTime = new Date(time).getTime();
  const now = Date.now();
  const delay = triggerTime - now;

  if (delay > 0) {
    setTimeout(() => {
      new Notification("Voice Suite Reminder", {
        body: text,
        icon: 'https://picsum.photos/128/128'
      });
    }, delay);
  }
};
