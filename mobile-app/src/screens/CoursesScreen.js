import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar, Platform, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { ChefHat, Star, BookOpen, User, Clock } from 'lucide-react-native';
import courseService from '../api/courseService';
import authService from '../api/authService';
import favoritesService from '../services/favoritesService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CoursesScreen({ navigation }) {
    const [courses, setCourses] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const checkLoginStatus = async () => {
        const token = await AsyncStorage.getItem('authToken');
        setIsLoggedIn(!!token);
        return !!token;
    };

    const loadCourses = async () => {
        try {
            const loggedIn = await checkLoginStatus();
            if (!loggedIn) {
                setLoading(false);
                return;
            }

            // Always refresh from backend to get latest subscription status
            let user = await authService.refreshUserData();
            if (!user) user = await authService.getCurrentUser();
            if (!user || !user.subscriptionPlan || user.subscriptionPlan === 'FREE') {
                setCourses([]); // Clear courses if no active subscription
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const result = await courseService.getUserCourses();
            if (result.success) {
                setCourses(result.data.courses || []);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadCourses();
            loadFavorites();
        }, [])
    );

    const loadFavorites = async () => {
        const favs = await favoritesService.getFavorites();
        setFavorites(favs);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadCourses();
        loadFavorites();
    };

    const calculateAverageRating = (reviews) => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    const renderCourseItem = ({ item }) => {
        const courseData = item.course || item;
        const imageUrl = courseData.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400';
        const progress = item.progress || 0;

        return (
            <TouchableOpacity
                style={styles.courseCard}
                onPress={() => navigation.navigate('Learn', { courseId: courseData.id })}
                activeOpacity={0.9}
            >
                <View style={styles.imageContainer}>
                    <Image source={imageUrl} style={styles.courseImage} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                    <View style={styles.imageOverlay}>
                        <View style={styles.playButtonWrapper}>
                            <View style={styles.playIconContainer}>
                                <Text style={styles.playIconText}>▶</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.courseContent}>
                    <View style={styles.categoryWrap}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{courseData.category?.name || 'KATEGORİ'}</Text>
                        </View>
                    </View>

                    <Text style={styles.courseTitle} numberOfLines={1}>{courseData.title}</Text>

                    <View style={styles.courseMeta}>
                        <View style={styles.metaItem}>
                            <BookOpen size={12} color="#9ca3af" />
                            <Text style={styles.metaText}>{courseData._count?.lessons || 0} Ders</Text>
                        </View>
                        {courseData.duration && (
                            <View style={styles.metaItem}>
                                <Clock size={12} color="#9ca3af" />
                                <Text style={styles.metaText}>{courseData.duration} dk</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.progressSection}>
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${progress}%` }]} />
                        </View>
                        <View style={styles.progressFooter}>
                            <Text style={styles.continueText}>Eğitime devam et</Text>
                            {progress >= 100 && (
                                <Text style={styles.completedText}>TAMAMLANDI</Text>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    // Show login required screen if not logged in
    if (!isLoggedIn) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Kurslarım</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <User size={64} color="#374151" />
                    <Text style={styles.emptyTitle}>Giriş Yapmalısınız</Text>
                    <Text style={styles.emptyText}>Kurslarınızı görmek için giriş yapmanız gerekiyor</Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Login' }))}
                    >
                        <Text style={styles.browseButtonText}>Giriş Yap</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const getFilteredCourses = () => {
        if (activeFilter === 'favorites') return favorites;

        return courses.filter(item => {
            const progress = item.progress || 0;
            if (activeFilter === 'in-progress') return progress > 0 && progress < 100;
            if (activeFilter === 'completed') return progress >= 100;
            return true;
        });
    };

    const displayData = getFilteredCourses();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Kurslarım</Text>
            </View>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
                    <TouchableOpacity
                        style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
                        onPress={() => setActiveFilter('all')}
                    >
                        <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>Tümü</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, activeFilter === 'in-progress' && styles.filterTabActive]}
                        onPress={() => setActiveFilter('in-progress')}
                    >
                        <Text style={[styles.filterTabText, activeFilter === 'in-progress' && styles.filterTabTextActive]}>Devam Edenler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, activeFilter === 'favorites' && styles.filterTabActive]}
                        onPress={() => setActiveFilter('favorites')}
                    >
                        <Text style={[styles.filterTabText, activeFilter === 'favorites' && styles.filterTabTextActive]}>Listem</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, activeFilter === 'completed' && styles.filterTabActive]}
                        onPress={() => setActiveFilter('completed')}
                    >
                        <Text style={[styles.filterTabText, activeFilter === 'completed' && styles.filterTabTextActive]}>Tamamlananlar</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {displayData.length > 0 ? (
                <FlatList
                    data={displayData}
                    renderItem={renderCourseItem}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                    }
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <BookOpen size={64} color="#374151" />
                    <Text style={styles.emptyTitle}>
                        {activeFilter === 'completed' ? 'Henüz tamamladığınız kurs yok' :
                            activeFilter === 'in-progress' ? 'Yarıda kalan kursunuz yok' :
                                activeFilter === 'favorites' ? 'Listeniz boş' : 'Kurs listeniz boş'}
                    </Text>
                    <Text style={styles.emptyText}>
                        {activeFilter === 'all' ? 'İlk kursunuzu satın alarak öğrenmeye başlayın!' :
                            activeFilter === 'favorites' ? 'Beğendiğiniz kursları "Listeme Ekle" diyerek buraya taşıyabilirsiniz.' : 'Yeni içerikler öğrenmeye devam edin!'}
                    </Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.browseButtonText}>Kursları İncele</Text>
                    </TouchableOpacity>
                </View>
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60,
        paddingBottom: 20,
        paddingHorizontal: 16,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    filterContainer: {
        backgroundColor: '#000',
        paddingVertical: 8,
    },
    filterScroll: {
        maxHeight: 50,
    },
    filterContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
        marginRight: 8,
    },
    filterTabActive: {
        backgroundColor: '#ea580c',
        borderColor: '#ea580c',
    },
    filterTabText: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '500',
    },
    filterTabTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    courseCard: {
        backgroundColor: '#0a0a0a',
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        position: 'relative',
        backgroundColor: '#111',
    },
    courseImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'stretch',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButtonWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    playIconContainer: {
        marginLeft: 4, // optically center the play triangle
    },
    playIconText: {
        color: 'white',
        fontSize: 18,
    },
    progressBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 4,
    },
    progressDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ea580c',
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    progressBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    courseContent: {
        padding: 16,
    },
    categoryWrap: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    categoryBadge: {
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    categoryText: {
        color: '#ea580c',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    courseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
    },
    courseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        color: '#9ca3af',
    },
    progressSection: {
        marginTop: 4,
    },
    progressContainer: {
        height: 6,
        backgroundColor: '#1f2937',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#ea580c',
        borderRadius: 3,
    },
    progressFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    continueText: {
        fontSize: 10,
        color: '#6b7280',
        fontWeight: '500',
        letterSpacing: -0.2,
    },
    completedText: {
        fontSize: 10,
        color: '#22c55e',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        color: '#fbbf24',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    browseButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
