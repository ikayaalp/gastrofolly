import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    Image,
    Platform,
    StatusBar,
    Animated,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    X,
    Check,
    Crown,
    Shield,
    Calendar,
    ArrowRight,
    ExternalLink,
    PlayCircle,
    BookOpen,
    Sparkles,
    ChefHat,
    MessageCircle,
} from 'lucide-react-native';
import {
    getSubscriptionStatus,
    getOfferings,
    purchasePackage,
    restorePurchases,
    openSubscriptionManagement,
} from '../api/revenueCatService';
import authService from '../api/authService';
import CustomAlert from '../components/CustomAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TERMS_URL = 'https://culinora.net/terms';
const PRIVACY_URL = 'https://culinora.net/privacy';

const FEATURES = [
    { icon: PlayCircle, title: 'Profesyonel Şef Eğitimleri', desc: 'Dünya çapındaki şeflerin gizli tekniklerini ve tüm video derslerini sınırsız izleyin.' },
    { icon: MessageCircle, title: 'Birebir Şef Desteği', desc: 'Eğitimlerde takıldığınız her an uzman eğitmenlerimize doğrudan soru sorun.' },
];

export default function SubscriptionScreen({ navigation, route }) {
    const courseId = route.params?.courseId; // Redirection target if any

    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [purchasing, setPurchasing] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [expirationDate, setExpirationDate] = useState(null);
    const [userData, setUserData] = useState(null);

    // Alert state
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [], type: 'info' });

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        loadData();
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(contentTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Always refresh from backend first - backend is the source of truth
            let user = await authService.refreshUserData();
            if (!user) user = await authService.getCurrentUser();
            setUserData(user);

            // Backend is the PRIMARY source of truth for premium status
            const hasBackendPremium = user?.subscriptionPlan === 'Premium' && (user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) > new Date() : true);

            // Check RevenueCat as secondary - only to sync NEW purchases TO backend
            const status = await getSubscriptionStatus();
            
            // If RevenueCat says premium but backend doesn't, sync RC→Backend and re-check
            if (status.isPremium && !hasBackendPremium) {
                console.log('[Subscription] RevenueCat premium but backend not — syncing...');
                await authService.syncSubscription(true, status.expirationDate);
                // Re-fetch user after sync to get updated backend status
                user = await authService.refreshUserData();
                if (!user) user = await authService.getCurrentUser();
                setUserData(user);
            }

            // Final premium check — always from backend
            const finalBackendPremium = user?.subscriptionPlan === 'Premium' && (user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) > new Date() : true);
            
            setIsPremium(finalBackendPremium);
            setExpirationDate(user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) : status.expirationDate);

            if (!finalBackendPremium) {
                const availablePackages = await getOfferings();
                const uniquePackages = [];
                const seenPeriods = new Set();
                availablePackages.forEach(pkg => {
                    const isYearly = pkg?.product?.subscriptionPeriod?.includes('P1Y') || pkg?.identifier?.includes('year') || pkg?.identifier?.includes('annual');
                    const isMonthly = pkg?.product?.subscriptionPeriod?.includes('P1M') || pkg?.identifier?.includes('month');
                    const periodKey = isYearly ? 'yearly' : (isMonthly ? 'monthly' : pkg.identifier);
                    if (!seenPeriods.has(periodKey)) {
                        seenPeriods.add(periodKey);
                        uniquePackages.push(pkg);
                    }
                });
                setPackages(uniquePackages);
                if (uniquePackages.length > 0) {
                    const yearlyPkg = uniquePackages.find(p => p?.product?.subscriptionPeriod?.includes('P1Y') || p?.identifier?.includes('year') || p?.identifier?.includes('annual'));
                    setSelectedPkg(yearlyPkg || uniquePackages[0]);
                }
            } else if (courseId) {
                // If they are already premium and land here with a courseId, just send them to Learn
                navigation.replace('Learn', { courseId });
            }
        } catch (e) {
            console.error('Paywall load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessRedirect = () => {
        if (courseId) {
            navigation.replace('Learn', { courseId });
        } else {
            navigation.goBack();
        }
    };

    const handlePurchase = async () => {
        if (!selectedPkg) return;
        setPurchasing(true);
        const result = await purchasePackage(selectedPkg);
        setPurchasing(false);

        if (result.userCancelled) return;

        if (result.success) {
            const exp = result.customerInfo?.entitlements?.active?.['Culinora Pro']?.expirationDate;
            // SYNC with backend - IMPORTANT: We use 'Premium' (case sensitive match for backend)
            await authService.syncSubscription(true, exp ? new Date(exp) : null);
            
            // Direct redirect instead of intermediate alert for smoother flow
            handleSuccessRedirect();
        } else {
            setAlertConfig({
                title: 'Hata',
                message: result.error || 'İşlem tamamlanamadı.',
                buttons: [{ text: 'Tamam' }],
                type: 'error'
            });
            setAlertVisible(true);
        }
    };

    const handleRestore = async () => {
        setRestoring(true);
        const result = await restorePurchases();
        setRestoring(false);
        if (result.success && result.isPremium) {
            await authService.syncSubscription(true, null);
            setAlertConfig({
                title: 'Başarılı',
                message: 'Aboneliğiniz geri yüklendi ve tüm içerikler aktif edildi.',
                buttons: [{ text: 'Harika', onPress: handleSuccessRedirect }],
                type: 'success'
            });
            setAlertVisible(true);
        } else {
            setAlertConfig({
                title: 'Bilgi',
                message: 'Aktif bir premium abonelik bulunamadı.',
                buttons: [{ text: 'Tamam' }],
                type: 'info'
            });
            setAlertVisible(true);
        }
    };

    const formatDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    };

    const getPackageInfo = (pkg) => {
        const id = pkg?.identifier || '';
        const period = pkg?.product?.subscriptionPeriod;
        if (period?.includes('P1Y') || id.includes('year') || id.includes('annual')) {
            return { 
                label: 'Yıllık', 
                billedAmount: pkg.product.priceString + '/yıl',
                monthlyCalc: null, // Removed the long 'aylık şu kadar' text to fix layout
                detail: 'Her yıl otomatik yenilenir',
                duration: '12 Ay',
                fullPrice: pkg.product.priceString
            };
        }
        return { 
            label: 'Aylık', 
            billedAmount: pkg.product.priceString + '/ay',
            monthlyCalc: null,
            detail: 'Her ay otomatik yenilenir',
            duration: '1 Ay',
            fullPrice: pkg.product.priceString
        };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    if (isPremium) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }}>
                    <View style={styles.activeHero}>
                        <LinearGradient colors={['#ea580c', '#c2410c', '#7c2d12']} style={styles.activeHeroGradient}>
                            <TouchableOpacity style={styles.closeBtnTop} onPress={() => navigation.goBack()}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.activeIconWrap}><Crown size={40} color="#fff" /></View>
                            <Text style={styles.activeTitle}>Culinora Premium</Text>
                            <Text style={styles.activeSubtitle}>Aktif Üyelik</Text>
                            <View style={styles.activeBadge}><Shield size={14} color="#fff" /><Text style={styles.activeBadgeText}>Premium Üye</Text></View>
                        </LinearGradient>
                    </View>
                    <View style={styles.activeFeaturesWrap}>
                        <Text style={styles.activeSectionTitle}>Ayrıcalıklarınız</Text>
                        {FEATURES.map((f, i) => (
                            <View key={i} style={styles.activeFeatureRow}>
                                <View style={styles.activeFeatureIcon}><f.icon size={20} color="#ea580c" /></View>
                                <View style={{ flex: 1 }}><Text style={styles.activeFeatureTitle}>{f.title}</Text><Text style={styles.activeFeatureDesc}>{f.desc}</Text></View>
                                <Check size={18} color="#10b981" />
                            </View>
                        ))}
                    </View>
                    <View style={{ paddingHorizontal: 20, gap: 12 }}>
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSuccessRedirect}><Text style={styles.primaryBtnText}>Hemen Başla</Text><ArrowRight size={20} color="#fff" /></TouchableOpacity>
                        <TouchableOpacity style={styles.manageBtn} onPress={openSubscriptionManagement}><ExternalLink size={18} color="#ea580c" /><Text style={styles.manageBtnText}>Aboneliği Yönet</Text></TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View style={styles.heroWrap}>
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop' }} 
                        style={styles.heroImage} 
                    />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.heroOverlay} />
                    <TouchableOpacity style={styles.closeBtnTop} onPress={() => navigation.goBack()}>
                        <View style={styles.closeBtnCircle}><X size={20} color="#fff" /></View>
                    </TouchableOpacity>
                </View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: contentTranslateY }], paddingHorizontal: 24, alignItems: 'center' }}>
                    <Text style={styles.paywallTitle}>Culinora Premium'a Geçin</Text>
                    <Text style={styles.paywallSubtitle}>Tüm profesyonel mutfak tekniklerine ve tariflerine sınırsız erişim sağlayın.</Text>

                    <View style={styles.featuresList}>
                        {FEATURES.map((f, i) => (
                            <View key={i} style={styles.featureItem}>
                                <f.icon size={20} color="#ea580c" />
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={styles.featureItemTitle}>{f.title}</Text>
                                    <Text style={styles.featureItemDesc}>{f.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.packagesWrap}>
                        {packages.map((pkg) => {
                            const isSelected = selectedPkg?.identifier === pkg.identifier;
                            const info = getPackageInfo(pkg);
                            const isYearly = pkg?.product?.subscriptionPeriod?.includes('P1Y') || pkg?.identifier?.includes('year') || pkg?.identifier?.includes('annual');

                            return (
                                <TouchableOpacity 
                                    key={pkg.identifier} 
                                    onPress={() => setSelectedPkg(pkg)}
                                    activeOpacity={0.8}
                                    style={[styles.pkgCard, isSelected && styles.pkgCardSelected]}
                                >
                                    <View style={styles.pkgCardLeft}>
                                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                        <View>
                                            <Text style={[styles.pkgLabel, isSelected && styles.pkgLabelSelected]}>{info.label}</Text>
                                            <Text style={styles.pkgDetail}>{info.detail}</Text>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.pkgBilledAmount, isSelected && styles.pkgBilledAmountSelected]}>{info.billedAmount}</Text>
                                        {info.monthlyCalc && <Text style={styles.pkgMonthlyCalc}>{info.monthlyCalc}</Text>}
                                        {isYearly && <View style={styles.bestValueBadge}><Text style={styles.bestValueText}>EN AVANTAJLI</Text></View>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Subscription Info - Apple Required */}
                    {selectedPkg && (
                        <View style={styles.subscriptionInfoBox}>
                            <Text style={styles.subscriptionInfoTitle}>Abonelik Bilgileri</Text>
                            <Text style={styles.subscriptionInfoText}>• Abonelik Adı: Culinora Premium</Text>
                            <Text style={styles.subscriptionInfoText}>• Süre: {getPackageInfo(selectedPkg).duration}</Text>
                            <Text style={styles.subscriptionInfoText}>• Faturalanan Tutar: {getPackageInfo(selectedPkg).billedAmount}</Text>
                            <Text style={styles.subscriptionInfoText}>• Ödeme Apple ID hesabınızdan tahsil edilir.</Text>
                            <Text style={styles.subscriptionInfoText}>• Abonelik, mevcut dönemin bitiminden en az 24 saat önce iptal edilmezse otomatik yenilenir.</Text>
                        </View>
                    )}

                    <TouchableOpacity 
                        style={styles.ctaBtn} 
                        onPress={handlePurchase} 
                        disabled={purchasing}
                        activeOpacity={0.9}
                    >
                        <LinearGradient colors={['#ea580c', '#c2410c']} style={styles.ctaGradient}>
                            {purchasing ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Devam Et</Text>}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <View style={styles.legalLinksRow}>
                            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
                                <Text style={styles.legalLinkText}>Kullanım Koşulları (EULA)</Text>
                            </TouchableOpacity>
                            <Text style={styles.legalDot}>•</Text>
                            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
                                <Text style={styles.legalLinkText}>Gizlilik Politikası</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={handleRestore} disabled={restoring} style={{ marginTop: 12 }}>
                            <Text style={styles.restoreLink}>{restoring ? 'Yükleniyor...' : 'Satın Alımları Geri Yükle'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.legalNote}>Abonelik Apple ID hesabınızdan tahsil edilir ve mevcut dönemin bitiminden en az 24 saat önce iptal edilmezse otomatik yenilenir. Aboneliği Ayarlar {'>'} Apple ID {'>'} Abonelikler bölümünden yönetebilirsiniz.</Text>
                    </View>
                </Animated.View>
            </ScrollView>

            <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} buttons={alertConfig.buttons} type={alertConfig.type} onClose={() => setAlertVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14 },
    heroWrap: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.3, position: 'relative' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
    closeBtnTop: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, zIndex: 10 },
    closeBtnCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    paywallTitle: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
    paywallSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 15, textAlign: 'center', marginBottom: 30, paddingHorizontal: 10 },
    featuresList: { width: '100%', marginBottom: 30, gap: 20 },
    featureItem: { alignItems: 'center', gap: 8 },
    featureItemTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    featureItemDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
    packagesWrap: { width: '100%', gap: 12, marginBottom: 20 },
    pkgCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
    pkgCardSelected: { borderColor: '#ea580c', backgroundColor: 'rgba(234,88,12,0.08)' },
    pkgCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    radioSelected: { borderColor: '#ea580c' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ea580c' },
    pkgLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
    pkgLabelSelected: { color: '#ea580c' },
    pkgDetail: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
    pkgBilledAmount: { color: '#fff', fontSize: 18, fontWeight: '800' },
    pkgBilledAmountSelected: { color: '#fff' },
    pkgMonthlyCalc: { color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 },
    bestValueBadge: { backgroundColor: '#ea580c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    bestValueText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    subscriptionInfoBox: { width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    subscriptionInfoTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700', marginBottom: 10 },
    subscriptionInfoText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 18 },
    ctaBtn: { width: '100%', borderRadius: 20, overflow: 'hidden' },
    ctaGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    ctaText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    activeHero: { height: 280, width: SCREEN_WIDTH },
    activeHeroGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    activeIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    activeTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 5 },
    activeSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 15 },
    activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 10 },
    activeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    activeDateText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    activeFeaturesWrap: { padding: 24 },
    activeSectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 20 },
    activeFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16 },
    activeFeatureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(234,88,12,0.1)', justifyContent: 'center', alignItems: 'center' },
    activeFeatureTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
    activeFeatureDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, backgroundColor: '#ea580c', gap: 10 },
    primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    manageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(234,88,12,0.2)', marginTop: 10 },
    manageBtnText: { color: '#ea580c', fontSize: 15, fontWeight: '700' },
    footer: { marginTop: 24, alignItems: 'center' },
    legalLinksRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    legalLinkText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecorationLine: 'underline' },
    legalDot: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
    restoreLink: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
    legalNote: { color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center', marginTop: 12, paddingHorizontal: 10, lineHeight: 16 },
});
