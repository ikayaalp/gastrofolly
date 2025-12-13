import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/api/notificationService';

import { navigationRef } from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Push notification'ları başlat
    const setupNotifications = async () => {
      await notificationService.registerForPushNotifications();

      // Bildirim dinleyicilerini kur
      notificationService.setupNotificationListeners(
        (notification) => {
          // Uygulama açıkken bildirim geldi
          console.log('New notification:', notification.request.content);
        },
        (response) => {
          // Kullanıcı bildirime tıkladı
          const data = response.notification.request.content.data;
          console.log('Notification data:', data);

          if (navigationRef.isReady()) {
            // Manuel gönderilen ve screen bilgisi içeren bildirimler
            if (data.screen && data.params) {
              navigationRef.navigate(data.screen, data.params);
            }
            // "Yeni Kurs" tipindeki otomatik bildirimler
            else if (data.type === 'NEW_COURSE' && data.courseId) {
              navigationRef.navigate('CourseDetail', { courseId: data.courseId });
            }
            // Sadece courseId varsa (eski uyumluluk veya basit gönderim)
            else if (data.courseId) {
              navigationRef.navigate('CourseDetail', { courseId: data.courseId });
            }
          }
        }
      );
    };

    setupNotifications();

    // Cleanup
    return () => {
      notificationService.removeNotificationListeners();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
