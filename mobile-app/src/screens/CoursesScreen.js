import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { ChefHat, Star, BookOpen, User } from 'lucide-react-native';
import courseService from '../api/courseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CoursesScreen({ navigation }) {
    const [courses, setCourses] = useState([]);
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
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadCourses();
    };

    const calculateAverageRating = (reviews) => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    const renderCourseItem = ({ item }) => {
        const courseData = item.course || item;
        const imageUrl = courseData.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400';
        const avgRating = calculateAverageRating(courseData.reviews);
        const progress = item.progress || 0;

        return (
            <TouchableOpacity
                style={styles.courseCard}
                onPress={() => navigation.navigate('Learn', { courseId: courseData.id })}
            >
                <Image source={{ uri: imageUrl }} style={styles.courseImage} />
                <View style={styles.courseContent}>
                    <Text style={styles.courseTitle} numberOfLines={2}>{courseData.title}</Text>

                    <View style={styles.instructorContainer}>
                        <ChefHat size={14} color="#9ca3af" />
                        <Text style={styles.instructorText}>{courseData.instructor?.name || 'Eğitmen'}</Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>%{progress} Tamamlandı</Text>

                    <View style={styles.ratingContainer}>
                        <Star size={14} color="#fbbf24" fill="#fbbf24" />
                        <Text style={styles.ratingText}>{avgRating}</Text>
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Kurslarım</Text>
            </View>

            {courses.length > 0 ? (
                <FlatList
                    data={courses}
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
                    <Text style={styles.emptyText}>Henüz bir kursa kayıtlı değilsiniz.</Text>
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
        paddingTop: 60,
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
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    courseCard: {
        flexDirection: 'row',
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        overflow: 'hidden',
    },
    courseImage: {
        width: 100,
        height: 100,
        resizeMode: 'cover',
    },
    courseContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    courseTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    instructorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    instructorText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#1a1a1a',
        borderRadius: 2,
        marginVertical: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#ea580c',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        color: '#9ca3af',
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
