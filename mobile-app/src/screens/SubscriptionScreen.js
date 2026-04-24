import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, ScrollView,
    StatusBar, ActivityIndicator, Platform, Linking, Animated,
    Dimensions, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
    X, Crown, Zap, Shield, BookOpen, Video, Award,
    Sparkles, ChefHat, Star, RefreshCw, ExternalLink,
    Calendar, CheckCircle, AlertCircle, Lock
} from 'lucide-react-native';
import authService from '../api/authService';
import {
    getSubscriptionStatus,
    getOfferings,
    purchasePackage,
    restorePurchases,
    openSubscriptionManagement,
} from '../api/revenueCatService';
import CustomAlert from '../components/CustomAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TERMS_URL = 'https://culinora.net/terms';
const PRIVACY_URL = 'https://culinora.net/privacy';

// Premium feature data
const FEATURES = [
    { icon: Video, title: 'Sınırsız Eğitim', desc: 'Tüm şef videolarını izle' },
    { icon: BookOpen, title: 'Premium Tarifler', desc: 'Özel profesyonel reçeteler' },
    { icon: Sparkles, title: 'Reklamsız Deneyim', desc: 'Kesintisiz gastronomi' },
    { icon: ChefHat, title: 'Birebir Şef Desteği', desc: 'Uzman eğitmenlerden cevaplar' },
    { icon: Award, title: 'Sertifika & Rozetler', desc: 'Başarılarını sergileyebilirsin' },
    { icon: Star, title: 'Öncelikli Erişim', desc: 'Yeni içerikler herkesten önce' },
];

