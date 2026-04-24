import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Linking,
    Modal,
    Platform,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../components/Logo';
import {
    ChefHat,
    Clock,
    Star,
    Users,
    Play,
    Lock,
    CheckCircle,
    ArrowLeft,
    Bookmark,
} from 'lucide-react-native';
import courseService from '../api/courseService';
import authService from '../api/authService';
import CustomAlert from '../components/CustomAlert';
import favoritesService from '../services/favoritesService';
import LoginRequiredModal from '../components/LoginRequiredModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function CourseDetailScreen({ route, navigation }) {
    const { courseId, initialCourse } = route.params;
    const [course, setCourse] = useState(initialCourse || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: [],
        type: 'info'
    });
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const showAlert = (title, message, buttons = [{ text: 'Tamam' }], type = 'info') => {
        setAlertConfig({ title, message, buttons, type });
        setAlertVisible(true);
    };

    // useFocusEffect to refresh data when screen comes into focus (e.g. back from payment)
    const { useFocusEffect } = require('@react-navigation/native');

    useFocusEffect(
        React.useCallback(() => {
            // Force refresh user data from server to check for new subscription
            const refreshData = async () => {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) return; // Don't try to refresh if not logged in

                try {
                    console.log('Refreshing user data for subscription check...');
                    const updatedUser = await authService.refreshUserData();
                    if (updatedUser) {
                        setUserData(updatedUser);
                    } else {
                        // Fallback to local if refresh fails (e.g. offline)
                        loadUserData();
                    }
                } catch (err) {
                    console.log('Refresh error:', err);
                    loadUserData();
                }
            };

            refreshData();

            // We let initial load handle the very first course load and auth check.
            // But if user navigates back to this screen while logged in, we should reload course
            const checkAndLoadCourse = async () => {
                const token = await AsyncStorage.getItem('authToken');
                if (token) loadCourseDetails();
            };
            checkAndLoadCourse();

            return () => {
                // cleanup
            };
        }, [courseId])
    );

    // Initial load + auth check
    useEffect(() => {
        const checkAuthAndLoad = async () => {
            const token = await AsyncStorage.getItem('authToken');
            const loggedIn = !!token;
            setIsLoggedIn(loggedIn);

            if (!loggedIn) {
                setShowLoginModal(true);
            } else {
                loadUserData();
            }
            // Always try to load course details to show in background
            loadCourseDetails(loggedIn);
        };
        checkAuthAndLoad();
    }, []);

    const loadUserData = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user) setUserData(user);
        } catch (err) {
            console.log('User data load error:', err);
        }
    };

    const loadCourseDetails = async (isUserLoggedIn = isLoggedIn) => {
        try {
            setLoading(true);
            setError(null);

            // Fetch course details using service
            const result = await courseService.getCourseDetails(courseId);

            if (result.success) {
                setCourse(result.data);

                if (isUserLoggedIn) {
                    // Check if this course is in favorites only if logged in
                    const favStatus = await favoritesService.isFavorite(courseId);
                    setIsFavorite(favStatus);
                }
            } else {
                throw new Error(result.error || 'Kurs bulunamadı');
            }
        } catch (err) {
            console.error('Course detail error:', err);

            // Sadece kullanıcı giriş yapmışsa veya modal gösterilmiyorsa hata göster
            if (isUserLoggedIn) {
                setError(err.message || 'Kurs detayları yüklenirken bir hata oluştu');
                showAlert(
                    'Hata',
                    'Kurs detayları yüklenemedi. Ana sayfaya dönülüyor.',
                    [{ text: 'Tamam', onPress: () => navigation.goBack() }],
                    'error'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async () => {
        if (!course) return;

        if (isFavorite) {
            await favoritesService.removeFavorite(course.id);
            setIsFavorite(false);
        } else {
            // Need to construct a favorite item identical to what CoursesScreen expects
            const favItem = {
                id: course.id,
                title: course.title,
                imageUrl: course.imageUrl,
                category: course.category,
                instructor: course.instructor,
                duration: course.duration,
                _count: course._count,
                course: course,
            };
            await favoritesService.addFavorite(favItem);
            setIsFavorite(true);
        }
    };

    const calculateAverageRating = (reviews) => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    const getTotalDuration = (lessons) => {
        if (!lessons || lessons.length === 0) return 0;
        return lessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0);
    };

    const getLevelInfo = (level) => {
        // dynamic pricing check or fallback
        const price = course?.price ? `${course.price} ₺` : '299 ₺';
        return { name: 'Premium', color: '#ea580c', price: price, slug: 'premium' };
    };



    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    if (error || !course) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Kurs bulunamadı</Text>
                <TouchableOpacity
                    style={styles.backToHomeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backToHomeText}>Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const checkAccess = () => {
        let hasPremiumAccess = false;
        const hasValidPlanName = userData?.subscriptionPlan && userData.subscriptionPlan !== 'FREE';
        let isDateValid = false;

        if (userData?.subscriptionEndDate) {
            isDateValid = new Date(userData.subscriptionEndDate) > new Date();
        } else {
            isDateValid = hasValidPlanName;
        }

        if (hasValidPlanName && isDateValid) {
            hasPremiumAccess = true;
        }

        return hasPremiumAccess;
    };

    const levelInfo = getLevelInfo(course.level);
    const avgRating = calculateAverageRating(course.reviews || []);
    const totalDuration = getTotalDuration(course.lessons || []);
    const isEnrolled = course.isEnrolled || false;
    const hasAccess = checkAccess();

    const displayImageUrl = course?.imageUrl || initialImageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=800';
    const displayTitle = course?.title || initialTitle || 'Yükleniyor...';

    return (
        <View style={styles.container}>
            {/* Header - Same as HomeScreen */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Logo size="md" />
                </View>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Course Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: course.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=800' }}
                        style={styles.courseImage}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.imageGradient}
                    >
                        <View style={[styles.levelBadge, { backgroundColor: levelInfo.color }]}>
                            <Text style={styles.levelText}>{levelInfo.name}</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Course Info */}
                <View style={styles.contentContainer}>
                    {/* Title & Favorite Row */}
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, { flex: 1 }]}>{course.title}</Text>
                        <TouchableOpacity
                            style={styles.favoriteBtn}
                            onPress={toggleFavorite}
                        >
                            <Bookmark size={24} color={isFavorite ? "#ea580c" : "#9ca3af"} fill={isFavorite ? "#ea580c" : "none"} />
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    <Text style={styles.description}>{course.description}</Text>

                    {/* Removed inline Premium Content banner */}

                    <TouchableOpacity
                        style={[
                            styles.enrolledButtonInline,
                            (course.progress > 0) && { backgroundColor: '#10b981' } // Green if started
                        ]}
                        onPress={() => {
                            if (hasAccess) {
                                navigation.navigate('Learn', { courseId: course.id });
                            } else {
                                navigation.navigate('Subscription');
                            }
                        }}
                    >
                        {hasAccess ? (
                            <Play size={20} color="white" fill="white" />
                        ) : (
                            <Lock size={20} color="white" />
                        )}
                        <Text style={styles.enrolledButtonText}>
                            {course.progress > 0 ? 'Kursa Devam Et' : 'Kursa Başla'}
                        </Text>
                    </TouchableOpacity>

                    {/* Instructor */}
                    {/* Instructor */}
                    {course.instructor && (
                        <TouchableOpacity
                            style={styles.instructorContainer}
                            onPress={() => navigation.navigate('InstructorProfile', {
                                instructorId: course.instructor.id,
                                instructorName: course.instructor.name,
                                instructorImage: course.instructor.image
                            })}
                        >
                            <View style={styles.instructorAvatar}>
                                {course.instructor.image ? (
                                    <Image
                                        source={{ uri: course.instructor.image }}
                                        style={{ width: '100%', height: '100%', borderRadius: 20 }}
                                    />
                                ) : (
                                    <ChefHat size={20} color="white" />
                                )}
                            </View>
                            <View style={styles.instructorInfo}>
                                <Text style={styles.instructorName}>{course.instructor.name}</Text>
                                <Text style={styles.instructorLabel}>Eğitmen Profili • İncele</Text>
                            </View>

                        </TouchableOpacity>
                    )}



                    {/* Lessons */}
                    {course.lessons && course.lessons.length > 0 && (
                        <View style={styles.lessonsContainer}>
                            <Text style={styles.sectionTitle}>Kurs İçeriği</Text>
                            {course.lessons.map((lesson, index) => {
                                const isFirstLesson = index === 0;
                                const isAccessAllowed = hasAccess || lesson.isFree || isFirstLesson;

                                return (
                                    <TouchableOpacity
                                        key={lesson.id}
                                        style={styles.lessonItem}
                                        onPress={() => {
                                            if (isAccessAllowed) {
                                                navigation.navigate('Learn', { courseId: course.id, lessonId: lesson.id });
                                            } else {
                                                navigation.navigate('Subscription');
                                            }
                                        }}
                                    >
                                        <View style={styles.lessonLeft}>
                                            <View style={styles.lessonNumber}>
                                                <Text style={styles.lessonNumberText}>{index + 1}</Text>
                                            </View>
                                            <View style={styles.lessonIcon}>
                                                {isAccessAllowed ? (
                                                    <Play size={16} color="#10b981" fill="#10b981" />
                                                ) : (
                                                    // This will only show if the user does NOT have global access
                                                    // and it's not a free/first lesson.
                                                    <Lock size={16} color="#ea580c" />
                                                )}
                                            </View>
                                            <View style={styles.lessonInfo}>
                                                <Text style={[styles.lessonTitle, !isAccessAllowed && { color: '#6b7280' }]}>
                                                    {lesson.title}
                                                </Text>
                                                {lesson.description && (
                                                    <Text style={styles.lessonDescription}>{lesson.description}</Text>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.lessonRight}>
                                            <Text style={styles.lessonDuration}>{lesson.duration || 0} dk</Text>

                                            {!hasAccess && (
                                                <>
                                                    {isFirstLesson ? (
                                                        <View style={styles.freeBadge}>
                                                            <Text style={styles.freeBadgeText}>Önizleme</Text>
                                                        </View>
                                                    ) : lesson.isFree ? (
                                                        <View style={styles.freeBadge}>
                                                            <Text style={styles.freeBadgeText}>Ücretsiz</Text>
                                                        </View>
                                                    ) : (
                                                        <View style={styles.premiumBadge}>
                                                            <Text style={styles.premiumBadgeText}>Premium</Text>
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    {/* Course Features */}
                    <View style={styles.featuresContainer}>
                        <Text style={styles.sectionTitle}>Bu kurs şunları içerir:</Text>
                        <View style={styles.featureItem}>
                            <CheckCircle size={16} color="#10b981" />
                            <Text style={styles.featureText}>{course._count?.lessons || 0} video ders</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <CheckCircle size={16} color="#10b981" />
                            <Text style={styles.featureText}>Yaşam boyu erişim</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <CheckCircle size={16} color="#10b981" />
                            <Text style={styles.featureText}>Tamamlama sertifikası</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <CheckCircle size={16} color="#10b981" />
                            <Text style={styles.featureText}>Mobil ve masaüstü erişim</Text>
                        </View>
                    </View>
                </View>
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

            {/* Login Required Modal */}
            <LoginRequiredModal
                visible={showLoginModal}
                message="Kurs detaylarını görüntülemek için giriş yapmanız gerekmektedir."
                onLogin={() => {
                    setShowLoginModal(false);
                    navigation.navigate('Login');
                }}
                onCancel={() => {
                    setShowLoginModal(false);
                    navigation.goBack();
                }}
            />

            {/* Premium modal kaldırıldı — artık doğrudan SubscriptionScreen'e yönlendiriliyor */}
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
    loadingText: {
        color: 'white',
        marginTop: 10,
        fontSize: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 16,
        marginBottom: 20,
    },
    backToHomeButton: {
        backgroundColor: '#ea580c',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backToHomeText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 6 : 46,
        paddingBottom: 8, paddingHorizontal: 16,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        padding: 4,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        justifyContent: 'center',
    },
    logoText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120, // Space for bottom tab bar
    },
    imageContainer: {
        position: 'relative',
        width: width,
        height: 250,
    },
    courseImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 16,
    },
    levelBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    levelText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    contentContainer: {
        padding: 16,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(234, 88, 12, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },
    categoryText: {
        color: '#ea580c',
        fontSize: 12,
        fontWeight: '600',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 16,
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    favoriteBtn: {
        padding: 4,
        marginTop: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
    },
    description: {
        color: '#d1d5db',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    instructorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    instructorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    instructorInfo: {
        flex: 1,
    },
    instructorName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    instructorLabel: {
        color: '#9ca3af',
        fontSize: 13,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    ratingCount: {
        color: '#9ca3af',
        fontSize: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 20,
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    statItem: {
        alignItems: 'center',
        gap: 8,
    },
    statNumber: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#9ca3af',
        fontSize: 12,
    },
    lessonsContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    lessonItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    lessonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    lessonNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(234, 88, 12, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lessonNumberText: {
        color: '#ea580c',
        fontSize: 12,
        fontWeight: '600',
    },
    lessonIcon: {
        marginRight: 4,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    lessonDescription: {
        color: '#9ca3af',
        fontSize: 12,
    },
    lessonRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    lessonDuration: {
        color: '#9ca3af',
        fontSize: 12,
    },
    freeBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    freeBadgeText: {
        color: '#10b981',
        fontSize: 10,
        fontWeight: '600',
    },
    premiumBadge: {
        backgroundColor: 'rgba(234, 88, 12, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(234, 88, 12, 0.3)',
    },
    premiumBadgeText: {
        color: '#d1d5db',
        fontSize: 10,
        fontWeight: '600',
    },
    featuresContainer: {
        backgroundColor: '#0a0a0a',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    featureText: {
        color: '#d1d5db',
        fontSize: 14,
    },
    subscribeButtonInline: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 20,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    subscribeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    enrolledButtonInline: {
        backgroundColor: '#ea580c', // Orange
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginVertical: 20,
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    enrolledButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    premiumModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    premiumModalContent: {
        backgroundColor: '#1c1c1e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        alignItems: 'center',
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
    },
    premiumModalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#4B5563',
        borderRadius: 2,
        marginBottom: 20,
    },
    premiumModalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    premiumModalTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    premiumModalText: {
        color: '#d1d5db',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    premiumModalInfoBox: {
        flexDirection: 'row',
        backgroundColor: '#111827',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    premiumModalInfoText: {
        color: '#9ca3af',
        fontSize: 14,
        flex: 1,
        marginLeft: 12,
        lineHeight: 20,
    },
    premiumModalCloseBtn: {
        backgroundColor: '#ea580c',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    premiumModalCloseText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
