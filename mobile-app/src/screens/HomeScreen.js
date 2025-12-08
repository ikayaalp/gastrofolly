import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChefHat, BookOpen, Star, Play, Plus, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import courseService from '../api/courseService';
import authService from '../api/authService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const [featuredCourses, setFeaturedCourses] = useState([]);
    const [popularCourses, setPopularCourses] = useState([]);
    const [recentCourses, setRecentCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [userCourses, setUserCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const scrollViewRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    // Auto-scroll effect
    useEffect(() => {
        if (featuredCourses.length === 0) return;

        const interval = setInterval(() => {
            let nextIndex = currentIndex + 1;
            if (nextIndex >= Math.min(featuredCourses.length, 5)) {
                nextIndex = 0;
            }

            setCurrentIndex(nextIndex);
            scrollViewRef.current?.scrollTo({
                x: nextIndex * width,
                animated: true,
            });
        }, 3000); // Scroll every 3 seconds

        return () => clearInterval(interval);
    }, [currentIndex, featuredCourses]);

    const loadData = async () => {
        setLoading(true);

        // Get user data
        const user = await authService.getCurrentUser();
        if (user) {
            setUserName(user.name || 'Kullanıcı');
        }

        // Get featured courses (only endpoint that exists)
        const featuredResult = await courseService.getFeaturedCourses();

        if (featuredResult.success) {
            const courses = featuredResult.data.courses || [];
            const categoriesData = featuredResult.data.categories || [];

            // Featured courses - first 6
            setFeaturedCourses(courses.slice(0, 6));

            // Popular courses - reuse courses but reverse for variety if needed
            // This ensures we have items even if total count is small
            setPopularCourses([...courses].reverse().slice(0, 6));

            // Recent courses - already sorted by createdAt desc
            setRecentCourses(courses.slice(0, 6));

            // Categories with their courses
            setCategories(categoriesData);
        }

        // Get user's enrolled courses - Only for paid subscribers
        if (user && user.subscriptionPlan && user.subscriptionPlan !== 'FREE') {
            const userCoursesResult = await courseService.getUserCourses();
            if (userCoursesResult.success) {
                setUserCourses(userCoursesResult.data.courses || []);
            }
        } else {
            setUserCourses([]);
        }

        setLoading(false);
    };

    const calculateAverageRating = (reviews) => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    const renderCourseCard = (course, index) => {
        // Handle both direct course and enrollment.course structure
        const courseData = course.course || course;
        const imageUrl = courseData.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400';
        const avgRating = calculateAverageRating(courseData.reviews);
        const instructorFirstName = courseData.instructor?.name?.split(' ')[0] || 'Eğitmen';

        return (
            <TouchableOpacity
                key={courseData.id || index}
                style={styles.courseCard}
                onPress={() => navigation.navigate('CourseDetail', { courseId: courseData.id })}
                activeOpacity={0.9}
            >
                {/* Course Image with Overlay */}
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.courseImage}
                />

                {/* Gradient Overlay with Text */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
                    style={styles.courseOverlay}
                >
                    <Text style={styles.courseTitle} numberOfLines={2}>{courseData.title}</Text>
                    <View style={styles.courseFooter}>
                        {/* Instructor with Orange $ Icon */}
                        <View style={styles.instructorBadge}>
                            <View style={styles.dollarIcon}>
                                <Text style={styles.dollarText}>$</Text>
                            </View>
                            <Text style={styles.instructorText}>{courseData.instructor?.name || 'Eğitmen'}</Text>
                        </View>
                        {/* Star Rating */}
                        <View style={styles.ratingBadge}>
                            <Star size={12} color="#fbbf24" fill="#fbbf24" />
                            <Text style={styles.ratingText}>{avgRating}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.logoContainer}>
                        <ChefHat color="#f97316" size={24} />
                        <Text style={styles.logoText}>Chef2.0</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={() => navigation.navigate('Search')}
                        >
                            <Ionicons name="search" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Auto-Scrolling Carousel */}
                {featuredCourses.length > 0 && (
                    <View style={styles.carouselSection}>
                        <ScrollView
                            ref={scrollViewRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            pagingEnabled
                            decelerationRate="fast"
                            snapToInterval={width}
                            style={styles.carousel}
                        >
                            {featuredCourses.slice(0, 5).map((course, index) => (
                                <TouchableOpacity
                                    key={course.id || index}
                                    style={[styles.carouselCard, { width }]}
                                    activeOpacity={0.9}
                                    onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                                >
                                    <Image
                                        source={{ uri: course.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=800' }}
                                        style={styles.carouselImage}
                                    />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)', '#000']}
                                        style={styles.carouselGradient}
                                    >
                                        <View style={styles.carouselContent}>
                                            <View style={styles.categoryTag}>
                                                <Text style={styles.categoryText}>ÖNE ÇIKAN</Text>
                                            </View>

                                            <Text style={styles.carouselTitle} numberOfLines={2}>
                                                {course.title}
                                            </Text>

                                            <View style={styles.metaContainer}>
                                                <Text style={styles.metaText}>Eğitmen: {course.instructor?.name || 'Şef'}</Text>
                                                <View style={styles.dotSeparator} />
                                                <View style={styles.ratingContainer}>
                                                    <Star size={14} color="#fbbf24" fill="#fbbf24" />
                                                    <Text style={styles.ratingText}>{calculateAverageRating(course.reviews)}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.actionButtons}>
                                                <TouchableOpacity style={styles.playButton}>
                                                    <Play size={20} color="white" fill="white" />
                                                    <Text style={styles.playButtonText}>İzle</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity style={styles.listButton}>
                                                    <Plus size={24} color="white" />
                                                    <Text style={styles.listButtonText}>Listem</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* My Courses Section */}
                {userCourses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Kaldığın Yerden Devam Et</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {userCourses.map((enrollment, index) => renderCourseCard(enrollment, index))}
                        </ScrollView>
                    </View>
                )}

                {/* Featured Courses Section */}
                {featuredCourses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Öne Çıkan Kurslar</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {featuredCourses.map((course, index) => renderCourseCard(course, index))}
                        </ScrollView>
                    </View>
                )}

                {/* Popular Courses Section */}
                {popularCourses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Popüler Kurslar</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {popularCourses.map((course, index) => renderCourseCard(course, index))}
                        </ScrollView>
                    </View>
                )}

                {/* Recent Courses Section */}
                {recentCourses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Yeni Eklenen Kurslar</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {recentCourses.map((course, index) => renderCourseCard(course, index))}
                        </ScrollView>
                    </View>
                )}

                {/* Categories Sections */}
                {categories.map((category) => (
                    category.courses && category.courses.length > 0 && (
                        <View key={category.id} style={styles.section}>
                            <Text style={styles.sectionTitle}>{category.name}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                {category.courses.map((course, index) => renderCourseCard(course, index))}
                            </ScrollView>
                        </View>
                    )
                ))}
            </ScrollView>
        </View >
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
    header: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
        paddingBottom: 12,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    horizontalScroll: {
        paddingLeft: 16,
    },
    courseCard: {
        width: 220,
        height: 170,
        marginRight: 12,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    courseImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    courseOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 10,
        paddingBottom: 10,
        paddingTop: 40,
    },
    courseTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
        lineHeight: 18,
    },
    courseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    instructorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    dollarIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#ea580c',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dollarText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    instructorText: {
        color: '#9ca3af',
        fontSize: 11,
        fontWeight: '500',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: '#d1d5db',
        fontSize: 12,
        fontWeight: 'bold',
    },
    carouselSection: {
        marginTop: 0,
        marginBottom: 24,
    },
    carousel: {
        height: 500,
    },
    carouselCard: {
        height: 500,
        position: 'relative',
    },
    carouselImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    carouselGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        justifyContent: 'flex-end',
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    carouselContent: {
        alignItems: 'center',
    },
    categoryTag: {
        backgroundColor: 'rgba(234, 88, 12, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
        marginBottom: 16,
    },
    categoryText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    carouselTitle: {
        color: 'white',
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    metaText: {
        color: '#e5e5e5',
        fontSize: 14,
        fontWeight: '500',
    },
    dotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#e5e5e5',
        marginHorizontal: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ea580c',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 4,
        gap: 8,
    },
    playButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listButton: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 16,
    },
    listButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
});
