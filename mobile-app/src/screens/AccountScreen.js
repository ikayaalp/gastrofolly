import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Image,
    Platform,
    Switch,
    Linking,
    ActivityIndicator
} from 'react-native';
import {
    User,
    Settings,
    LogOut,
    BookOpen,
    Heart,
    MessageCircle,
    ChevronRight,
    Award,
    Play,
    MessageSquare,
    Shield,
    Bell,
    Lock,
    HelpCircle,
    Info,
    Globe,
    Trash2,
    Share2,
    Star,
    AlertCircle,
    Crown
} from 'lucide-react-native';
import authService from '../api/authService';
import CustomAlert from '../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import AuthBackground from '../components/AuthBackground';
import Logo from '../components/Logo';

export default function AccountScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInitLoading, setIsInitLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState('tr');
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
        const unsubscribe = navigation.addListener('focus', () => {
            loadUserData();
        });
        loadUserData();
        return unsubscribe;
    }, [navigation]);

    const loadUserData = async () => {
        const token = await AsyncStorage.getItem('authToken');
        setIsLoggedIn(!!token);
        setIsInitLoading(false);
        if (token) {
            const user = await authService.getCurrentUser();
            setUserData(user);
        } else {
            setUserData(null);
        }
    };

    const handleLogout = () => {
        showAlert(
            'Çıkış Yap',
            'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        await authService.logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }
                }
            ],
            'confirm'
        );
    };

    const handleDeleteAccount = () => {
        showAlert(
            'Hesabı Sil',
            'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Hesabımı Sil',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await authService.deleteAccount();
                        if (result.success) {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } else {
                            showAlert('Hata', result.error, [{ text: 'Tamam' }], 'error');
                        }
                    }
                }
            ],
            'confirm'
        );
    };

    const handleHelp = () => {
        showAlert(
            'Yardım Merkezi',
            'Destek için bize e-posta gönderebilirsiniz:\n\ninfo@culinora.net',
            [{ text: "Kopyala", onPress: () => { } }, { text: "Tamam" }],
            'info'
        );
    };

    const handleShare = async () => {
        try {
            await Linking.openURL('https://culinora.net');
        } catch (error) {
            showAlert('Hata', 'Bağlantı açılamadı.', [{ text: 'Tamam' }], 'error');
        }
    };

    const getRoleName = (role) => {
        switch (role) {
            case 'ADMIN': return 'Yönetici';
            case 'INSTRUCTOR': return 'Eğitmen';
            default: return 'Öğrenci';
        }
    };

    const getPlanName = (plan) => {
        if (plan && plan !== 'FREE') return 'Premium Üyelik';
        return 'Ücretsiz Üyelik';
    };

    // Reusable components
    const MenuItem = ({ icon: Icon, title, onPress, subtitle, rightText, danger = false }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuIconContainer, danger && styles.menuIconDanger]}>
                <Icon size={20} color={danger ? '#ef4444' : '#9ca3af'} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, danger && { color: '#ef4444' }]}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            {rightText ? (
                <Text style={styles.rightText}>{rightText}</Text>
            ) : (
                <ChevronRight size={18} color="#4b5563" />
            )}
        </TouchableOpacity>
    );

    const SwitchItem = ({ icon: Icon, title, value, onValueChange }) => (
        <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
                <Icon size={20} color="#9ca3af" />
            </View>
            <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{title}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#374151', true: 'rgba(234, 88, 12, 0.5)' }}
                thumbColor={value ? '#ea580c' : '#9ca3af'}
            />
        </View>
    );

    const InfoRow = ({ label, value }) => (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );

    // Guest UI - Login/Register screen
    if (isInitLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    if (!isLoggedIn) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                {/* Background image same as login */}
                <AuthBackground />

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.guestScrollContent}>
                    {/* Logo - same as login screen */}
                    <View style={styles.guestHero}>
                        <Logo size="xl" style={{ marginBottom: 15 }} />
                        <Text style={styles.guestSubtitle}>Giriş yaparak tüm özelliklere erişin</Text>
                    </View>

                    {/* Features */}
                    <View style={styles.guestFeatures}>
                        <View style={styles.guestFeatureItem}>
                            <View style={styles.guestFeatureDot} />
                            <Text style={styles.guestFeatureText}>Kursları izleyin ve ilerlemenizi takip edin</Text>
                        </View>
                        <View style={styles.guestFeatureItem}>
                            <View style={styles.guestFeatureDot} />
                            <Text style={styles.guestFeatureText}>Chef AI ile kişisel mutfak asistanınızı kullanın</Text>
                        </View>
                        <View style={styles.guestFeatureItem}>
                            <View style={styles.guestFeatureDot} />
                            <Text style={styles.guestFeatureText}>Sosyal alanda tarif ve deneyimlerinizi paylaşın</Text>
                        </View>
                        <View style={styles.guestFeatureItem}>
                            <View style={styles.guestFeatureDot} />
                            <Text style={styles.guestFeatureText}>Şeflerle doğrudan iletişim kurun</Text>
                        </View>
                    </View>

                    {/* Buttons */}
                    <View style={styles.guestButtons}>
                        <TouchableOpacity
                            style={styles.guestLoginButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <LinearGradient
                                colors={['#ea580c', '#c2410c']}
                                style={styles.guestLoginGradient}
                            >
                                <Text style={styles.guestLoginText}>Giriş Yap</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.guestRegisterButton}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.guestRegisterText}>Hesap Oluştur</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.guestFooter}>
                        Giriş yaparak kullanım koşullarını ve gizlilik politikasını kabul etmiş olursunuz.
                    </Text>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Hesabım</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {userData?.image ? (
                            <Image
                                source={{ uri: userData.image }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.avatarInitials}>
                                {userData?.name
                                    ? userData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                    : 'U'}
                            </Text>
                        )}
                    </View>
                    <Text style={styles.profileName}>{userData?.name || 'Kullanıcı'}</Text>
                    <Text style={styles.profileEmail}>{userData?.email || 'email@example.com'}</Text>
                </View>

                {/* Hesap Ayarları */}
                <View style={styles.section}>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon={User}
                            title="Hesabımı Düzenle"
                            onPress={() => navigation.navigate('EditProfile')}
                        />
                        <MenuItem
                            icon={Lock}
                            title="Şifremi Değiştir"
                            onPress={() => navigation.navigate('ChangePassword')}
                        />
                    </View>
                </View>

                {/* Abonelik */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Abonelik</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon={Crown}
                            title="Abonelik Ayarları"
                            subtitle={userData?.subscriptionPlan && userData.subscriptionPlan !== 'FREE' ? 'Premium Üyelik Aktif' : 'Ücretsiz Üyelik'}
                            onPress={() => navigation.navigate('Subscription')}
                        />
                    </View>
                </View>




                {/* Genel */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Genel</Text>
                    <View style={styles.sectionContent}>
                        <SwitchItem
                            icon={Bell}
                            title="Bildirimler"
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                        />
                        <MenuItem
                            icon={Globe}
                            title="Dil Seçeneği"
                            rightText={currentLanguage === 'tr' ? 'Türkçe' : 'English'}
                            onPress={() => setShowLanguageModal(true)}
                        />
                        <MenuItem
                            icon={Shield}
                            title="Gizlilik ve Güvenlik"
                            onPress={() => setShowPrivacyModal(true)}
                        />
                    </View>
                </View>

                {/* Yardım ve Destek */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Yardım ve Destek</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon={Star}
                            title="Uygulamayı Değerlendir"
                            onPress={() => {
                                const pkg = 'com.chef2.app';
                                const itunesItemId = '6478952516'; // TODO: iOS App ID'nizi buraya yazın
                                
                                if (Platform.OS === 'ios') {
                                    Linking.openURL(`itms-apps://itunes.apple.com/app/id${itunesItemId}?action=write-review`);
                                } else {
                                    Linking.openURL(`market://details?id=${pkg}`);
                                }
                            }}
                        />
                        <MenuItem
                            icon={HelpCircle}
                            title="Yardım Merkezi"
                            onPress={handleHelp}
                        />
                        <MenuItem
                            icon={AlertCircle}
                            title="Sorun Bildir"
                            onPress={() => Linking.openURL('mailto:info@culinora.net?subject=Sorun%20Bildirimi%20-%20Culinora%20Mobile')}
                        />
                        <MenuItem
                            icon={Info}
                            title="Hakkında"
                            subtitle="Sürüm 1.0.2"
                            onPress={() => showAlert('Hakkında', 'Culinora Mobile v1.0.2\n\nGeliştirici: Culinora Team\n© 2024 Tüm hakları saklıdır.', [{ text: 'Tamam' }])}
                        />
                    </View>
                </View>

                {/* İletişim & Admin (conditional) */}
                {(userData?.role === 'INSTRUCTOR' || userData?.role === 'ADMIN') && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Yönetim</Text>
                        <View style={styles.sectionContent}>
                            {userData?.role === 'INSTRUCTOR' && (
                                <MenuItem
                                    icon={MessageSquare}
                                    title="Öğrencilerden Sorular"
                                    onPress={() => navigation.navigate('ChefSor')}
                                />
                            )}
                            {userData?.role === 'ADMIN' && (
                                <>
                                    <MenuItem
                                        icon={User}
                                        title="Admin Paneli"
                                        onPress={() => showAlert('Bilgi', 'Admin paneli sadece web sürümünde mevcuttur.', [{ text: 'Tamam' }], 'info')}
                                    />
                                    <MenuItem
                                        icon={Play}
                                        title="Kurs Yönetimi"
                                        onPress={() => showAlert('Bilgi', 'Kurs yönetimi sadece web sürümünde mevcuttur.', [{ text: 'Tamam' }], 'info')}
                                    />
                                </>
                            )}
                        </View>
                    </View>
                )}

                {/* Danger zone */}
                <View style={styles.section}>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon={LogOut}
                            title="Çıkış Yap"
                            danger={true}
                            onPress={handleLogout}
                        />
                    </View>
                </View>
                <View style={[styles.section, { marginTop: 0 }]}>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon={Trash2}
                            title="Hesabımı Sil"
                            subtitle="Tüm verileriniz kalıcı olarak silinir"
                            danger={true}
                            onPress={handleDeleteAccount}
                        />
                    </View>
                </View>

                <Text style={styles.versionText}>Culinora Mobile v1.0.2</Text>
            </ScrollView>

            {/* Language Selection Modal */}
            {showLanguageModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Dil Seçin</Text>
                        <TouchableOpacity
                            style={[styles.modalOption, currentLanguage === 'tr' && styles.modalOptionSelected]}
                            onPress={() => { setCurrentLanguage('tr'); setShowLanguageModal(false); }}
                        >
                            <Text style={[styles.modalOptionText, currentLanguage === 'tr' && styles.modalOptionTextSelected]}>Türkçe (TR)</Text>
                            {currentLanguage === 'tr' && <Shield size={16} color="#ea580c" />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowLanguageModal(false)}>
                            <Text style={styles.modalCloseText}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Privacy Policy Modal */}
            {showPrivacyModal && (
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
                    <View style={[styles.modalContent, { width: '100%', height: '80%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Gizlilik Politikası</Text>
                            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                                <Text style={styles.modalCloseText}>Kapat</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ flex: 1 }}>
                            <Text style={styles.policyText}>
                                <Text style={styles.policyHeader}>1. Veri Toplama{'\n'}</Text>
                                Uygulamamızı kullanırken, adınız, e-posta adresiniz gibi kişisel bilgilerinizi toplayabiliriz. Bu bilgiler, size daha iyi bir hizmet sunmak için kullanılır.{'\n\n'}
                                <Text style={styles.policyHeader}>2. Kullanım{'\n'}</Text>
                                Topladığımız bilgiler, hesabınızı yönetmek, size bildirim göndermek ve deneyiminizi kişiselleştirmek için kullanılır.{'\n\n'}
                                <Text style={styles.policyHeader}>3. Güvenlik{'\n'}</Text>
                                Verileriniz bizim için önemlidir. Endüstri standardı güvenlik önlemleri ile korunmaktadır.{'\n\n'}
                                <Text style={styles.policyHeader}>4. Üçüncü Taraflar{'\n'}</Text>
                                Bilgileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz.{'\n\n'}
                                Daha fazla bilgi için web sitemizi ziyaret edebilirsiniz.
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            )}

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    // Profile Header
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#1f2937',
    },
    avatarImage: {
        width: 74,
        height: 74,
        borderRadius: 37,
    },
    avatarInitials: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
    },
    profileName: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    profileEmail: {
        color: '#9ca3af',
        fontSize: 14,
    },
    // Sections
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        color: '#6b7280',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionContent: {
        backgroundColor: '#111',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    // Menu items
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
        backgroundColor: '#111',
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuIconDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
    },
    menuSubtitle: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 2,
    },
    rightText: {
        color: '#6b7280',
        fontSize: 13,
        marginRight: 4,
    },
    // Subscription info box
    subscriptionInfo: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    subscriptionStatus: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 6,
    },
    subscriptionDesc: {
        color: '#6b7280',
        fontSize: 13,
        lineHeight: 18,
    },
    // Version
    versionText: {
        color: '#4b5563',
        textAlign: 'center',
        fontSize: 12,
        marginTop: 30,
        marginBottom: 20,
    },
    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1f2937',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    modalOptionSelected: {
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        paddingHorizontal: 12,
        borderRadius: 8,
        borderBottomWidth: 0,
    },
    modalOptionText: {
        fontSize: 16,
        color: '#d1d5db',
    },
    modalOptionTextSelected: {
        color: '#ea580c',
        fontWeight: 'bold',
    },
    modalCloseButton: {
        marginTop: 20,
        padding: 12,
        alignItems: 'center',
        backgroundColor: '#374151',
        borderRadius: 12,
    },
    modalCloseText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    policyText: {
        color: '#d1d5db',
        lineHeight: 24,
        fontSize: 14,
    },
    policyHeader: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 8,
    },
    // Guest screen styles
    guestScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: 120,
        paddingHorizontal: 20,
    },
    guestHero: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 32,
    },
    guestSubtitle: {
        fontSize: 16,
        color: '#d1d5db',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
        marginTop: 8,
        fontWeight: '500',
    },
    guestFeatures: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    guestFeatureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    guestFeatureDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ea580c',
        marginRight: 14,
    },
    guestFeatureText: {
        fontSize: 14,
        color: '#d1d5db',
        flex: 1,
        lineHeight: 20,
    },
    guestButtons: {
        gap: 12,
        marginBottom: 24,
    },
    guestLoginButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    guestLoginGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    guestLoginText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    guestRegisterButton: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(234, 88, 12, 0.4)',
        backgroundColor: 'rgba(234, 88, 12, 0.08)',
    },
    guestRegisterText: {
        color: '#ea580c',
        fontSize: 17,
        fontWeight: 'bold',
    },
    guestFooter: {
        color: '#4b5563',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 20,
    },
});
