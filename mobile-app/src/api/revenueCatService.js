import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────
// ⚠️  Bu değerleri App Store Connect'ten aldıktan sonra güncelleyin
// ─────────────────────────────────────────────────────────────────
const RC_API_KEY_IOS = 'appl_rtYbSMPByqvGYvIPxvwnwZiCNKW';
const RC_API_KEY_ANDROID = ''; // Android için RevenueCat key eklenecek

// App Store Connect → Apps → Culinora → Subscriptions'dan alınan Product ID'ler
export const PRODUCT_IDS = {
    PREMIUM_MONTHLY: 'culinora_premium_monthly', // ⚠️ App Store Connect'te bu ID ile ürün oluşturun
};

// RevenueCat Offering identifier (Dashboard'da tanımlı)
export const OFFERING_ID = 'default';
// ─────────────────────────────────────────────────────────────────

/**
 * Uygulama başlangıcında RevenueCat SDK'yı başlatır.
 * App.js içinde bir kez çağrılmalıdır.
 */
export const initRevenueCat = () => {
    try {
        if (__DEV__) {
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;

        if (!apiKey) {
            console.warn('[RevenueCat] API key tanımlanmamış, platform:', Platform.OS);
            return;
        }

        Purchases.configure({ apiKey });
        console.log('[RevenueCat] SDK başlatıldı');
    } catch (error) {
        console.error('[RevenueCat] Başlatma hatası:', error);
    }
};

/**
 * Kullanıcı giriş yaptıktan sonra RevenueCat'e kimliğini bildirir.
 * Bu sayede abonelik geçmişi kullanıcıyla ilişkilendirilir.
 */
export const loginRevenueCat = async (userId) => {
    try {
        if (!userId) return;
        const { customerInfo } = await Purchases.logIn(String(userId));
        console.log('[RevenueCat] Kullanıcı giriş yaptı:', userId);
        return customerInfo;
    } catch (error) {
        console.error('[RevenueCat] Login hatası:', error);
        return null;
    }
};

/**
 * Kullanıcı çıkış yaptığında RevenueCat oturumunu temizler.
 */
export const logoutRevenueCat = async () => {
    try {
        await Purchases.logOut();
        console.log('[RevenueCat] Kullanıcı çıkış yaptı');
    } catch (error) {
        // Zaten çıkış yapılmışsa hata fırlatabilir, görmezden gel
        console.warn('[RevenueCat] Logout uyarısı:', error?.message);
    }
};

/**
 * Mevcut kullanıcının abonelik bilgilerini döner.
 * @returns {{ isPremium: boolean, expirationDate: Date|null, customerInfo: object }}
 */
export const getSubscriptionStatus = async () => {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        const isPremium = typeof customerInfo.entitlements.active['Culinora Pro'] !== 'undefined';

        const entitlement = customerInfo.entitlements.active['Culinora Pro'];
        const expirationDate = entitlement?.expirationDate
            ? new Date(entitlement.expirationDate)
            : null;

        return {
            isPremium,
            expirationDate,
            customerInfo,
        };
    } catch (error) {
        console.error('[RevenueCat] Abonelik durumu alınamadı:', error);
        return { isPremium: false, expirationDate: null, customerInfo: null };
    }
};

/**
 * Mevcut teklifleri (offerings) RevenueCat'ten çeker.
 * @returns {Array} Paket listesi
 */
export const getOfferings = async () => {
    try {
        const offerings = await Purchases.getOfferings();

        if (!offerings.current) {
            console.warn('[RevenueCat] Aktif offering bulunamadı. App Store Connect\'te ürün tanımlı mı?');
            return [];
        }

        return offerings.current.availablePackages;
    } catch (error) {
        console.error('[RevenueCat] Offerings alınamadı:', error);
        return [];
    }
};

/**
 * Belirtilen paketi satın alır.
 * @param {object} rcPackage - getOfferings() ile alınan paket objesi
 * @returns {{ success: boolean, customerInfo?: object, error?: string, userCancelled?: boolean }}
 */
export const purchasePackage = async (rcPackage) => {
    try {
        const { customerInfo } = await Purchases.purchasePackage(rcPackage);
        const isPremium = typeof customerInfo.entitlements.active['Culinora Pro'] !== 'undefined';

        if (isPremium) {
            return { success: true, customerInfo };
        }

        return { success: false, error: 'Satın alma tamamlandı fakat premium erişim aktif olmadı.' };
    } catch (error) {
        if (error.userCancelled) {
            return { success: false, userCancelled: true };
        }
        console.error('[RevenueCat] Satın alma hatası:', error);
        return {
            success: false,
            error: error.message || 'Satın alma sırasında bir hata oluştu.',
        };
    }
};

/**
 * Daha önce yapılan satın almaları geri yükler (Apple zorunlu kılar).
 * @returns {{ success: boolean, isPremium: boolean, error?: string }}
 */
export const restorePurchases = async () => {
    try {
        const customerInfo = await Purchases.restorePurchases();
        const isPremium = typeof customerInfo.entitlements.active['Culinora Pro'] !== 'undefined';

        return { success: true, isPremium, customerInfo };
    } catch (error) {
        console.error('[RevenueCat] Restore hatası:', error);
        return {
            success: false,
            isPremium: false,
            error: error.message || 'Satın alımlar geri yüklenemedi.',
        };
    }
};

/**
 * Aboneliği iptal ettirmek için App Store'un abonelik yönetim sayfasını açar.
 * Apple, aboneliğin doğrudan uygulama içinden iptal edilmesine izin vermiyor.
 */
export const openSubscriptionManagement = async () => {
    const { Linking } = require('react-native');
    const url = Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';

    try {
        await Linking.openURL(url);
    } catch (error) {
        console.error('[RevenueCat] Abonelik yönetimi açılamadı:', error);
    }
};
