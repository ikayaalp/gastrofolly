import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Image } from 'expo-image';

import { Ionicons } from '@expo/vector-icons';
import { ChefHat, BookOpen, Star, Play, Plus, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../components/Logo';
import courseService from '../api/courseService';
import authService from '../api/authService';
import homeService from '../api/homeService';
import storyService from '../api/storyService';
import Stories from '../components/Stories';
import ScreenContainer from '../components/ScreenContainer';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const [featuredCourses, setFeaturedCourses] = useState([]);
    const [popularCourses, setPopularCourses] = useState([]);
    const [recentCourses, setRecentCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [userCourses, setUserCourses] = useState([]);
    const [stories, setStories] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [homeSections, setHomeSections] = useState([]);
    const [homeCovers, setHomeCovers] = useState([]);
    const [homeInstructors, setHomeInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const scrollViewRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    // ... (keep auto-scroll effect same) ...

    const loadData = async () => {
        setLoading(true);

        // Always refresh from backend to get latest subscription status
        let user = await authService.refreshUserData();
        if (!user) user = await authService.getCurrentUser();
        if (user) {
            setUserName(user.name || 'Kullanıcı');
        }

        const homeResult = await homeService.getHomeData();
        if (homeResult.success) {
            const data = homeResult.data;
            
            setFeaturedCourses(data.featuredCourses || []);
            setPopularCourses(data.popularCourses || []);
            setRecentCourses(data.recentCourses || []);
            setCategories(data.categories || []);
            setInstructors(data.instructors || []);
            setHomeSections(data.homeSections || []);
            setHomeCovers(data.homeCovers || []);
            setHomeInstructors(data.homeInstructors || []);
        }

        // Fetch Stories
        try {
            const storyResult = await storyService.getActiveStories();
            if (storyResult && storyResult.success) {
                // Group stories by creator logic (similar to web)
                if (storyResult.stories) {
                    // 1. Group stories first
                    const groupedMap = {};

                    storyResult.stories.forEach(story => {
                        const key = story.title ? `title:${story.title}` : `id:${story.id}`;
                        if (!groupedMap[key]) {
                            groupedMap[key] = {
                                id: key,
                                tempStories: [] // Temporary array to hold stories before sorting
                            };
                        }
                        groupedMap[key].tempStories.push(story);
                    });

                    // 2. Process each group: Sort by date ASC, then pick cover from the FIRST (Oldest) story
                    const formattedStories = Object.values(groupedMap).map(group => {
                        // Sort Oldest to Newest
                        group.tempStories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                        const firstStory = group.tempStories[0]; // The "First" (Oldest) story determines the identity

                        let avatarUrl = firstStory.coverImage;

                        // Thumbnail logic for the first story
                        if (!avatarUrl && firstStory.mediaType === 'VIDEO' && firstStory.mediaUrl?.includes('cloudinary')) {
                            avatarUrl = firstStory.mediaUrl.replace(/\.[^/.]+$/, ".jpg");
                        }
                        if (!avatarUrl) {
                            avatarUrl = firstStory.mediaType === 'IMAGE' ? firstStory.mediaUrl : firstStory.creator.image;
                        }

                        return {
                            id: group.id,
                            user: {
                                name: firstStory.title || firstStory.creator.name || "Chef",
                                avatar: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstStory.creator.name)}`
                            },
                            stories: group.tempStories
                        };
                    });

                    // 3. Sort the GROUPS themselves by the *Latest* update? 
                    // Usually apps show the group with the most recent story first.
                    formattedStories.sort((groupA, groupB) => {
                        const lastStoryA = groupA.stories[groupA.stories.length - 1]; // Newest in A
                        const lastStoryB = groupB.stories[groupB.stories.length - 1]; // Newest in B
                        return new Date(lastStoryB.createdAt) - new Date(lastStoryA.createdAt);
                    });

                    setStories(formattedStories);
                }
            }
        } catch (e) {
            console.error("Story load error", e);
        }

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

    const handleEnroll = async (courseId) => {
        try {
            const result = await courseService.enrollCourse(courseId);
            if (result.success) {
                // Refresh data to show in "My Courses"
                loadData();
                showAlert('Başarılı', 'Kurs listenize eklendi!', [{ text: 'Tamam' }], 'success');
            } else {
                showAlert('Hata', result.error || 'Kursa kayıt olunamadı.', [{ text: 'Tamam' }], 'error');
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            showAlert('Hata', 'Kursa kayıt sırasında bir sorun oluştu.', [{ text: 'Tamam' }], 'error');
        }
    };

    const handleCategoryPress = (categoryId) => {
        setSelectedCategoryId(categoryId);
    };

    const selectedCategory = selectedCategoryId
        ? categories.find((c) => c.id === selectedCategoryId)
        : null;

    const showAlert = (title, message, buttons = [{ text: 'Tamam' }], type = 'info') => {
        // Simple alert for now, can be replaced with CustomAlert if needed
        alert(`${title}: ${message}`);
    };

    const renderCourseCard = (course, index) => {
        // Handle both direct course and enrollment.course structure
        const courseData = course.course || course;
        const imageUrl = courseData.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400';
        const instructorFirstName = courseData.instructor?.name?.split(' ')[0] || 'Eğitmen';

        return (
            <TouchableOpacity
                key={courseData.id || index}
                style={styles.courseCard}
                onPress={() => navigation.navigate('CourseDetail', { courseId: courseData.id, initialCourse: courseData })}
                activeOpacity={0.9}
            >
                {/* Course Image with Overlay */}
                <Image
                    source={imageUrl}
                    style={styles.courseImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
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
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    // Netflix-style ranked course card with large orange numbers
    const renderRankedCourseCard = (course, index) => {
        const courseData = course.course || course;
        const imageUrl = courseData.posterImageUrl || courseData.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400';
        const rank = index + 1;

        return (
            <TouchableOpacity
                key={courseData.id || index}
                style={styles.rankedCardContainer}
                onPress={() => navigation.navigate('CourseDetail', { courseId: courseData.id, initialCourse: courseData })}
                activeOpacity={0.9}
            >
                {/* Large Ranking Number */}
                <View style={styles.rankNumberContainer}>
                    <Text style={styles.rankNumber}>{rank}</Text>
                </View>

                {/* Course Card */}
                <View style={styles.rankedCourseCard}>
                    <Image
                        source={imageUrl}
                        style={styles.rankedCourseImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
                        style={styles.rankedCourseOverlay}
                    >
                        <Text style={styles.rankedCourseTitle} numberOfLines={2}>{courseData.title}</Text>
                        <View style={styles.rankedCourseFooter}>
                            <View style={styles.instructorBadge}>
                                <View style={styles.dollarIcon}>
                                    <Text style={styles.dollarText}>$</Text>
                                </View>
                                <Text style={styles.instructorText}>{courseData.instructor?.name || 'Eğitmen'}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </TouchableOpacity>
        );
    };

    // Large vertical course card (like web's large prop)
    const renderLargeCourseCard = (course, index) => {
        const courseData = course.course || course;
        const imageUrl = courseData.posterImageUrl || courseData.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400';

        return (
            <TouchableOpacity
                key={courseData.id || index}
                style={styles.largeCourseCard}
                onPress={() => navigation.navigate('CourseDetail', { courseId: courseData.id, initialCourse: courseData })}
                activeOpacity={0.9}
            >
                <Image
                    source={imageUrl}
                    style={styles.largeCourseImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                    style={styles.largeCourseOverlay}
                >
                    <Text style={styles.largeCourseTitle} numberOfLines={2}>{courseData.title}</Text>
                    <View style={styles.largeCourseFooter}>
                        <View style={styles.instructorBadge}>
                            <View style={styles.dollarIcon}>
                                <Text style={styles.dollarText}>$</Text>
                            </View>
                            <Text style={styles.instructorText}>{courseData.instructor?.name || 'Eğitmen'}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    // Continue Watching Card with Progress Bar
    const renderContinueWatchingCard = (course, index) => {
        const courseData = course.course || course;
        const imageUrl = courseData.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400';
        const progress = courseData.progress || 0;

        return (
            <TouchableOpacity
                key={courseData.id || index}
                style={styles.courseCard}
                onPress={() => navigation.navigate('CourseDetail', { courseId: courseData.id, initialCourse: courseData })}
                activeOpacity={0.9}
            >
                <Image
                    source={imageUrl}
                    style={styles.courseImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
                    style={styles.courseOverlay}
                >
                    <Text style={styles.courseTitle} numberOfLines={1}>{courseData.title}</Text>

                    {/* Progress Bar Section */}
                    <View style={styles.resumeContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                        </View>
                        <View style={styles.resumeRow}>
                            <Text style={styles.resumeText}>%{progress} Tamamlandı</Text>
                            <View style={styles.resumeAction}>
                                <Play size={10} color="#ea580c" fill="#ea580c" />
                                <Text style={styles.resumeActionText}>Devam Et</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    // Kategori seçiliyken kursları yukarıdan aşağı, tek sütun listeleyen kart
    const renderCategoryListCard = (course, index) => {
        const courseData = course.course || course;
        const imageUrl = courseData.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400';

        return (
            <TouchableOpacity
                key={courseData.id || index}
                style={styles.listCard}
                onPress={() => navigation.navigate('CourseDetail', { courseId: courseData.id, initialCourse: courseData })}
                activeOpacity={0.85}
            >
                <Image
                    source={imageUrl}
                    style={styles.listCardImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
                    style={styles.listCardOverlay}
                >
                    <Text style={styles.listCardTitle} numberOfLines={2}>{courseData.title}</Text>
                    <Text style={styles.listCardInstructor} numberOfLines={1}>{courseData.instructor?.name || 'Eğitmen'}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <ScreenContainer style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.logoContainer}>
                        <Logo size="md" />
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('Notifications')}
                        >
                            <Ionicons name="notifications-outline" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('Search')}
                        >
                            <Ionicons name="search" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Category Pills */}
            {categories && categories.filter((c) => c.courses && c.courses.length > 0).length > 0 && (
                <View style={styles.categoryPillsWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryPillsContent}
                    >
                        <TouchableOpacity
                            style={[styles.categoryPill, !selectedCategoryId && styles.categoryPillActive]}
                            onPress={() => handleCategoryPress(null)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.categoryPillText, !selectedCategoryId && styles.categoryPillTextActive]}>
                                Tümü
                            </Text>
                        </TouchableOpacity>
                        {categories
                            .filter((c) => c.courses && c.courses.length > 0)
                            .map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[styles.categoryPill, selectedCategoryId === category.id && styles.categoryPillActive]}
                                    onPress={() => handleCategoryPress(category.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.categoryPillText, selectedCategoryId === category.id && styles.categoryPillTextActive]}>
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                    </ScrollView>
                </View>
            )}

            {selectedCategory ? (
                <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingTop: 16 }]}>
                    {selectedCategory.courses.map((course, index) => renderCategoryListCard(course, index))}
                </ScrollView>
            ) : (
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" colors={['#ea580c']} />
                }
            >
                {/* Auto-Scrolling Carousel */}
                {(homeCovers && homeCovers.length > 0) ? (
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
                            {homeCovers.map((cover, index) => (
                                <TouchableOpacity
                                    key={cover.id || `cover-${index}`}
                                    style={[styles.carouselCard, { width }]}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        if (cover.linkUrl) {
                                            // Optional: handle linking. For now, it's just a cover
                                        }
                                    }}
                                >
                                    <Image
                                        source={cover.imageUrl ? { uri: cover.imageUrl } : require('../../assets/icon.png')}
                                        style={styles.carouselImage}
                                        contentFit="cover"
                                        transition={300}
                                        cachePolicy="memory-disk"
                                    />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)', '#000']}
                                        style={styles.carouselGradient}
                                    >
                                        <View style={styles.carouselContent}>
                                            <Text style={styles.carouselTitle} numberOfLines={2}>
                                                {cover.title || ''}
                                            </Text>
                                            <View style={styles.metaContainer}>
                                                <Text style={styles.metaText}>{cover.subtitle || ''}</Text>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ) : (
                    featuredCourses && featuredCourses.length > 0 && (
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
                                        key={course.id || `featured-${index}`}
                                        style={[styles.carouselCard, { width }]}
                                        activeOpacity={0.9}
                                        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id, initialCourse: course })}
                                    >
                                        <Image
                                            source={course.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=800'}
                                            style={styles.carouselImage}
                                            contentFit="cover"
                                            transition={300}
                                            cachePolicy="memory-disk"
                                        />
                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)', '#000']}
                                            style={styles.carouselGradient}
                                        >
                                            <View style={styles.carouselContent}>
                                                <Text style={styles.carouselTitle} numberOfLines={2}>
                                                    {course.title}
                                                </Text>
                                                <View style={styles.metaContainer}>
                                                    <Text style={styles.metaText}>Eğitmen: {course.instructor?.name || 'Şef'}</Text>
                                                </View>
                                                <View style={styles.actionButtons}>
                                                    <TouchableOpacity
                                                        style={styles.playButton}
                                                        onPress={() => navigation.navigate('Learn', { courseId: course.id })}
                                                    >
                                                        <Play size={20} color="white" fill="white" />
                                                        <Text style={styles.playButtonText}>İzle</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )
                )}

                {/* Dynamic Sections based on Admin Panel */}
                {homeSections.map((section) => {
                    if (!section.isVisible) return null;

                    if (section.isCustom) {
                        const courses = section.courses;
                        if (!courses || courses.length === 0) return null;
                        
                        return (
                            <View key={section.key} style={styles.section}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                    {courses.map((course, index) => renderCourseCard(course, index))}
                                </ScrollView>
                            </View>
                        );
                    }

                    switch (section.key) {
                        case 'continue':
                            if (!userCourses || userCourses.length === 0) return null;
                            return (
                                <View key={section.key} style={styles.section}>
                                    <Text style={styles.sectionTitle}>{section.title || 'Kaldığın Yerden Devam Et'}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                        {userCourses.map((course, index) => renderContinueWatchingCard(course, index))}
                                    </ScrollView>
                                </View>
                            );
                        case 'stories':
                            return <Stories key={section.key} stories={stories} navigation={navigation} />;
                        case 'featured':
                            if (!featuredCourses || featuredCourses.length === 0) return null;
                            return (
                                <View key={section.key} style={styles.section}>
                                    <Text style={styles.sectionTitle}>{section.title || 'Öne Çıkan Kurslar'}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                        {featuredCourses.map((course, index) => renderCourseCard(course, index))}
                                    </ScrollView>
                                </View>
                            );
                        case 'popular':
                            if (!popularCourses || popularCourses.length === 0) return null;
                            return (
                                <View key={section.key} style={styles.section}>
                                    <Text style={styles.sectionTitle}>{section.title || 'Popüler Kurslar'}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rankedHorizontalScroll}>
                                        {popularCourses.slice(0, 3).map((course, index) => renderRankedCourseCard(course, index))}
                                    </ScrollView>
                                </View>
                            );
                        case 'instructors':
                            const displayInstructors = (homeInstructors && homeInstructors.length > 0) 
                                ? homeInstructors.map(hi => hi.instructor || hi) // adjust depending on API response
                                : instructors;
                            if (!displayInstructors || displayInstructors.length === 0) return null;
                            return (
                                <View key={section.key} style={styles.section}>
                                    <Text style={styles.sectionTitle}>{section.title || 'Eğitmenlerimiz'}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                        {displayInstructors.map((instructor, index) => {
                                            const inst = instructor.instructor || instructor;
                                            const instImage = inst.image || inst.imageUrl;
                                            return (
                                                <TouchableOpacity
                                                    key={inst.id || index}
                                                    style={styles.instructorCard}
                                                    onPress={() => navigation.navigate('InstructorProfile', {
                                                        instructorId: inst.id,
                                                        instructorName: inst.name,
                                                        instructorImage: instImage,
                                                    })}
                                                >
                                                    <Image
                                                        source={instImage ? { uri: instImage } : require('../../assets/icon.png')}
                                                        style={[styles.instructorAvatar, { backgroundColor: '#111' }]}
                                                        contentFit="contain"
                                                    />
                                                    <Text style={styles.instructorName} numberOfLines={1}>{inst.name}</Text>
                                                    <Text style={styles.instructorMeta} numberOfLines={1}>
                                                        {inst.subtitle ? inst.subtitle : `${inst.courseCount || 0} kurs`}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            );
                        case 'recent':
                            if (!recentCourses || recentCourses.length === 0) return null;
                            return (
                                <View key={section.key} style={styles.section}>
                                    <Text style={styles.sectionTitle}>{section.title || 'Yeni Eklenen Kurslar'}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                        {recentCourses.map((course, index) => renderLargeCourseCard(course, index))}
                                    </ScrollView>
                                </View>
                            );
                        case 'categories':
                            if (!categories || categories.length === 0) return null;
                            return categories
                                .filter((category) => category.courses && category.courses.length > 0)
                                .map((category) => (
                                    <View key={`cat-${category.id}`} style={styles.section}>
                                        <Text style={styles.sectionTitle}>{category.name}</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                            {category.courses.map((course, index) => renderCourseCard(course, index))}
                                        </ScrollView>
                                    </View>
                                ));
                        default:
                            return null;
                    }
                })}
            </ScrollView>
            )}
        </ScreenContainer>
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
        paddingTop: 6,
        paddingBottom: 8,
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
        gap: 16,
    },
    headerButton: {
        padding: 4,
    },
    categoryPillsWrapper: {
        paddingVertical: 10,
    },
    categoryPillsContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryPill: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
    },
    categoryPillActive: {
        backgroundColor: '#ea580c',
        borderColor: '#ea580c',
    },
    categoryPillText: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
    },
    categoryPillTextActive: {
        color: '#fff',
    },
    listCard: {
        marginHorizontal: 16,
        marginBottom: 20,
        aspectRatio: 1.45,
        borderRadius: 14,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#1f2937',
        position: 'relative',
        overflow: 'hidden',
    },
    listCardImage: {
        width: '100%',
        height: '100%',
    },
    listCardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 60,
    },
    listCardTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        lineHeight: 22,
        marginBottom: 4,
    },
    listCardInstructor: {
        color: '#9ca3af',
        fontSize: 13,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 140,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 20,
        marginBottom: 15,
    },
    instructorCard: {
        alignItems: 'center',
        marginRight: 16,
        width: 110
    },
    instructorAvatar: {
        width: 100,
        height: 140,
        borderRadius: 12,
        backgroundColor: '#1a1a1a'
    },
    instructorName: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 6,
        textAlign: 'center'
    },
    instructorMeta: {
        color: '#888',
        fontSize: 11,
        marginTop: 2
    },
    horizontalScroll: {
        paddingLeft: 20,
    },
    courseCard: {
        width: 220,
        height: 152,
        marginRight: 12,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    courseImage: {
        width: '100%',
        height: '100%',
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
    // Netflix-style ranked course card styles
    rankedHorizontalScroll: {
        paddingLeft: 16,
        paddingVertical: 8,
    },
    rankedCardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        height: 240,
    },
    rankNumberContainer: {
        width: 70,
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginRight: -25,
        zIndex: 0,
    },
    rankNumber: {
        fontSize: 140,
        fontWeight: '900',
        color: '#ff6600',
        textShadowColor: '#ff4500',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        fontFamily: Platform.OS === 'ios' ? 'Impact' : 'sans-serif-condensed',
    },
    rankedCourseCard: {
        width: 160,
        height: 240,
        borderRadius: 12,
        overflow: 'hidden',
        zIndex: 1,
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: '#333',
    },
    rankedCourseImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    rankedCourseOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 10,
        paddingBottom: 10,
        paddingTop: 50,
    },
    rankedCourseTitle: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 4,
        lineHeight: 16,
    },
    rankedCourseFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Large vertical course card styles (like web's large prop)
    largeCourseCard: {
        width: 180,
        height: 270,
        marginRight: 12,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: '#333',
    },
    largeCourseImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    largeCourseOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 80,
    },
    largeCourseTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 8,
        lineHeight: 20,
    },
    largeCourseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    // styles for Continue Watching cards
    resumeContainer: {
        marginTop: 8,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginBottom: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ea580c',
        borderRadius: 2,
    },
    resumeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resumeText: {
        color: '#9ca3af',
        fontSize: 10,
    },
    resumeAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    resumeActionText: {
        color: '#ea580c',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
