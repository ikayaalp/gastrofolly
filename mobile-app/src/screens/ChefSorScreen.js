import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    Linking,
    Alert,
} from 'react-native';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import {
    GraduationCap,
    Mail,
    BookOpen,
    User,
} from 'lucide-react-native';
import chefService from '../api/chefService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Copy } from 'lucide-react-native';

export default function ChefSorScreen({ navigation }) {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const checkLoginStatus = async () => {
        const token = await AsyncStorage.getItem('authToken');
        setIsLoggedIn(!!token);
    };

    const loadInstructors = async () => {
        try {
            const result = await chefService.getInstructors();
            if (result.success) {
                setInstructors(result.data.instructors || []);
            }
        } catch (error) {
            console.error('Error loading instructors:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            checkLoginStatus();
            loadInstructors();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadInstructors();
    };

    const handleEmailClick = async (email, name) => {
        const subject = 'Kurs Hakkında Soru';
        const body = `Merhaba ${name || 'Hocam'},\n\n`;

        // Gmail specific scheme
        const gmailUrl = `googlegmail:///co?to=${email}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Standard mailto scheme
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        try {
            // Check if Gmail app is supported
            const canOpenGmail = await Linking.canOpenURL(gmailUrl);

            if (canOpenGmail) {
                await Linking.openURL(gmailUrl);
            } else {
                // Fallback to default mail client
                await Linking.openURL(mailtoUrl);
            }
        } catch (error) {
            console.log('Error opening mail:', error);
            // Last resort fallback
            Linking.openURL(mailtoUrl);
        }
    };

    const handleCopyEmail = async (email) => {
        await Clipboard.setStringAsync(email);
        Alert.alert('Başarılı', 'E-posta adresi kopyalandı.');
    };

    const renderInstructorItem = ({ item }) => (
        <View style={styles.instructorCard}>
            {/* Header */}
            <View style={styles.instructorHeader}>
                <View style={styles.avatarContainer}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <User size={32} color="#fff" />
                        </View>
                    )}
                </View>

                <View style={styles.instructorInfo}>
                    <Text style={styles.instructorName}>{item.name || 'İsimsiz Eğitmen'}</Text>
                    <View style={styles.emailContainer}>
                        <Text style={styles.instructorEmail} numberOfLines={1}>{item.email}</Text>
                        <TouchableOpacity onPress={() => handleCopyEmail(item.email)} style={styles.copyButton}>
                            <Copy size={14} color="#ea580c" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.courseCountBadge}>
                        <BookOpen size={12} color="#ea580c" />
                        <Text style={styles.courseCountText}>{item.courses?.length || 0} Kurs</Text>
                    </View>
                </View>
            </View>

            {/* Gmail Button */}
            <TouchableOpacity
                style={styles.gmailButton}
                onPress={() => handleEmailClick(item.email, item.name)}
            >
                <Mail size={20} color="#fff" />
                <Text style={styles.gmailButtonText}>Gmail'de Gönder</Text>
            </TouchableOpacity>

            {/* Courses List */}
            {item.courses && item.courses.length > 0 && (
                <View style={styles.coursesList}>
                    <Text style={styles.coursesTitle}>Verdiği Kurslar</Text>
                    {item.courses.map((course) => (
                        <TouchableOpacity
                            key={course.id}
                            style={styles.courseItem}
                            onPress={() => navigation.navigate('Home', {
                                screen: 'CourseDetail',
                                params: { courseId: course.id }
                            })}
                        >
                            {course.imageUrl ? (
                                <Image source={{ uri: course.imageUrl }} style={styles.courseImage} />
                            ) : (
                                <View style={styles.courseImagePlaceholder}>
                                    <BookOpen size={16} color="#fff" />
                                </View>
                            )}
                            <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    if (!isLoggedIn) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <GraduationCap size={28} color="#ea580c" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Chef'e Sor</Text>
                        <Text style={styles.headerSubtitle}>Kurs hocalarınıza doğrudan ulaşın</Text>
                    </View>
                </View>
                <View style={styles.centerContainer}>
                    <User size={64} color="#374151" />
                    <Text style={styles.emptyTitle}>Giriş Yapmalısınız</Text>
                    <Text style={styles.emptyText}>Hocalarınızı görmek için giriş yapmanız gerekiyor</Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Login' }))}
                    >
                        <Text style={styles.loginButtonText}>Giriş Yap</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <GraduationCap size={28} color="#ea580c" />
                </View>
                <View>
                    <Text style={styles.headerTitle}>Chef'e Sor</Text>
                    <Text style={styles.headerSubtitle}>Kurs hocalarınıza doğrudan ulaşın</Text>
                </View>
            </View>

            {instructors.length === 0 ? (
                <View style={styles.centerContainer}>
                    <BookOpen size={64} color="#374151" />
                    <Text style={styles.emptyTitle}>Henüz Kurs Kaydınız Yok</Text>
                    <Text style={styles.emptyText}>Hocalarınızı görebilmek için en az bir kursa kayıt olmalısınız</Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.browseButtonText}>Kursları Keşfet</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={instructors}
                    renderItem={renderInstructorItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                    }
                />
            )}
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
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        gap: 12,
    },
    headerIcon: {
        backgroundColor: 'rgba(234, 88, 12, 0.2)',
        padding: 12,
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 2,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 24,
    },
    loginButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    browseButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    browseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    instructorCard: {
        backgroundColor: '#0a0a0a',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        marginBottom: 16,
        overflow: 'hidden',
    },
    instructorHeader: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#ea580c',
    },
    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ea580c',
    },
    instructorInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    instructorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    instructorEmail: {
        fontSize: 13,
        color: '#9ca3af',
        marginBottom: 8,
    },
    courseCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    courseCountText: {
        fontSize: 12,
        color: '#ea580c',
    },
    gmailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ea580c',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    gmailButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    coursesList: {
        padding: 16,
        paddingTop: 0,
    },
    coursesTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    courseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(55, 65, 81, 0.3)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#374151',
        gap: 12,
    },
    courseImage: {
        width: 40,
        height: 40,
        borderRadius: 6,
    },
    courseImagePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 6,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    courseTitle: {
        flex: 1,
        fontSize: 14,
        color: '#fff',
    },
    emailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    copyButton: {
        padding: 4,
    },
});
