import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Platform,
    Linking,
    Switch,
    ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/ScreenContainer';
import {
    ArrowLeft,
    User,
    Bell,
    Lock,
    HelpCircle,
    Info,
    LogOut,
    ChevronRight,
    Globe,
    Shield,
    Trash2,
    Star,
    Crown,
    AlertCircle,
    Play
} from 'lucide-react-native';
import authService from '../api/authService';
import notificationService from '../api/notificationService';
import api from '../api/apiClient';
import { getToken } from '../utils/tokenStorage';
import CustomAlert from '../components/CustomAlert';
import { colors, spacing, radius, typography } from '../constants/theme';

export default function SettingsScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [currentLanguage, setCurrentLanguage] = useState('tr');

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadUserData();
        });
        loadUserData();
        return unsubscribe;
    }, [navigation]);

    const loadUserData = async () => {
        const user = await authService.getCurrentUser();
        setUserData(user);

        try {
            const savedNotificationState = await AsyncStorage.getItem('@notifications_enabled');
            if (savedNotificationState !== null) {
                setNotificationsEnabled(savedNotificationState === 'true');
            }
        } catch (error) {
            console.log('Error loading notification setting:', error);
        }
    };

    const handleNotificationToggle = async (value) => {
        setNotificationsEnabled(value);
        try {
            await AsyncStorage.setItem('@notifications_enabled', String(value));
            
            if (value) {
                // Bildirimleri aç: Expo token'ı alıp veritabanına kaydeder
                await notificationService.registerForPushNotifications();
            } else {
                // Bildirimleri kapat: Backend'deki token'ı silerek bildirim gelmesini engeller
                const authToken = await getToken();
                if (authToken) {
                    await api.delete('/api/user/push-token', {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                }
            }
        } catch (error) {
            console.log('Error saving notification setting:', error);
            // Revert state if failed
            setNotificationsEnabled(!value);
            showAlert('Hata', 'Bildirim ayarı güncellenemedi.', [{ text: 'Tamam' }], 'error');
        }
    };

    // Modals
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    // Alerts
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
                            routes: [{ name: 'Onboarding' }],
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

    const SettingSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    const SettingItem = ({ icon: Icon, title, subtitle, onPress, showChevron = true, type = 'link', value, onValueChange, danger = false }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={type === 'link' ? onPress : undefined}
            activeOpacity={type === 'link' ? 0.7 : 1}
            disabled={type === 'switch'}
        >
            <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
                <Icon size={20} color={danger ? colors.danger : colors.textMuted} />
            </View>
            <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, danger && styles.itemTextDanger]}>{title}</Text>
                {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
            </View>

            {type === 'switch' ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: colors.borderLight, true: colors.primaryMuted }}
                    thumbColor={value ? colors.primary : colors.textMuted}
                />
            ) : showChevron && (
                <ChevronRight size={18} color={colors.textDisabled} />
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenContainer style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ayarlar</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

                    <SettingSection title="Hesap">
                        <SettingItem
                            icon={User}
                            title="Profil Düzenle"
                            subtitle="Ad, soyad ve avatar düzenle"
                            onPress={() => navigation.navigate('EditProfile')}
                        />
                        <SettingItem
                            icon={Lock}
                            title="Şifre Değiştir"
                            onPress={() => navigation.navigate('ChangePassword')}
                        />
                        <SettingItem
                            icon={Shield}
                            title="Gizlilik ve Güvenlik"
                            onPress={() => setShowPrivacyModal(true)}
                        />
                    </SettingSection>

                    <SettingSection title="Abonelik">
                        <SettingItem
                            icon={Crown}
                            title="Abonelik Ayarları"
                            subtitle={userData?.subscriptionPlan && userData.subscriptionPlan !== 'FREE' ? 'Premium Üyelik Aktif' : 'Ücretsiz Üyelik'}
                            onPress={() => navigation.navigate('Subscription')}
                        />
                    </SettingSection>

                    <SettingSection title="Uygulama Ayarları">
                        <SettingItem
                            icon={Bell}
                            title="Bildirimler"
                            type="switch"
                            value={notificationsEnabled}
                            onValueChange={handleNotificationToggle}
                        />
                        <SettingItem
                            icon={Globe}
                            title="Dil Seçeneği"
                            subtitle={currentLanguage === 'tr' ? "Türkçe (TR)" : "English (EN)"}
                            onPress={() => setShowLanguageModal(true)}
                        />
                    </SettingSection>

                    <SettingSection title="Destek">
                        <SettingItem
                            icon={Star}
                            title="Uygulamayı Değerlendir"
                            onPress={() => {
                                const pkg = 'com.chef2.app';
                                const itunesItemId = '6760206517';
                                
                                if (Platform.OS === 'ios') {
                                    Linking.openURL(`itms-apps://itunes.apple.com/app/id${itunesItemId}?action=write-review`);
                                } else {
                                    Linking.openURL(`market://details?id=${pkg}`);
                                }
                            }}
                        />
                        <SettingItem
                            icon={AlertCircle}
                            title="Sorun Bildir"
                            onPress={() => Linking.openURL('mailto:info@culinora.net?subject=Sorun%20Bildirimi%20-%20Culinora%20Mobile')}
                        />
                        <SettingItem
                            icon={HelpCircle}
                            title="Yardım Merkezi"
                            onPress={handleHelp}
                        />
                        <SettingItem
                            icon={Info}
                            title="Hakkında"
                            subtitle="Sürüm 1.0.2"
                            onPress={() => showAlert('Hakkında', 'Culinora Mobile v1.0.2\n\nGeliştirici: Culinora Team\n© 2024 Tüm hakları saklıdır.', [{ text: 'Tamam' }])}
                        />
                    </SettingSection>

                    {(userData?.role === 'INSTRUCTOR' || userData?.role === 'ADMIN') && (
                        <SettingSection title="Yönetim">

                            {userData?.role === 'ADMIN' && (
                                <>
                                    <SettingItem
                                        icon={User}
                                        title="Admin Paneli"
                                        onPress={() => showAlert('Bilgi', 'Admin paneli sadece web sürümünde mevcuttur.', [{ text: 'Tamam' }], 'info')}
                                    />
                                    <SettingItem
                                        icon={Play}
                                        title="Kurs Yönetimi"
                                        onPress={() => showAlert('Bilgi', 'Kurs yönetimi sadece web sürümünde mevcuttur.', [{ text: 'Tamam' }], 'info')}
                                    />
                                </>
                            )}
                        </SettingSection>
                    )}

                    <View style={[styles.section, styles.dangerSection]}>
                        <SettingItem
                            icon={LogOut}
                            title="Çıkış Yap"
                            danger={true}
                            onPress={handleLogout}
                            showChevron={false}
                        />
                    </View>

                    <View style={[styles.section, styles.dangerSection]}>
                        <SettingItem
                            icon={Trash2}
                            title="Hesabımı Sil"
                            subtitle="Hesabınız ve tüm verileriniz kalıcı olarak silinir"
                            danger={true}
                            onPress={handleDeleteAccount}
                            showChevron={false}
                        />
                    </View>

                    <Text style={styles.versionText}>Culinora Mobile v1.0.2</Text>

                </ScrollView>
            </View>

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
                            {currentLanguage === 'tr' && <Shield size={16} color={colors.primary} />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalOption, currentLanguage === 'en' && styles.modalOptionSelected]}
                            onPress={() => { setCurrentLanguage('en'); setShowLanguageModal(false); }}
                        >
                            <Text style={[styles.modalOptionText, currentLanguage === 'en' && styles.modalOptionTextSelected]}>English (EN)</Text>
                            {currentLanguage === 'en' && <Shield size={16} color={colors.primary} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowLanguageModal(false)}>
                            <Text style={styles.modalCloseText}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Privacy Policy Modal - Simple Text Version */}
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
                                <Text style={styles.policyHeader}>1. Veri Sorumlusu{'\n'}</Text>
                                Culinora, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusudur. Sorularınız için info@culinora.net adresinden bize ulaşabilirsiniz.{'\n\n'}
                                <Text style={styles.policyHeader}>2. Toplanan Veriler ve Toplama Yöntemi{'\n'}</Text>
                                Hesap bilgileri (ad, soyad, e-posta, telefon, profil fotoğrafı) kayıt/giriş formları ve Google ile giriş yoluyla; ödeme bilgileri (işlem geçmişi, abonelik durumu — kart bilgileriniz bizde değil Iyzico/Stripe/RevenueCat'te saklanır); kullanım verileri (tamamlanan dersler, ilerleme durumu, forum gönderileri) ve teknik veriler (cihaz modeli, işletim sistemi, IP adresi) uygulamayı kullandığınızda otomatik olarak toplanır.{'\n\n'}
                                <Text style={styles.policyHeader}>3. İşlenme Amaçları{'\n'}</Text>
                                Hesabınızı oluşturmak ve yönetmek, satın aldığınız kursları sunmak, ödeme işlemlerini gerçekleştirmek, bildirim ve e-posta göndermek, uygulamayı geliştirmek, güvenliğini sağlamak ve yasal yükümlülükleri yerine getirmek amacıyla işlenir.{'\n\n'}
                                <Text style={styles.policyHeader}>4. Hukuki Sebep{'\n'}</Text>
                                Verileriniz KVKK madde 5 kapsamında; sözleşmenin kurulması veya ifası için gerekli olması, hukuki yükümlülüğümüzün yerine getirilmesi, meşru menfaatimiz ve gerekli hallerde açık rızanız hukuki sebeplerine dayanılarak işlenir.{'\n\n'}
                                <Text style={styles.policyHeader}>5. Verilerin Aktarıldığı Taraflar{'\n'}</Text>
                                Ödeme işlemleri için Iyzico ve Stripe, medya depolama için Cloudinary, mobil abonelik yönetimi için RevenueCat, e-posta bildirimleri için Resend ile sınırlı ve gerekli ölçüde veri paylaşılır. Verileriniz hiçbir şekilde ticari amaçla satılmaz veya kiralanmaz.{'\n\n'}
                                <Text style={styles.policyHeader}>6. Veri Güvenliği{'\n'}</Text>
                                Şifreniz asla düz metin olarak saklanmaz, geri döndürülemez şekilde şifrelenir (hash'lenir). Tüm veri iletimi SSL/TLS ile korunur ve sunucularımıza yetkisiz erişim engellenir.{'\n\n'}
                                <Text style={styles.policyHeader}>7. Saklama Süresi ve Silme{'\n'}</Text>
                                Verileriniz hesabınız aktif olduğu sürece ve yasal saklama süreleri boyunca tutulur. Ayarlar {'>'} Hesap Bilgileri bölümünden hesabınızı sildiğinizde kişisel verileriniz sistemlerimizden kalıcı olarak silinir.{'\n\n'}
                                <Text style={styles.policyHeader}>8. Haklarınız{'\n'}</Text>
                                KVKK madde 11 kapsamında; verilerinizin işlenip işlenmediğini öğrenme, işlenme amacını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, silinmesini isteme ve işlenmesine itiraz etme haklarına sahipsiniz. Bu hakları kullanmak için info@culinora.net adresine yazabilirsiniz.
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
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSubtle,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        color: colors.text,
        fontSize: typography.size['2xl'],
        fontWeight: typography.weight.bold,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.xl,
        paddingBottom: 40,
    },
    section: {
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        color: colors.textSubtle,
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        marginBottom: spacing.md,
        marginLeft: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionContent: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    iconContainerDanger: {
        backgroundColor: colors.dangerSubtle,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        color: colors.text,
        fontSize: typography.size.lg,
        fontWeight: typography.weight.medium,
    },
    itemTextDanger: {
        color: colors.danger,
    },
    itemSubtitle: {
        color: colors.textSubtle,
        fontSize: typography.size.sm,
        marginTop: 2,
    },
    dangerSection: {
        marginTop: spacing.md,
    },
    versionText: {
        color: colors.textDisabled,
        textAlign: 'center',
        fontSize: typography.size.sm,
        marginBottom: spacing.xl,
    },
    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        backgroundColor: colors.border,
        borderRadius: radius.xxl,
        padding: spacing.xl,
        width: '100%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    modalTitle: {
        fontSize: typography.size['3xl'],
        fontWeight: typography.weight.bold,
        color: colors.text,
        marginBottom: spacing.xl,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    modalOptionSelected: {
        backgroundColor: colors.primarySubtle,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderBottomWidth: 0,
    },
    modalOptionText: {
        fontSize: typography.size.xl,
        color: colors.textTertiary,
    },
    modalOptionTextSelected: {
        color: colors.primary,
        fontWeight: typography.weight.bold,
    },
    modalCloseButton: {
        marginTop: spacing.xl,
        padding: spacing.md,
        alignItems: 'center',
        backgroundColor: colors.borderLight,
        borderRadius: radius.lg,
    },
    modalCloseText: {
        color: colors.text,
        fontWeight: typography.weight.semibold,
        fontSize: typography.size.xl,
    },
    policyText: {
        color: colors.textTertiary,
        lineHeight: 24,
        fontSize: typography.size.base,
    },
    policyHeader: {
        color: colors.text,
        fontWeight: typography.weight.bold,
        fontSize: typography.size.xl,
        marginBottom: spacing.sm,
    },
});
