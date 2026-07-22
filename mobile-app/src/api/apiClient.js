import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import { navigationRef } from '../navigation/AppNavigator';
import { logoutRevenueCat } from './revenueCatService';
import { getToken, removeToken } from '../utils/tokenStorage';

// 401 işleme kilidi: aynı anda patlayan birden çok istek tek yönlendirme üretsin.
let isHandling401 = false;

const api = axios.create({
    baseURL: config.API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to catch 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            const url = error.config?.url || '';
            // Login/register 401'leri (yanlış şifre) ve reclaim'in kendi 401'i
            // (süresi dolmuş token — ekran kendisi ele alıyor) bu akışı tetiklemesin.
            if (!url.includes('/login') && !url.includes('/register') &&
                !url.includes('/apple-mobile') && !url.includes('/google-mobile') &&
                !url.includes('/mobile-reclaim')) {
                if (!isHandling401) {
                    isHandling401 = true;

                    const token = await getToken();

                    if (token) {
                        // Token duruyor ama backend reddetti → başka cihazdan giriş
                        // yapıldı (sessionId devralındı). Token'ı SİLME: "Kim izliyor?"
                        // ekranı bu token'la oturumu tek dokunuşla geri alacak.
                        // RevenueCat kimliği de korunur; kullanıcı değişmiyor.
                        if (navigationRef.isReady()) {
                            navigationRef.reset({
                                index: 0,
                                routes: [{ name: 'WhoIsWatching' }],
                            });
                        }
                    } else {
                        // Token hiç yok → oturum devri değil, tutarsız state temizliği.
                        // (inline: authService import edilirse circular import oluşur)
                        await removeToken();
                        await AsyncStorage.removeItem('userData');
                        await AsyncStorage.removeItem('userId');
                        await AsyncStorage.removeItem('onboardingCompleted');
                        await logoutRevenueCat();

                        if (navigationRef.isReady()) {
                            navigationRef.reset({
                                index: 0,
                                routes: [{ name: 'Onboarding' }],
                            });
                        }
                    }

                    setTimeout(() => {
                        isHandling401 = false;
                    }, 3000);
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
