import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Switch,
    StatusBar,
    Alert,
    SafeAreaView
} from 'react-native';
import {
    ArrowLeft,
    User,
    Bell,
    Moon,
    Lock,
    HelpCircle,
    Info,
    LogOut,
    ChevronRight,
    Globe,
    Shield
} from 'lucide-react-native';
import authService from '../api/authService';

export default function SettingsScreen({ navigation }) {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(true);

    const handleLogout = async () => {
        Alert.alert(
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
            ]
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
                            onPress={() => Alert.alert('Bilgi', 'Şifre değiştirme web sitesi üzerinden yapılmaktadır.')}
                        />
                        <SettingItem
                            icon={Shield}
                            title="Gizlilik ve Güvenlik"
                            onPress={() => { }}
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
                            icon={Moon}
                            title="Karanlık Mod"
                            type="switch"
                            value={darkModeEnabled}
                            onValueChange={setDarkModeEnabled}
                        />
                        <SettingItem
                            icon={Globe}
                            title="Dil Seçeneği"
                            subtitle="Türkçe (TR)"
                            onPress={() => { }}
                        />
                    </SettingSection>

                    <SettingSection title="Destek">
                        <SettingItem
                            icon={HelpCircle}
                            title="Yardım Merkezi"
                            onPress={() => { }}
                        />
                        <SettingItem
                            icon={Info}
                            title="Hakkında"
                            subtitle="Sürüm 1.0.2"
                            onPress={() => { }}
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

                    <Text style={styles.versionText}>GastroFolly Mobile v1.0.2</Text>

                </ScrollView>
            </View>
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
        paddingVertical: 16,
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
});
