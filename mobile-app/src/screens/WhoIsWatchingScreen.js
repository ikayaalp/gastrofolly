import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut } from 'lucide-react-native';
import authService from '../api/authService';
import courseService from '../api/courseService';
import { logoutRevenueCat } from '../api/revenueCatService';
import {
    getToken,
    removeToken,
    getProfileCache,
    removeProfileCache,
} from '../utils/tokenStorage';
import { colors, spacing, radius, typography } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Arka plan kolajı: 3 sütun dikey kurs afişi, ekranı dolduracak kadar satır.
const COLLAGE_COLUMNS = 3;
const COLLAGE_ITEM_WIDTH = SCREEN_WIDTH / COLLAGE_COLUMNS;
const COLLAGE_ITEM_HEIGHT = COLLAGE_ITEM_WIDTH * 1.5;
const COLLAGE_COUNT = COLLAGE_COLUMNS * (Math.ceil(SCREEN_HEIGHT / COLLAGE_ITEM_HEIGHT) + 1);

/**
 * "Kim izliyor?" — başka cihazdan giriş yapılıp oturum devralındığında gösterilir.
 * Token silinmemiştir (apiClient 401 akışı korur); profile dokununca
 * /api/auth/mobile-reclaim ile oturum şifresiz bu cihaza geri alınır.
 * Bilinçli çıkışta bu ekran görünmez (profil önbelleği logout'ta silinir).
 */
export default function WhoIsWatchingScreen({ navigation }) {
    const [profile, setProfile] = useState(null);
    const [covers, setCovers] = useState([]);
    const [isReclaiming, setIsReclaiming] = useState(false);

    // Tam temizlik yapıp Login'e düşür (reclaim başarısız / farklı hesap seçimi)
    const fullSignOut = useCallback(async () => {
        try {
            await removeToken();
            await removeProfileCache();
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('userId');
            await logoutRevenueCat();
        } catch (e) {
            console.warn('WhoIsWatching cleanup error:', e?.message);
        }
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, [navigation]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const token = await getToken();
            if (!token) {
                // Token yoksa geri alınacak oturum da yok → normal giriş
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }

            let cached = await getProfileCache();
            if (!cached) {
                // Eski sürümden gelen kullanıcıda önbellek olmayabilir → userData'dan tohumla
                try {
                    const raw = await AsyncStorage.getItem('userData');
                    cached = raw ? JSON.parse(raw) : null;
                } catch (e) {
                    cached = null;
                }
            }
            if (cancelled) return;
            if (!cached?.name && !cached?.email) {
                // Kim olduğunu gösteremiyorsak picker anlamsız → normal giriş
                await fullSignOut();
                return;
            }
            setProfile(cached);

            // Arka plan kolajı — public endpoint, token geçersizken de çalışır.
            // Yüklenemezse sade degrade fallback kalır.
            const res = await courseService.getFeaturedCourses();
            if (cancelled) return;
            if (res.success) {
                const urls = (res.data?.courses || [])
                    .map((c) => c.posterImageUrl || c.thumbnailImageUrl || c.imageUrl)
                    .filter(Boolean);
                setCovers(urls.slice(0, COLLAGE_COUNT));
            }
        };

        load();
        return () => { cancelled = true; };
    }, [navigation, fullSignOut]);

    const handleReclaim = async () => {
        if (isReclaiming) return;
        setIsReclaiming(true);
        try {
            const result = await authService.reclaimSession();
            if (result.success) {
                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
            } else {
                // Token süresi dolmuş veya kullanıcı yok → temiz Login
                Alert.alert(
                    'Oturum Yenilenemedi',
                    'Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.',
                    [{ text: 'Tamam' }]
                );
                await fullSignOut();
            }
        } finally {
            setIsReclaiming(false);
        }
    };

    const displayName = profile?.name || profile?.email || 'Profilim';
    const initial = displayName.trim().charAt(0).toUpperCase();

    return (
        <View style={styles.container}>
            {/* Arka plan: kurs afişi kolajı (varsa) */}
            {covers.length > 0 && (
                <View style={styles.collage} pointerEvents="none">
                    {covers.map((uri, i) => (
                        <Image
                            key={`${uri}-${i}`}
                            source={{ uri }}
                            style={styles.collageItem}
                            resizeMode="cover"
                        />
                    ))}
                </View>
            )}

            {/* Karartma: ön plan her koşulda okunur kalsın */}
            <LinearGradient
                colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            <View style={styles.content}>
                <Text style={styles.title}>Kim izliyor?</Text>
                <Text style={styles.subtitle}>
                    Hesabınızda başka bir cihazda oturum açıldığı için{'\n'}
                    oturumunuz kapatıldı. Devam etmek için profilinizi seçin.
                </Text>

                <TouchableOpacity
                    style={styles.profileCard}
                    onPress={handleReclaim}
                    activeOpacity={0.8}
                    disabled={isReclaiming}
                >
                    <View style={styles.avatarWrapper}>
                        {profile?.image ? (
                            <Image source={{ uri: profile.image }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarFallback]}>
                                <Text style={styles.avatarInitial}>{initial}</Text>
                            </View>
                        )}
                        {isReclaiming && (
                            <View style={styles.avatarOverlay}>
                                <ActivityIndicator size="large" color={colors.text} />
                            </View>
                        )}
                    </View>
                    <Text style={styles.profileName} numberOfLines={1}>
                        {displayName}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.switchButton}
                    onPress={fullSignOut}
                    disabled={isReclaiming}
                    activeOpacity={0.7}
                >
                    <LogOut size={16} color={colors.textMuted} />
                    <Text style={styles.switchButtonText}>Farklı Hesapla Giriş Yap</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const AVATAR_SIZE = 128;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    collage: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        flexWrap: 'wrap',
        opacity: 0.5,
    },
    collageItem: {
        width: COLLAGE_ITEM_WIDTH,
        height: COLLAGE_ITEM_HEIGHT,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xxl,
    },
    title: {
        color: colors.text,
        fontSize: typography.size['5xl'],
        fontWeight: typography.weight.normal,
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    subtitle: {
        color: colors.textMuted,
        fontSize: typography.size.base,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.xxxl + spacing.lg,
    },
    profileCard: {
        alignItems: 'center',
    },
    avatarWrapper: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: radius.xl,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: radius.xl,
    },
    avatarFallback: {
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        color: colors.text,
        fontSize: typography.size['5xl'] + 16,
        fontWeight: typography.weight.bold,
    },
    avatarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileName: {
        color: colors.textSecondary,
        fontSize: typography.size['2xl'],
        fontWeight: typography.weight.medium,
        marginTop: spacing.lg,
        maxWidth: SCREEN_WIDTH - spacing.xxxl * 2,
    },
    switchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.xxxl + spacing.xxxl,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    switchButtonText: {
        color: colors.textMuted,
        fontSize: typography.size.md,
        fontWeight: typography.weight.medium,
        letterSpacing: 0.5,
    },
});