export default function SubscriptionScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [expirationDate, setExpirationDate] = useState(null);
    const [packages, setPackages] = useState([]);
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [restoring, setRestoring] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const crownScale = useRef(new Animated.Value(0.3)).current;
    const crownRotate = useRef(new Animated.Value(0)).current;
    const ctaPulse = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const featureAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;
    const featureSlides = useRef(FEATURES.map(() => new Animated.Value(30))).current;

    // Alert
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [], type: 'info' });

    const showAlert = (title, message, buttons = [{ text: 'Tamam' }], type = 'info') => {
        setAlertConfig({ title, message, buttons, type });
        setAlertVisible(true);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            let user = await authService.refreshUserData();
            if (!user) user = await authService.getCurrentUser();
            setUserData(user);

            const status = await getSubscriptionStatus();
            
            // Backend'den (Web'den) alınmış bir abonelik var mı kontrolü
            const isBackendPremium = user?.subscriptionPlan && 
                                     user?.subscriptionPlan !== 'FREE' && 
                                     (user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) > new Date() : true);

            const hasPremium = status.isPremium || isBackendPremium;
            
            setIsPremium(hasPremium);
            setExpirationDate(status.expirationDate || (user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null));

            if (!hasPremium) {
                const availablePackages = await getOfferings();
                setPackages(availablePackages);
                if (availablePackages.length > 0) {
                    // Try to find the yearly package to select by default
                    const yearlyPkg = availablePackages.find(p => 
                        p?.product?.subscriptionPeriod?.includes('P1Y') || 
                        p?.identifier?.includes('year') || 
                        p?.identifier?.includes('annual')
                    );
                    setSelectedPkg(yearlyPkg || availablePackages[availablePackages.length - 1]);
                }
            }
        } catch (e) {
            console.error('loadData error:', e);
        } finally {
            setLoading(false);
            startAnimations();
        }
    }, []);

    const startAnimations = () => {
        // Main content fade + slide
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
        ]).start();

        // Crown entrance
        Animated.sequence([
            Animated.delay(200),
            Animated.parallel([
                Animated.spring(crownScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
                Animated.timing(crownRotate, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
            ]),
        ]).start();

        // Staggered features
        FEATURES.forEach((_, i) => {
            Animated.sequence([
                Animated.delay(400 + i * 100),
                Animated.parallel([
                    Animated.timing(featureAnims[i], { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.spring(featureSlides[i], { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
                ]),
            ]).start();
        });

        // CTA pulse loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(ctaPulse, { toValue: 1.03, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(ctaPulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();

        // Shimmer loop
        Animated.loop(
            Animated.timing(shimmerAnim, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: true })
        ).start();
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('tr-TR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getPackageLabel = (pkg) => {
        const id = pkg?.identifier || '';
        const period = pkg?.product?.subscriptionPeriod;
        if (period?.includes('P1M') || id.includes('month')) return 'Aylık';
        if (period?.includes('P1Y') || id.includes('year') || id.includes('annual')) return 'Yıllık';
        if (period?.includes('P1W') || id.includes('week')) return 'Haftalık';
        return 'Premium';
    };

    const getPackagePeriodLabel = (pkg) => {
        const id = pkg?.identifier || '';
        const period = pkg?.product?.subscriptionPeriod;
        if (period?.includes('P1M') || id.includes('month')) return '/ ay';
        if (period?.includes('P1Y') || id.includes('year') || id.includes('annual')) return '/ yıl';
        if (period?.includes('P1W') || id.includes('week')) return '/ hafta';
        return '';
    };

    const getPackageSavings = (pkg) => {
        const period = pkg?.product?.subscriptionPeriod;
        const id = pkg?.identifier || '';
        if (period?.includes('P1Y') || id.includes('year') || id.includes('annual')) return '%40 Tasarruf';
        return null;
    };

    const handlePurchase = async () => {
        if (!selectedPkg) return;
        setPurchasing(true);
        const result = await purchasePackage(selectedPkg);
        setPurchasing(false);

        if (result.userCancelled) return;

        if (result.success) {
            const exp = result.customerInfo?.entitlements?.active?.['Culinora Pro']?.expirationDate;
            await authService.syncSubscription(true, exp ? new Date(exp) : null);
            showAlert(
                '🎉 Hoş Geldiniz!',
                'Culinora Premium ayrıcalıklarına erişiminiz başladı. Tüm içeriklerin keyfini çıkarın!',
                [{ text: 'Harika!', onPress: () => loadData() }],
                'success'
            );
        } else {
            showAlert('Hata', result.error || 'Satın alma tamamlanamadı.', [{ text: 'Tamam' }], 'error');
        }
    };

    const handleRestore = async () => {
        setRestoring(true);
        const result = await restorePurchases();
        setRestoring(false);

        if (result.success && result.isPremium) {
            await authService.syncSubscription(true, null);
            showAlert('Başarılı', 'Premium erişiminiz geri yüklendi!', [{ text: 'Tamam', onPress: () => loadData() }], 'success');
        } else if (result.success && !result.isPremium) {
            await authService.syncSubscription(false, null);
            showAlert('Bilgi', 'Aktif bir premium üyeliğiniz bulunmamaktadır.', [{ text: 'Tamam' }], 'info');
        } else {
            showAlert('Hata', result.error || 'Geri yükleme başarısız oldu.', [{ text: 'Tamam' }], 'error');
        }
    };

    const crownRotation = crownRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['-15deg', '0deg'],
    });

    // ─── LOADING ─────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    // ─── PREMIUM ACTIVE VIEW ────────────────────────────────
    if (isPremium) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                    {/* Hero */}
                    <View style={styles.activeHero}>
                        <LinearGradient
                            colors={['#ea580c', '#c2410c', '#7c2d12']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.activeHeroGradient}
                        >
                            {/* Close */}
                            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                                <X size={22} color="rgba(255,255,255,0.9)" />
                            </TouchableOpacity>

                            <View style={styles.activeIconWrap}>
                                <Crown size={40} color="#fff" strokeWidth={2} />
                            </View>
                            <Text style={styles.activeTitle}>Culinora Premium</Text>
                            <Text style={styles.activeSubtitle}>Aktif Üyelik</Text>

                            <View style={styles.activeBadge}>
                                <Shield size={14} color="#fff" />
                                <Text style={styles.activeBadgeText}>Premium Üye</Text>
                            </View>

                            {expirationDate && (
                                <View style={styles.activeDateRow}>
                                    <Calendar size={14} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.activeDateText}>Yenileme: {formatDate(expirationDate)}</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </View>

                    {/* Active Features */}
                    <View style={styles.activeFeaturesWrap}>
                        <Text style={styles.activeSectionTitle}>Erişiminiz Olan Ayrıcalıklar</Text>
                        {FEATURES.map((f, i) => (
                            <View key={i} style={styles.activeFeatureRow}>
                                <LinearGradient colors={['rgba(234,88,12,0.15)', 'rgba(234,88,12,0.05)']} style={styles.activeFeatureIcon}>
                                    <f.icon size={18} color="#ea580c" />
                                </LinearGradient>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.activeFeatureTitle}>{f.title}</Text>
                                    <Text style={styles.activeFeatureDesc}>{f.desc}</Text>
                                </View>
                                <CheckCircle size={18} color="#22c55e" />
                            </View>
                        ))}
                    </View>

                    {/* Manage Button */}
                    <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
                        <TouchableOpacity style={styles.manageBtn} onPress={openSubscriptionManagement} activeOpacity={0.8}>
                            <ExternalLink size={18} color="#ea580c" />
                            <Text style={styles.manageBtnText}>Aboneliği Yönet</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
                <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} buttons={alertConfig.buttons} type={alertConfig.type} onClose={() => setAlertVisible(false)} />
            </View>
        );
    }

    // ─── PAYWALL (PURCHASE) VIEW ────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* ── Hero with Food Image ── */}
                <View style={styles.heroImageWrap}>
                    <Image
                        source="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=800"
                        style={styles.heroImage}
                        contentFit="cover"
                        transition={300}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)', '#000']}
                        locations={[0, 0.3, 0.7, 1]}
                        style={styles.heroOverlay}
                    />

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                        <View style={styles.closeBtnInner}>
                            <X size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Crown + Title */}
                    <Animated.View style={[styles.heroCrownWrap, {
                        opacity: fadeAnim,
                        transform: [
                            { scale: crownScale },
                            { rotate: crownRotation },
                        ]
                    }]}>
                        <LinearGradient
                            colors={['#ea580c', '#f97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroCrownCircle}
                        >
                            <Crown size={36} color="#fff" strokeWidth={2} />
                        </LinearGradient>
                    </Animated.View>
                </View>

                <Animated.View style={[styles.mainContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {/* Title & Subtitle */}
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>
                            Culinora <Text style={styles.titleAccent}>Premium</Text>
                        </Text>
                        <Text style={styles.mainSubtitle}>
                            Profesyonel şeflerden öğren.{'\n'}Tüm içeriklere sınırsız eriş.
                        </Text>
                    </View>

                    {/* ── Features Grid ── */}
                    <View style={styles.featuresGrid}>
                        {FEATURES.map((feature, index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.featureCard,
                                    {
                                        opacity: featureAnims[index],
                                        transform: [{ translateY: featureSlides[index] }],
                                    },
                                ]}
                            >
                                <LinearGradient
                                    colors={['rgba(234,88,12,0.12)', 'rgba(234,88,12,0.03)']}
                                    style={styles.featureCardInner}
                                >
                                    <View style={styles.featureIconWrap}>
                                        <feature.icon size={20} color="#ea580c" strokeWidth={2} />
                                    </View>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDesc}>{feature.desc}</Text>
                                </LinearGradient>
                            </Animated.View>
                        ))}
                    </View>

                    {/* ── Plan Selection ── */}
                    {packages.length > 0 ? (
                        <View style={styles.planSection}>
                            <Text style={styles.planSectionTitle}>Sana Uygun Planı Seç</Text>
                            <View style={styles.planCards}>
                                {packages.map((pkg, index) => {
                                    const isSelected = selectedPkg?.identifier === pkg.identifier;
                                    const isYearly = pkg?.product?.subscriptionPeriod?.includes('P1Y') || pkg?.identifier?.includes('year') || pkg?.identifier?.includes('annual');
                                    
                                    return (
                                        <TouchableOpacity
                                            key={pkg.identifier}
                                            onPress={() => setSelectedPkg(pkg)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={[styles.planCard, isSelected && styles.planCardSelected]}>
                                                {isYearly && (
                                                    <View style={styles.popularBadge}>
                                                        <Text style={styles.popularBadgeText}>EN AVANTAJLI</Text>
                                                    </View>
                                                )}
                                                
                                                <View style={styles.planCardContent}>
                                                    <View style={styles.planCardLeft}>
                                                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                                                            {isSelected && <View style={styles.radioInner} />}
                                                        </View>
                                                        <View>
                                                            <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                                                                {getPackageLabel(pkg)}
                                                            </Text>
                                                            <Text style={styles.planPeriodDesc}>
                                                                Otomatik yenilenir
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    
                                                    <View style={styles.planCardRight}>
                                                        <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                                                            {pkg.product?.priceString || '-'}
                                                        </Text>
                                                        <Text style={styles.planPeriodLabel}>
                                                            {getPackagePeriodLabel(pkg)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* CTA Button */}
                            <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
                                <TouchableOpacity
                                    onPress={handlePurchase}
                                    disabled={purchasing || !selectedPkg}
                                    activeOpacity={0.9}
                                    style={styles.ctaButton}
                                >
                                    <LinearGradient
                                        colors={['#ea580c', '#dc2626']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.ctaInner}
                                    >
                                        {purchasing ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <>
                                                <Crown size={20} color="#fff" strokeWidth={2.5} />
                                                <Text style={styles.ctaText}>Premium'a Geç</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                            <Text style={styles.cancelNote}>İstediğin zaman iptal et · Taahhüt yok</Text>
                        </View>
                    ) : (
                        <View style={styles.errorBox}>
                            <View style={styles.errorIconWrap}>
                                <AlertCircle size={28} color="#ea580c" />
                            </View>
                            <Text style={styles.errorTitle}>Paketler Yüklenemedi</Text>
                            <Text style={styles.errorBody}>
                                Ürünler şu an listelenemiyor. Eğer TestFlight sürümünü henüz yüklemediyseniz, işlemi TestFlight buildinden deneyin.
                            </Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
                                <RefreshCw size={16} color="#ea580c" />
                                <Text style={styles.retryText}>Tekrar Dene</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── Restore & Legal ── */}
                    <View style={styles.bottomSection}>
                        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
                            {restoring ? (
                                <ActivityIndicator size="small" color="#ea580c" />
                            ) : (
                                <RefreshCw size={14} color="#ea580c" />
                            )}
                            <Text style={styles.restoreText}>Satın Alımlarımı Geri Yükle</Text>
                        </TouchableOpacity>

                        <View style={styles.legalRow}>
                            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
                                <Text style={styles.legalLink}>Kullanım Koşulları</Text>
                            </TouchableOpacity>
                            <Text style={styles.legalDot}>·</Text>
                            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
                                <Text style={styles.legalLink}>Gizlilik Politikası</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.legalNote}>
                            Ödeme Apple Kimliğinizden tahsil edilir. İptal edilmediği sürece abonelik otomatik yenilenir.
                            Satın alım sonrasında hesap ayarlarından yönetebilirsiniz.
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>

            <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} buttons={alertConfig.buttons} type={alertConfig.type} onClose={() => setAlertVisible(false)} />
        </View>
    );
}

// ════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'rgba(255,255,255,0.5)',
        marginTop: 12,
        fontSize: 14,
    },

    // ── Close Button ──
    closeBtn: {
        position: 'absolute',
        top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 54,
        right: 16,
        zIndex: 10,
    },
    closeBtnInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },

    // ── Hero Image (Paywall) ──
    heroImageWrap: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.28,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    heroCrownWrap: {
        position: 'absolute',
        bottom: -28,
        alignSelf: 'center',
        zIndex: 5,
    },
    heroCrownCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
        borderWidth: 3,
        borderColor: '#000',
    },

    // ── Main Content ──
    mainContent: {
        paddingTop: 36,
    },

    // ── Title Section ──
    titleSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    mainTitle: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 10,
    },
    titleAccent: {
        color: '#ea580c',
    },
    mainSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },

    // ── Features Grid (2-col) ──
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        marginBottom: 32,
        gap: 10,
    },
    featureCard: {
        width: (SCREEN_WIDTH - 42) / 2,
    },
    featureCardInner: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(234,88,12,0.12)',
        minHeight: 110,
    },
    featureIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(234,88,12,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    featureTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    featureDesc: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 12,
        lineHeight: 16,
    },

    // ── Plan Section ──
    planSection: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    planSectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 20,
        textAlign: 'center',
    },
    planCards: {
        flexDirection: 'column',
        gap: 14,
        marginBottom: 24,
    },
    planCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        position: 'relative',
    },
    planCardSelected: {
        borderColor: '#ea580c',
        backgroundColor: 'rgba(234,88,12,0.08)',
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 16,
        backgroundColor: '#ea580c',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 2,
    },
    popularBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    planCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    planCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: '#ea580c',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ea580c',
    },
    planLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    planLabelSelected: {
        color: '#fff',
    },
    planPeriodDesc: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
    planCardRight: {
        alignItems: 'flex-end',
    },
    planPrice: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    planPriceSelected: {
        color: '#ea580c',
    },
    planPeriodLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '500',
    },

    // ── CTA Button ──
    ctaButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    ctaInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: 16,
    },
    ctaText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    cancelNote: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
    },

    // ── Error Box ──
    errorBox: {
        marginHorizontal: 20,
        alignItems: 'center',
        padding: 28,
        backgroundColor: 'rgba(234,88,12,0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(234,88,12,0.15)',
        marginBottom: 20,
    },
    errorIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(234,88,12,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    errorTitle: {
        color: '#ea580c',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    errorBody: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(234,88,12,0.1)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(234,88,12,0.2)',
    },
    retryText: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '600',
    },

    // ── Bottom (Restore + Legal) ──
    bottomSection: {
        paddingHorizontal: 20,
        paddingTop: 16,
        alignItems: 'center',
    },
    restoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        marginBottom: 8,
    },
    restoreText: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '600',
    },
    legalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    legalLink: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    legalDot: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 12,
    },
    legalNote: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 10,
    },

    // ══════════════════════════════════════════
    // ── ACTIVE PREMIUM VIEW ──
    // ══════════════════════════════════════════
    activeHero: {
        overflow: 'hidden',
    },
    activeHeroGradient: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 60 : 100,
        paddingBottom: 36,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    activeIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    activeTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 4,
    },
    activeSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 16,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 6,
        marginBottom: 12,
    },
    activeBadgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    activeDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    activeDateText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
    },

    activeFeaturesWrap: {
        padding: 20,
    },
    activeSectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    activeFeatureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 14,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    activeFeatureIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeFeatureTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    activeFeatureDesc: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },

    manageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(234,88,12,0.2)',
        backgroundColor: 'rgba(234,88,12,0.06)',
    },
    manageBtnText: {
        color: '#ea580c',
        fontSize: 15,
        fontWeight: '700',
    },
});
