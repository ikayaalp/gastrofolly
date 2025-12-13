import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import config from './config';

// Bildirim davranışını ayarla - uygulama açıkken bile bildirim göster
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class NotificationService {
    constructor() {
        this.expoPushToken = null;
        this.notificationListener = null;
        this.responseListener = null;
    }

    // Push token al ve backend'e kaydet
    async registerForPushNotifications() {
        let token;

        // Fiziksel cihaz kontrolü
        if (!Device.isDevice) {
            console.log('Push notifications require a physical device');
            return null;
        }

        // Android için bildirim kanalı oluştur
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF6B00',
                sound: 'default',
            });
        }

        // Mevcut izinleri kontrol et
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // İzin yoksa iste
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        // Expo push token al
        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
            console.log('Using Project ID for Push:', projectId);

            token = (await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            })).data;

            console.log('Expo Push Token:', token);
            this.expoPushToken = token;

            // Token'ı local storage'a kaydet
            await AsyncStorage.setItem('expoPushToken', token);

            // Backend'e token'ı gönder
            await this.sendTokenToBackend(token);

            return token;
        } catch (error) {
            console.error('Error getting push token:', error);
            return null;
        }
    }

    // Backend'e token gönder
    async sendTokenToBackend(token) {
        try {
            const authToken = await AsyncStorage.getItem('authToken');
            if (!authToken) {
                console.log('No auth token, skipping push token registration');
                return;
            }

            await axios.put(
                `${config.API_BASE_URL}/api/user/push-token`,
                { pushToken: token },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );
            console.log('Push token sent to backend successfully');
        } catch (error) {
            console.error('Error sending push token to backend:', error);
        }
    }

    // Bildirim dinleyicilerini başlat
    setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
        // Bildirim geldiğinde (uygulama açıkken)
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
            if (onNotificationReceived) {
                onNotificationReceived(notification);
            }
        });

        // Bildirime dokunulduğunda
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification tapped:', response);
            if (onNotificationTapped) {
                onNotificationTapped(response);
            }
        });
    }

    // Dinleyicileri temizle
    removeNotificationListeners() {
        if (this.notificationListener) {
            this.notificationListener.remove();
        }
        if (this.responseListener) {
            this.responseListener.remove();
        }
    }

    // Mevcut token'ı getir
    async getStoredToken() {
        return await AsyncStorage.getItem('expoPushToken');
    }

    // Badge sayısını temizle
    async clearBadge() {
        await Notifications.setBadgeCountAsync(0);
    }
}

export default new NotificationService();
