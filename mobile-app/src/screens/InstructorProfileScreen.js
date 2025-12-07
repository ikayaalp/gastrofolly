import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, Users, BookOpen, Award } from 'lucide-react-native';
import axios from 'axios';
import config from '../api/config';

const { width } = Dimensions.get('window');

export default function InstructorProfileScreen({ navigation, route }) {
    const { instructorId, instructorName, instructorImage } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [instructor, setInstructor] = useState(null);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        loadInstructorData();
    }, [instructorId]);

    const loadInstructorData = async () => {
        try {
            setLoading(true);

            // Fetch instructor courses
            const response = await axios.get(
                `${config.API_BASE_URL}/api/courses?instructorId=${instructorId}`
            );

            // Get courses where instructor matches
            const instructorCourses = response.data.filter(
                c => c.instructor?.id === instructorId || c.instructorId === instructorId
            );

            setCourses(instructorCourses);

            // Get instructor info from first course
            if (instructorCourses.length > 0 && instructorCourses[0].instructor) {
                setInstructor(instructorCourses[0].instructor);
            }
        } catch (error) {
            console.log('Load instructor error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTotalStudents = () => {
        return courses.reduce((sum, course) => sum + (course._count?.enrollments || 0), 0);
    };

    const getAverageRating = () => {
        const ratings = courses.filter(c => c.averageRating > 0);
        if (ratings.length === 0) return 0;
        return (ratings.reduce((sum, c) => sum + c.averageRating, 0) / ratings.length).toFixed(1);
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
            <StatusBar barStyle="light-content" />

            {/* Header with Gradient */}
            <LinearGradient
                colors={['#ea580c', '#dc2626']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>

                {/* Instructor Info */}
                <View style={styles.instructorInfo}>
                    {instructorImage ? (
                        <Image source={{ uri: instructorImage }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {(instructorName || instructor?.name || 'E').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.instructorNameLarge}>
                        {instructorName || instructor?.name || 'Eğitmen'}
                    </Text>
                    <Text style={styles.instructorBio}>
                        Profesyonel Eğitmen
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <BookOpen size={20} color="white" />
                        <Text style={styles.statValue}>{courses.length}</Text>
                        <Text style={styles.statLabel}>Kurs</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Users size={20} color="white" />
                        <Text style={styles.statValue}>{getTotalStudents()}</Text>
                        <Text style={styles.statLabel}>Öğrenci</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Star size={20} color="white" fill="white" />
                        <Text style={styles.statValue}>{getAverageRating()}</Text>
                        <Text style={styles.statLabel}>Puan</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Courses Section */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Eğitmenin Kursları</Text>

                {courses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <BookOpen size={48} color="#4b5563" />
                        <Text style={styles.emptyText}>Henüz kurs bulunmuyor</Text>
                    </View>
                ) : (
                    courses.map((course) => (
                        <TouchableOpacity
                            key={course.id}
                            style={styles.courseCard}
                            onPress={() => navigation.navigate('Learn', {
                                courseId: course.id,
                                courseTitle: course.title
                            })}
                        >
                            {course.imageUrl && (
                                <Image
                                    source={{ uri: course.imageUrl }}
                                    style={styles.courseThumbnail}
                                />
                            )}
                            <View style={styles.courseInfo}>
                                <Text style={styles.courseTitle} numberOfLines={2}>
                                    {course.title}
                                </Text>
                                <View style={styles.courseMeta}>
                                    <View style={styles.ratingContainer}>
                                        <Star size={14} color="#fbbf24" fill="#fbbf24" />
                                        <Text style={styles.ratingText}>
                                            {course.averageRating?.toFixed(1) || '0.0'}
                                        </Text>
                                    </View>
                                    <Text style={styles.studentsText}>
                                        {course._count?.enrollments || 0} öğrenci
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
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
        marginTop: 16,
        fontSize: 16,
    },
    headerGradient: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    instructorInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'white',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        marginBottom: 16,
    },
    avatarText: {
        color: 'white',
        fontSize: 40,
        fontWeight: 'bold',
    },
    instructorNameLarge: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    instructorBio: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: '#6b7280',
        marginTop: 16,
        fontSize: 16,
    },
    courseCard: {
        flexDirection: 'row',
        backgroundColor: '#111',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    courseThumbnail: {
        width: 100,
        height: 80,
    },
    courseInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    courseTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 8,
    },
    courseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: '#fbbf24',
        fontSize: 13,
        fontWeight: '600',
    },
    studentsText: {
        color: '#9ca3af',
        fontSize: 13,
    },
});
