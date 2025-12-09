import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Award, Calendar, CheckCircle, CreditCard, Shield, LogOut } from 'lucide-react-native';
import authService from '../api/authService';
import CustomAlert from '../components/CustomAlert';

export default function SubscriptionScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: [],
        type: 'info'
    });

    const showAlert = (title, message, buttons = [{ text: 'Tamam' }], type = 'info') => {
        setAlertConfig({ title, message, buttons, type });
        setAlertVisible(true);
    };

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const user = await authService.getCurrentUser();
        setUserData(user);
        setLoading(false);
    };

    const getPlanName = (plan) => {
        switch (plan) {
            case 'Commis': return 'Commis (Başlangıç)';
            case 'Chef D party': return 'Chef de Partie (Orta Seviye)';
            case 'Executive': return 'Executive Chef (Profesyonel)';
            default: return 'Ücretsiz Üyelik';
        }
    };

    const getPlanColor = (plan) => {
        switch (plan) {
            case 'Executive':
                return ['#9333ea', '#7e22ce']; // Purple
            case 'Chef D party':
                return ['#ea580c', '#c2410c']; // Orange
            case 'Commis':
                return ['#6b7280', '#4b5563']; // Gray
            default:
                return ['#374151', '#1f2937']; // Dark Gray
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const FeatureItem = ({ text }) => (
        <View style={styles.featureItem}>
            <CheckCircle size={16} color="#22c55e" />
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );

    const handleCancelSubscription = () => {
        showAlert(
            'Abonelik İptali',
            'Aboneliğinizi iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz ve premium özelliklere erişiminizi kaybedersiniz.',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'İptal Et',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        const result = await authService.cancelSubscription();
                        if (result.success) {
                            showAlert('Başarılı', 'Aboneliğiniz iptal edildi.', [{ text: 'Tamam' }], 'success');
                            loadUserData(); // Reload to show free plan
                        } else {
                            showAlert('Hata', result.error, [{ text: 'Tamam' }], 'error');
                            setLoading(false);
                        }
                    }
                }
            ],
            'confirm'
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Abonelik Bilgileri</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                <Text style={styles.sectionTitle}>Mevcut Plan</Text>

                <LinearGradient
                    colors={getPlanColor(userData?.subscriptionPlan)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.subscriptionCard}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.iconBox}>
                            <Award size={32} color="white" />
                        </View>
                        <View>
                            <Text style={styles.planLabel}>Paketiniz</Text>
                            <Text style={styles.planName}>{getPlanName(userData?.subscriptionPlan)}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.datesContainer}>
                        <View style={styles.dateRow}>
                            <Calendar size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.dateText}>
                                Başlangıç: {formatDate(userData?.subscriptionStartDate || new Date())}
                            </Text>
                        </View>
                        {userData?.subscriptionEndDate && (
                            <View style={styles.dateRow}>
                                <Calendar size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.dateText}>
                                    Yenileme: {formatDate(userData?.subscriptionEndDate)}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.statusBadge}>
                        <Shield size={12} color="white" />
                        <Text style={styles.statusText}>Aktif Abonelik</Text>
                    </View>
                </LinearGradient>

                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Paket Özellikleri</Text>
                    <View style={styles.featuresList}>
                        <FeatureItem text="Tüm başlangıç seviye derslere erişim" />
                        <FeatureItem text="Reklamsız izleme deneyimi" />
                        <FeatureItem text="Çevrimdışı izleme (Yakında)" />
                        <FeatureItem text="Eğitmen soru-cevap desteği" />
                    </View>
                </View>

                {userData?.subscriptionPlan && userData?.subscriptionPlan !== 'FREE' && (
                    <TouchableOpacity
                        style={[styles.manageButton, styles.cancelButton]}
                        onPress={handleCancelSubscription}
                    >
                        <LogOut size={20} color="#ef4444" />
                        <Text style={[styles.manageButtonText, styles.cancelButtonText]}>Aboneliği İptal Et</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.footerText}>
                    Aboneliğinizi web sitemiz üzerinden (gastrofolly.com) yönetebilir veya iptal edebilirsiniz.
                </Text>

            </ScrollView>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
            />
        </View>
    );
}

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subscriptionCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    planLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 4,
    },
    planName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 20,
    },
    datesContainer: {
        gap: 8,
        marginBottom: 20,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dateText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.3)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.4)',
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    infoSection: {
        marginBottom: 32,
    },
    infoTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    featuresList: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    featureText: {
        color: '#d1d5db',
        fontSize: 14,
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1f2937',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginBottom: 24,
    },
    manageButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    cancelButton: {
        marginTop: 24,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    cancelButtonText: {
        color: '#ef4444',
    },
    footerText: {
        color: '#6b7280',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
});
