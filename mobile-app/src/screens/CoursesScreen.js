import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ChefHat, Star, BookOpen } from 'lucide-react-native';
import courseService from '../api/courseService';

export default function CoursesScreen({ navigation }) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadCourses = async () => {
        try {
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
        const progress = item.progress || 0; // Assuming progress is part of enrollment data

        return (
            <TouchableOpacity
                style={styles.courseCard}
                onPress={() => {/* Navigate to course detail */ }}
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
        paddingHorizontal: 20,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100, // Bottom nav space
    },
    courseCard: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        height: 120,
    },
    courseImage: {
        width: 120,
        height: '100%',
        resizeMode: 'cover',
    },
    courseContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    courseTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    instructorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    instructorText: {
        color: '#9ca3af',
        fontSize: 12,
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#374151',
        borderRadius: 2,
        marginBottom: 4,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#ea580c',
        borderRadius: 2,
    },
    progressText: {
        color: '#9ca3af',
        fontSize: 10,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: '#d1d5db',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    browseButton: {
        backgroundColor: '#ea580c',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    browseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
