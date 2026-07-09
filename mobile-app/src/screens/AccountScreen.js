import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import authService from '../api/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthBackground from '../components/AuthBackground';
import Logo from '../components/Logo';
import { LinearGradient } from 'expo-linear-gradient';
import ChefSocialProfileScreen from './ChefSocialProfileScreen';

export default function AccountScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInitLoading, setIsInitLoading] = useState(true);

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
        if (token) {
            const user = await authService.getCurrentUser();
            setUserData(user);
        } else {
            setUserData(null);
        }
        setIsInitLoading(false);
    };

    if (isInitLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    if (!isLoggedIn) {
        return (
            <ScreenContainer style={styles.container} edges={['top']}>
                <AuthBackground />

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.guestScrollContent}>
                    <View style={styles.guestHero}>
                        <Logo size="xl" style={{ marginBottom: 15 }} />
                        <Text style={styles.guestSubtitle}>Giriş yaparak tüm özelliklere erişin</Text>
                    </View>

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

                    <View style={styles.guestButtons}>
                        <TouchableOpacity 
                            style={styles.guestLoginButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <LinearGradient
                                colors={['#f97316', '#ea580c']}
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
                        Devam ederek Kullanım Koşulları ve Gizlilik Politikası'nı kabul etmiş olursunuz.
                    </Text>
                </ScrollView>
            </ScreenContainer>
        );
    }

    if (!userData?.id) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    return (
        <ChefSocialProfileScreen
            navigation={navigation}
            route={{ params: { userId: userData.id } }}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
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
