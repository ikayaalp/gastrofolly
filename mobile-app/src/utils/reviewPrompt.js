import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const LAST_REVIEW_PROMPT_KEY = 'lastReviewPromptAt';
const REVIEW_RETRY_INTERVAL_DAYS = 60;

// Kullanıcı bir dersi tamamladığında çağrılır (bkz. LearnScreen markLessonComplete).
// İlk çağrıda veya son istekten REVIEW_RETRY_INTERVAL_DAYS gün sonra native App Store
// rating diyaloğunu tetikler. Diyaloğu fiilen gösterip göstermeme kararı Apple'a ait.
export async function maybeRequestReview() {
    if (Platform.OS !== 'ios') return;

    try {
        const lastPromptAt = await AsyncStorage.getItem(LAST_REVIEW_PROMPT_KEY);

        if (lastPromptAt) {
            const daysSinceLastPrompt = (Date.now() - new Date(lastPromptAt).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastPrompt < REVIEW_RETRY_INTERVAL_DAYS) return;
        }

        const isAvailable = await StoreReview.isAvailableAsync();
        if (!isAvailable) return;

        await StoreReview.requestReview();
        await AsyncStorage.setItem(LAST_REVIEW_PROMPT_KEY, new Date().toISOString());
    } catch (error) {
        console.warn('Review prompt error:', error);
    }
}
