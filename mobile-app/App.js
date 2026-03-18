import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/api/notificationService';

import { navigationRef } from './src/navigation/AppNavigator';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load essential images into memory before app starts
        await Asset.loadAsync([
          require('./assets/icon.png'),
          require('./assets/auth-background.jpg'),
        ]);

        await notificationService.registerForPushNotifications();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

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
          // Topic ID varsa forum tartışmasına git
          else if (data.topicId) {
            navigationRef.navigate('Social', { screen: 'TopicDetail', params: { topicId: data.topicId } });
          }
        }
      }
    );

    // Cleanup
    return () => {
      notificationService.removeNotificationListeners();
    };
  }, []);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
