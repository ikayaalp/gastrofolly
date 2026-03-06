import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Platform,
    ActivityIndicator
} from 'react-native';
import { ArrowLeft, Award, Calendar, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import certificateService from '../api/certificateService';

export default function CertificatesScreen({ navigation }) {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadCertificates = useCallback(async () => {
        setLoading(true);
        const result = await certificateService.getCertificates();
        if (result.success) {
            setCertificates(result.certificates);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadCertificates();
    }, [loadCertificates]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderCertificateItem = ({ item }) => (
        <LinearGradient
            colors={['rgba(234, 88, 12, 0.15)', 'rgba(194, 65, 12, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.certCard}
        >
            <View style={styles.certIconContainer}>
                <Award size={40} color="#ea580c" />
            </View>
            <Text style={styles.certCourseName} numberOfLines={2}>{item.courseName}</Text>

            <View style={styles.certDetails}>
                <View style={styles.certDetailRow}>
                    <Calendar size={14} color="#9ca3af" />
                    <Text style={styles.certDetailText}>{formatDate(item.issuedAt)}</Text>
                </View>
                <View style={styles.certDetailRow}>
                    <BookOpen size={14} color="#9ca3af" />
                    <Text style={styles.certDetailText}>Eğitmen: {item.instructorName}</Text>
                </View>
            </View>

            <View style={styles.certBadge}>
                <Text style={styles.certBadgeText}>Başarı Sertifikası</Text>
            </View>

            <Text style={styles.certId}>
                Sertifika No: {item.id.slice(0, 8).toUpperCase()}
            </Text>
        </LinearGradient>
    );

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <Award size={64} color="#374151" />
            <Text style={styles.emptyTitle}>Henüz Sertifikanız Yok</Text>
            <Text style={styles.emptySubtitle}>
                Bir kursu tamamladığınızda otomatik olarak sertifikanız oluşturulacak
            </Text>
            <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Home')}
            >
                <BookOpen size={18} color="white" />
                <Text style={styles.exploreButtonText}>Kursları Keşfet</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color="#e5e5e5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sertifikalarım</Text>
                <View style={{ width: 24 }} />
            </View>

            {certificates.length > 0 ? (
                <FlatList
                    data={certificates}
                    renderItem={renderCertificateItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <EmptyState />
            )}
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
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
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
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    certCard: {
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(234, 88, 12, 0.3)',
        alignItems: 'center',
    },
    certIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(234, 88, 12, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    certCourseName: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    certDetails: {
        gap: 8,
        marginBottom: 16,
    },
    certDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    certDetailText: {
        color: '#9ca3af',
        fontSize: 13,
    },
    certBadge: {
        backgroundColor: 'rgba(234, 88, 12, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(234, 88, 12, 0.4)',
        marginBottom: 12,
    },
    certBadgeText: {
        color: '#ea580c',
        fontSize: 12,
        fontWeight: 'bold',
    },
    certId: {
        color: '#4b5563',
        fontSize: 11,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    exploreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ea580c',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    exploreButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
});
