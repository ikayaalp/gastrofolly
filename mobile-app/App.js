import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Asset } from 'expo-asset';
import { View, ActivityIndicator } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/api/notificationService';
import { initRevenueCat } from './src/api/revenueCatService';

import { navigationRef } from './src/navigation/AppNavigator';
import OfflineBanner from './src/components/OfflineBanner';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // RevenueCat SDK'yı başlat
        initRevenueCat();

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
        if (__DEV__) {
          console.log('New notification:', notification.request.content);
        }
      },
      (response) => {
        // Kullanıcı bildirime tıkladı
        const data = response.notification.request.content.data;
        if (__DEV__) {
          console.log('Notification data:', data);
        }

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
          // Conversation ID varsa sohbete git
          else if (data.conversationId) {
            navigationRef.navigate('Chat', { conversationId: data.conversationId });
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaProvider>
        <SystemBars style="light" />
        <StatusBar style="light" />
        <AppNavigator />
        <OfflineBanner />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
