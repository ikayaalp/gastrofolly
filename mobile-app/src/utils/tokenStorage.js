import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'authToken';
const PROFILE_CACHE_KEY = 'profileCache';

export const getToken = async () => {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Error getting auth token from SecureStore:', error);
        return null;
    }
};

export const setToken = async (token) => {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
        console.error('Error setting auth token in SecureStore:', error);
    }
};

export const removeToken = async () => {
    try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
        console.error('Error removing auth token from SecureStore:', error);
    }
};

// "Kim izliyor?" ekranı için hatırlanan profil ({ name, email, image }).
// Oturum başka cihaz tarafından devralındığında token geçersizleşse bile
// bu bilgi kalır; kullanıcı karta dokunarak oturumu geri alır.
// Bilinçli çıkışta (logout) temizlenir → picker gösterilmez, normal Login gelir.
export const getProfileCache = async () => {
    try {
        const raw = await SecureStore.getItemAsync(PROFILE_CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error('Error getting profile cache from SecureStore:', error);
        return null;
    }
};

export const setProfileCache = async (profile) => {
    try {
        await SecureStore.setItemAsync(PROFILE_CACHE_KEY, JSON.stringify({
            name: profile?.name || null,
            email: profile?.email || null,
            image: profile?.image || null,
        }));
    } catch (error) {
        console.error('Error setting profile cache in SecureStore:', error);
    }
};

export const removeProfileCache = async () => {
    try {
        await SecureStore.deleteItemAsync(PROFILE_CACHE_KEY);
    } catch (error) {
        console.error('Error removing profile cache from SecureStore:', error);
    }
};
