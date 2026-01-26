import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Switch,
    StatusBar,
    SafeAreaView,
    Platform
} from 'react-native';
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
    Shield
} from 'lucide-react-native';
import authService from '../api/authService';
import CustomAlert from '../components/CustomAlert';

export default function SettingsScreen({ navigation }) {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [currentLanguage, setCurrentLanguage] = useState('tr');

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
                            routes: [{ name: 'Login' }],
                        });
                    }
                }
            ],
            'confirm'
        );
    };

    const handleHelp = () => {
        showAlert(
            'Yardım Merkezi',
            'Destek için bize e-posta gönderebilirsiniz:\n\nsupport@culinora.com',
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
                <Icon size={20} color={danger ? '#ef4444' : '#9ca3af'} />
            </View>
            <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, danger && styles.itemTextDanger]}>{title}</Text>
                {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
            </View>

            {type === 'switch' ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#374151', true: 'rgba(234, 88, 12, 0.5)' }}
                    thumbColor={value ? '#ea580c' : '#9ca3af'}
                />
            ) : showChevron && (
                <ChevronRight size={18} color="#4b5563" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft size={24} color="#e5e5e5" />
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
                            onPress={() => showAlert('Bilgi', 'Şifre değiştirme web sitesi üzerinden yapılmaktadır.', [{ text: 'Tamam' }], 'info')}
                        />
                        <SettingItem
                            icon={Shield}
                            title="Gizlilik ve Güvenlik"
                            onPress={() => setShowPrivacyModal(true)}
                        />
                    </SettingSection>

                    <SettingSection title="Uygulama Ayarları">
                        <SettingItem
                            icon={Bell}
                            title="Bildirimler"
                            type="switch"
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
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

                    <View style={[styles.section, styles.dangerSection]}>
                        <SettingItem
                            icon={LogOut}
                            title="Çıkış Yap"
                            danger={true}
                            onPress={handleLogout}
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
                            {currentLanguage === 'tr' && <Shield size={16} color="#ea580c" />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalOption, currentLanguage === 'en' && styles.modalOptionSelected]}
                            onPress={() => { setCurrentLanguage('en'); setShowLanguageModal(false); }}
                        >
                            <Text style={[styles.modalOptionText, currentLanguage === 'en' && styles.modalOptionTextSelected]}>English (EN)</Text>
                            {currentLanguage === 'en' && <Shield size={16} color="#ea580c" />}
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
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#6b7280',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
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
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
        backgroundColor: '#111',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconContainerDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
    },
    itemTextDanger: {
        color: '#ef4444',
    },
    itemSubtitle: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 2,
    },
    dangerSection: {
        marginTop: 12,
    },
    versionText: {
        color: '#4b5563',
        textAlign: 'center',
        fontSize: 12,
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
});
