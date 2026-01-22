import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, User, Mail, CreditCard, Calendar, Award, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../api/authService';

export default function ProfileScreen({ navigation }) {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        // First load from local storage for speed
        const localUser = await authService.getCurrentUser();
        if (localUser) {
            setUserData(localUser);
        }

        // Then fetch fresh data from server
        const freshUser = await authService.refreshUserData();
        if (freshUser) {
            setUserData(freshUser);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Çıkış Yap",
            "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Çıkış Yap",
                    style: "destructive",
                    onPress: async () => {
                        await authService.logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Welcome' }],
                        });
                    }
                }
            ]
        );
    };

    const getPlanName = (plan) => {
        if (plan && plan !== 'FREE') return 'Premium Üyelik';
        return 'Ücretsiz Üyelik';
    };

    const getPlanColor = (plan) => {
        if (plan && plan !== 'FREE') {
            return ['#ea580c', '#c2410c']; // Orange (Premium)
        }
        return ['#374151', '#1f2937']; // Dark Gray (Free)
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!userData) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profilim</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {userData.image ? (
                            <Image source={{ uri: userData.image }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {userData.name?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.editIconContainer}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <User size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{userData.name}</Text>
                    <Text style={styles.userEmail}>{userData.email}</Text>
                </View>

                {/* Subscription Card */}
                <Text style={styles.sectionTitle}>Abonelik Durumu</Text>
                <LinearGradient
                    colors={getPlanColor(userData.subscriptionPlan)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.subscriptionCard}
                >
                    <View style={styles.subscriptionHeader}>
                        <View style={styles.planIcon}>
                            <Award size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.planLabel}>Mevcut Plan</Text>
                            <Text style={styles.planName}>{getPlanName(userData.subscriptionPlan)}</Text>
                        </View>
                    </View>

                    {userData.subscriptionEndDate && (
                        <View style={styles.subscriptionDate}>
                            <Calendar size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.dateText}>
                                Bitiş: {formatDate(userData.subscriptionEndDate)}
                            </Text>
                        </View>
                    )}
                </LinearGradient>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconBox}>
                            <User size={20} color="#9ca3af" />
                        </View>
                        <Text style={styles.menuText}>Hesap Ayarları</Text>
                        <ChevronRight size={20} color="#4b5563" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconBox}>
                            <CreditCard size={20} color="#9ca3af" />
                        </View>
                        <Text style={styles.menuText}>Ödeme Yöntemleri</Text>
                        <ChevronRight size={20} color="#4b5563" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    headerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    loadingText: {
        color: 'white',
        alignSelf: 'center',
        marginTop: 50,
    },

    // Profile Header
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#ea580c',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ea580c',
    },
    avatarText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#ea580c',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#000',
    },
    userName: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userEmail: {
        color: '#9ca3af',
        fontSize: 14,
    },

    // Subscription Card
    sectionTitle: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    subscriptionCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
    },
    subscriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 16,
    },
    planIcon: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    planLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginBottom: 2,
    },
    planName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    subscriptionDate: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 8,
    },
    dateText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
    },

    // Menu
    menuContainer: {
        backgroundColor: '#0a0a0a',
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    menuIconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        flex: 1,
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
    },

    // Logout
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        gap: 8,
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '600',
    },
});
