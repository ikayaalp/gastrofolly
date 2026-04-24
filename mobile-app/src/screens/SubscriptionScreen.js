import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Platform,
    StatusBar,
    SafeAreaView,
    Linking,
} from 'react-native';
import {
    ArrowLeft,
    CheckCircle,
    Crown,
    Shield,
    Calendar,
    ExternalLink,
    PlayCircle,
    Sparkles,
    MessageCircle,
    Check
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
import { LinearGradient } from 'expo-linear-gradient';

const TERMS_URL = 'https://culinora.net/terms';
const PRIVACY_URL = 'https://culinora.net/privacy';

const FEATURES = [
    { icon: PlayCircle, title: 'Profesyonel Şef Eğitimleri', desc: 'Tüm video derslerini sınırsız izleyin.' },
    { icon: Sparkles, title: 'Reklamsız Deneyim', desc: 'Kesintisiz öğrenmeye odaklanın.' },
    { icon: MessageCircle, title: 'Birebir Şef Desteği', desc: 'Uzman eğitmenlerimize doğrudan soru sorun.' },
];

export default function SubscriptionScreen({ navigation, route }) {
    const courseId = route.params?.courseId;

    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [purchasing, setPurchasing] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [expirationDate, setExpirationDate] = useState(null);
    const [userData, setUserData] = useState(null);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [], type: 'info' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            let user = await authService.refreshUserData();
            if (!user) user = await authService.getCurrentUser();
            setUserData(user);

            const status = await getSubscriptionStatus();
            const hasBackendPremium = user?.subscriptionPlan === 'Premium' && (user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) > new Date() : true);
            const hasPremium = status.isPremium || hasBackendPremium;

            setIsPremium(hasPremium);
            setExpirationDate(status.expirationDate || (user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null));

            if (!hasPremium) {
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
            await authService.syncSubscription(true, exp ? new Date(exp) : null);
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
            const exp = result.customerInfo?.entitlements?.active?.['Culinora Pro']?.expirationDate;
            await authService.syncSubscription(true, exp ? new Date(exp) : null);
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
            const monthlyPrice = (pkg.product.price / 12).toFixed(2);
            return { label: 'Yıllık', subLabel: monthlyPrice + ' ' + pkg.product.currencyCode + '/ay', detail: '12 Ay • ' + pkg.product.priceString };
        }
        return { label: 'Aylık', subLabel: pkg.product.priceString + '/ay', detail: 'Her ay yenilenir' };
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <ArrowLeft size={24} color="#e5e5e5" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Abonelik Ayarları</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ea580c" />
                    <Text style={styles.loadingText}>Abonelik bilgileri yükleniyor...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#e5e5e5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Abonelik Ayarları</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {isPremium ? (
                    <View style={styles.premiumCard}>
                        <View style={styles.premiumHeader}>
                            <View style={styles.premiumIconWrap}>
                                <Crown size={32} color="#ea580c" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.premiumTitle}>Premium Üye</Text>
                                <Text style={styles.premiumDesc}>Tüm içeriklere erişiminiz aktif</Text>
                            </View>
                        </View>
                        
                        <View style={styles.divider} />

                        <View style={styles.premiumDetailRow}>
                            <Text style={styles.premiumDetailLabel}>Abonelik Durumu</Text>
                            <View style={styles.statusBadge}>
                                <Shield size={14} color="#10b981" />
                                <Text style={styles.statusBadgeText}>Aktif</Text>
                            </View>
                        </View>

                        {expirationDate && (
                            <View style={styles.premiumDetailRow}>
                                <Text style={styles.premiumDetailLabel}>Yenileme Tarihi</Text>
                                <Text style={styles.premiumDetailValue}>{formatDate(expirationDate)}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.manageButton} onPress={openSubscriptionManagement}>
                            <ExternalLink size={18} color="#e5e5e5" />
                            <Text style={styles.manageButtonText}>Aboneliği Yönet</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.paywallContainer}>
                        <View style={styles.paywallHeader}>
                            <Crown size={48} color="#ea580c" />
                            <Text style={styles.paywallTitle}>Culinora PRO</Text>
                            <Text style={styles.paywallSubtitle}>Sınırsız erişim ile şeflerin sırlarını keşfedin.</Text>
                        </View>

                        <View style={styles.featuresList}>
                            {FEATURES.map((f, i) => (
                                <View key={i} style={styles.featureItem}>
                                    <View style={styles.featureIconContainer}>
                                        <f.icon size={20} color="#ea580c" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.featureTitle}>{f.title}</Text>
                                        <Text style={styles.featureDesc}>{f.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <Text style={styles.plansTitle}>Plan Seçin</Text>
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
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Text style={[styles.pkgLabel, isSelected && styles.pkgLabelSelected]}>{info.label}</Text>
                                                    {isYearly && <View style={styles.bestValueBadge}><Text style={styles.bestValueText}>AVANTAJLI</Text></View>}
                                                </View>
                                                <Text style={styles.pkgDetail}>{info.detail}</Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.pkgPrice, isSelected && styles.pkgPriceSelected]}>{info.subLabel}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitButton, purchasing && styles.submitButtonDisabled]} 
                            onPress={handlePurchase} 
                            disabled={purchasing}
                        >
                            {purchasing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Devam Et</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <View style={styles.legalRow}>
                                <TouchableOpacity onPress={handleRestore} disabled={restoring}>
                                    <Text style={styles.legalLink}>{restoring ? 'Yükleniyor...' : 'Geri Yükle'}</Text>
                                </TouchableOpacity>
                                <Text style={styles.legalDot}>·</Text>
                                <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
                                    <Text style={styles.legalLink}>Koşullar</Text>
                                </TouchableOpacity>
                                <Text style={styles.legalDot}>·</Text>
                                <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
                                    <Text style={styles.legalLink}>Gizlilik</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.legalNote}>Abonelik otomatik yenilenir. İstediğiniz zaman iptal edebilirsiniz.</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} buttons={alertConfig.buttons} type={alertConfig.type} onClose={() => setAlertVisible(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 10 : 10,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#9ca3af',
        marginTop: 12,
        fontSize: 14,
    },

    // Premium Card Styles
    premiumCard: {
        backgroundColor: '#111',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1f2937',
        padding: 20,
    },
    premiumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    premiumIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(234,88,12,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    premiumDesc: {
        color: '#9ca3af',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#1f2937',
        marginVertical: 20,
    },
    premiumDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    premiumDetailLabel: {
        color: '#d1d5db',
        fontSize: 15,
    },
    premiumDetailValue: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        color: '#10b981',
        fontSize: 13,
        fontWeight: '600',
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#1f2937',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 10,
    },
    manageButtonText: {
        color: '#e5e5e5',
        fontSize: 15,
        fontWeight: '600',
    },

    // Paywall Styles
    paywallContainer: {
        flex: 1,
    },
    paywallHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    paywallTitle: {
        color: 'white',
        fontSize: 26,
        fontWeight: '900',
        marginTop: 12,
        marginBottom: 8,
    },
    paywallSubtitle: {
        color: '#9ca3af',
        fontSize: 15,
        textAlign: 'center',
    },
    featuresList: {
        marginBottom: 30,
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    featureIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(234,88,12,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    featureDesc: {
        color: '#9ca3af',
        fontSize: 13,
    },
    plansTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    packagesWrap: {
        gap: 12,
        marginBottom: 30,
    },
    pkgCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    pkgCardSelected: {
        borderColor: '#ea580c',
        backgroundColor: 'rgba(234,88,12,0.05)',
    },
    pkgCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#4b5563',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        borderColor: '#ea580c',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ea580c',
    },
    pkgLabel: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    pkgLabelSelected: {
        color: '#ea580c',
    },
    pkgDetail: {
        color: '#9ca3af',
        fontSize: 13,
        marginTop: 4,
    },
    pkgPrice: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    pkgPriceSelected: {
        color: '#ea580c',
    },
    bestValueBadge: {
        backgroundColor: '#ea580c',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    bestValueText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 24,
        alignItems: 'center',
    },
    legalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    legalLink: {
        color: '#9ca3af',
        fontSize: 13,
    },
    legalDot: {
        color: '#4b5563',
    },
    legalNote: {
        color: '#6b7280',
        fontSize: 12,
        textAlign: 'center',
    },
});

