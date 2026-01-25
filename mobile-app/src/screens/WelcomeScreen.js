import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChefHat, Play, Star, Users, Crown, BookOpen, Zap, ArrowRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <ChefHat size={32} color="#ea580c" />
                    <Text style={styles.headerTitle}>Culinora</Text>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>
                        Gastronomi Dünyasına
                    </Text>
                    <Text style={styles.heroTitleOrange}>Yolculuk</Text>
                    <Text style={styles.heroSubtitle}>
                        Profesyonel şeflerden öğren, mutfakta ustalaş.{'\n'}
                        Video dersler, uygulamalı projeler ve sertifikalar ile gastronomi kariyerine başla.
                    </Text>

                    {/* Buttons */}
                    <View style={styles.heroButtons}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.primaryButtonText}>Hemen Başla</Text>
                            <ArrowRight size={20} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton}>
                            <Play size={20} color="#9ca3af" />
                            <Text style={styles.secondaryButtonText}>Tanıtım Videosu</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Subscription Plans Banner */}
                <LinearGradient
                    colors={['rgba(234, 88, 12, 0.1)', 'rgba(0, 0, 0, 0.8)', 'rgba(147, 51, 234, 0.1)']}
                    style={styles.plansSection}
                >
                    <Text style={styles.plansSectionTitle}>Tüm Kurslara</Text>
                    <Text style={styles.plansSectionTitleGradient}>Sınırsız Erişim!</Text>
                    <Text style={styles.plansSectionSubtitle}>
                        Size en uygun paketi seçin ve gastronomi dünyasında ustalaşın
                    </Text>

                    {/* Plans */}
                    {/* Premium Plan Only */}
                    <View style={styles.plansGrid}>
                        <View style={[styles.planCard, styles.planCardOrange, styles.planCardPopular, { width: '100%' }]}>
                            <View style={[styles.planIcon, styles.planIconOrange]}>
                                <Crown size={32} color="#fff" />
                            </View>
                            <Text style={styles.planName}>PREMIUM</Text>
                            <Text style={styles.planPrice}>299₺</Text>
                            <Text style={styles.planPeriod}>/ Aylık</Text>
                            <Text style={{ color: '#d1d5db', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                                Tüm kurslara ve sertifikalara sınırsız erişim
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.viewPlansButton}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.viewPlansButtonText}>Tüm Paketleri İncele</Text>
                        <ArrowRight size={18} color="#fff" />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Stats Section */}
                <View style={styles.statsSection}>
                    <View style={styles.statItem}>
                        <View style={styles.statIcon}>
                            <Users size={24} color="#ea580c" />
                        </View>
                        <Text style={styles.statNumber}>10,000+</Text>
                        <Text style={styles.statLabel}>Mutlu Öğrenci</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={styles.statIcon}>
                            <Play size={24} color="#ea580c" />
                        </View>
                        <Text style={styles.statNumber}>50+</Text>
                        <Text style={styles.statLabel}>Video Kurs</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={styles.statIcon}>
                            <Star size={24} color="#ea580c" />
                        </View>
                        <Text style={styles.statNumber}>4.9</Text>
                        <Text style={styles.statLabel}>Ortalama Puan</Text>
                    </View>
                </View>

                {/* Login Link */}
                <View style={styles.loginSection}>
                    <Text style={styles.loginText}>Zaten hesabınız var mı?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Giriş Yap</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        gap: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    heroSection: {
        paddingHorizontal: 24,
        paddingVertical: 40,
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    heroTitleOrange: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ea580c',
        textAlign: 'center',
        marginBottom: 16,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    heroButtons: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: '#374151',
    },
    secondaryButtonText: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '600',
    },
    plansSection: {
        paddingVertical: 40,
        paddingHorizontal: 16,
        marginTop: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(234, 88, 12, 0.2)',
    },
    plansSectionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    plansSectionTitleGradient: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ea580c',
        textAlign: 'center',
        marginBottom: 12,
    },
    plansSectionSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 24,
    },
    plansGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 24,
    },
    planCard: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
    },
    planCardGray: {
        borderColor: 'rgba(107, 114, 128, 0.5)',
    },
    planCardOrange: {
        borderColor: 'rgba(234, 88, 12, 0.5)',
    },
    planCardPurple: {
        borderColor: 'rgba(147, 51, 234, 0.5)',
    },
    planCardPopular: {
        transform: [{ scale: 1.05 }],
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        backgroundColor: '#ea580c',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    popularBadgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    planIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6b7280',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 8,
    },
    planIconOrange: {
        backgroundColor: '#ea580c',
    },
    planIconPurple: {
        backgroundColor: '#9333ea',
    },
    planName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    planPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    planPeriod: {
        fontSize: 10,
        color: '#9ca3af',
    },
    viewPlansButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        alignSelf: 'center',
    },
    viewPlansButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 40,
        paddingHorizontal: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(234, 88, 12, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#9ca3af',
    },
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
    },
    loginText: {
        color: '#9ca3af',
        fontSize: 14,
    },
    loginLink: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: 'bold',
    },

});
