import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image, Platform } from 'react-native';
import { User, Settings, LogOut, BookOpen, Heart, MessageCircle, ChevronRight, Award, Play, MessageSquare, Shield } from 'lucide-react-native';
import authService from '../api/authService';
import CustomAlert from '../components/CustomAlert';

export default function AccountScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
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
        return unsubscribe;
    }, [navigation]);

    const loadUserData = async () => {
        const user = await authService.getCurrentUser();
        setUserData(user);
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

    const getRoleName = (role) => {
        switch (role) {
            case 'ADMIN': return 'Yönetici';
            case 'INSTRUCTOR': return 'Eğitmen';
            default: return 'Öğrenci';
        }
    };

    const getPlanName = (plan) => {
        switch (plan) {
            case 'Commis': return 'Commis';
            case 'Chef D party': return 'Chef de Partie';
            case 'Executive': return 'Executive Chef';
            default: return 'Ücretsiz Üyelik';
        }
    };

    const MenuItem = ({ icon: Icon, title, onPress, subtitle }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIconContainer}>
                <Icon size={20} color="#9ca3af" />
            </View>
            <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <ChevronRight size={18} color="#4b5563" />
        </TouchableOpacity>
    );

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
                        <Text style={styles.avatarEmoji}>👨‍🍳</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{userData?.name || 'Kullanıcı'}</Text>
                        <Text style={styles.profileEmail}>{userData?.email || 'email@example.com'}</Text>
                        <View style={styles.roleContainer}>
                            <Text style={styles.roleText}>
                                {userData?.role === 'INSTRUCTOR' || userData?.role === 'ADMIN'
                                    ? getRoleName(userData?.role)
                                    : getPlanName(userData?.subscriptionPlan)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Statistics / Quick Stats (Optional placeholder for future) */}
                {/* <View style={styles.statsContainer}> ... </View> */}

                {/* Membership Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Üyelik Planı</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon={Award}
                            title="Abonelik Bilgileri"
                            subtitle="Paket durumu ve ödeme"
                            onPress={() => navigation.navigate('Subscription')}
                        />
                    </View>
                </View>

                {/* Menu Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>İçeriklerim</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon={BookOpen}
                            title="Kurslarım"
                            subtitle="Kayıtlı olduğunuz kurslar"
                            onPress={() => navigation.navigate('Courses')}
                        />
                        <MenuItem
                            icon={Heart}
                            title="Favorilerim"
                            subtitle="Beğendiğiniz içerikler"
                            onPress={() => showAlert('Yakında', 'Favorilerim özelliği yakında gelecek!', [{ text: 'Tamam' }], 'info')}
                        />
                        <MenuItem
                            icon={Award}
                            title="Sertifikalarım"
                            subtitle="Tamamlanan eğitimler"
                            onPress={() => showAlert('Yakında', 'Sertifikalarım özelliği yakında gelecek!', [{ text: 'Tamam' }], 'info')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>İletişim & Destek</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon={MessageCircle}
                            title="Chef'e Sor"
                            subtitle="Eğitmenlerle iletişime geçin"
                            onPress={() => navigation.navigate('ChefSor')}
                        />
                        {userData?.role === 'INSTRUCTOR' && (
                            <MenuItem
                                icon={MessageSquare}
                                title="Öğrencilerden Sorular"
                                subtitle="Gelen soruları yanıtlayın"
                                onPress={() => navigation.navigate('ChefSor')}
                            />
                        )}
                    </View>
                </View>

                {userData?.role === 'ADMIN' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Yönetim</Text>
                        <View style={styles.sectionContent}>
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
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Uygulama</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon={Settings}
                            title="Ayarlar"
                            subtitle="Uygulama ve hesap ayarları"
                            onPress={() => navigation.navigate('Settings')}
                        />
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <LogOut size={20} color="#ef4444" />
                            <Text style={styles.logoutText}>Çıkış Yap</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.versionText}>GastroFolly Mobile v1.0.2</Text>
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
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        backgroundColor: '#000',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#1f2937',
    },
    avatarEmoji: {
        fontSize: 40,
    },
    profileInfo: {
        marginLeft: 20,
        flex: 1,
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
        marginBottom: 10,
    },
    roleContainer: {
        backgroundColor: 'rgba(234, 88, 12, 0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleText: {
        color: '#ea580c',
        fontSize: 12,
        fontWeight: 'bold',
    },
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
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        justifyContent: 'center',
        gap: 8,
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '600',
    },
    versionText: {
        color: '#4b5563',
        textAlign: 'center',
        fontSize: 12,
        marginTop: 30,
        marginBottom: 20,
    },
});
