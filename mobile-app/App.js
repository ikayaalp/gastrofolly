import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/api/notificationService';

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
          // Burada ilgili sayfaya yönlendirme yapılabilir
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
