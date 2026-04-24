import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(timeStr: string): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 외워줘 - 오늘 복습하셨나요?',
      body: '매일 꾸준한 복습이 암기력을 높여줍니다. 지금 바로 시작해보세요!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
