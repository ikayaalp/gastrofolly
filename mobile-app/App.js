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
            // Screen ve params varsa direkt oraya git
            if (data.screen) {
              navigationRef.navigate(data.screen, data.params || {});
            }
            // Course ID varsa kurs detayına git
            else if (data.courseId) {
              navigationRef.navigate('CourseDetail', { courseId: data.courseId });
            }
            // Topic ID varsa forum detayına git (gelecekte kullanım için)
            else if (data.topicId) {
              // navigationRef.navigate('TopicDetail', { topicId: data.topicId });
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
