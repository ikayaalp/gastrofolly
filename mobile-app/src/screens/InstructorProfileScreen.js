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
    Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, Users, BookOpen, Award, Share2, Play } from 'lucide-react-native';
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

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${instructorName || instructor?.name || 'Eğitmen'} profilini incele!`,
                // url: `https://gastrofolly.com/instructor/${instructorId}` // Web URL if available
            });
        } catch (error) {
            console.log(error.message);
        }
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

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                >
                    <Share2 size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {instructorImage ? (
                            <Image source={{ uri: instructorImage }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {(instructorName || instructor?.name || 'E').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.onlineIndicator} />
                    </View>

                    <Text style={styles.instructorNameLarge}>
                        {instructorName || instructor?.name || 'Eğitmen'}
                    </Text>
                    <Text style={styles.instructorTitle}>Profesyonel Eğitmen</Text>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{courses.length}</Text>
                            <Text style={styles.statLabel}>KURS</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{getTotalStudents()}</Text>
                            <Text style={styles.statLabel}>ÖĞRENCİ</Text>
                        </View>
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.aboutCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Users size={20} color="#ea580c" />
                        </View>
                        <Text style={styles.cardTitle}>Hakkında</Text>
                    </View>
                    <Text style={styles.bioText}>
                        {instructor?.name || 'Eğitmen'} deneyimli bir eğitmen olarak gastronomi dünyasında önemli bir yer edinmiştir.
                        Profesyonel mutfak deneyimi ve öğretme tutkusu ile öğrencilerine en iyi eğitimi sunmaktadır.
                    </Text>
                </View>

                {/* Courses Section */}
                <View style={styles.coursesSection}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <BookOpen size={20} color="#ea580c" />
                        </View>
                        <Text style={styles.cardTitle}>Yayınlanan Kurslar</Text>
                        <Text style={styles.courseCountBadge}>{courses.length} kurs</Text>
                    </View>

                    {courses.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <BookOpen size={48} color="#374151" />
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
                                {course.imageUrl ? (
                                    <Image
                                        source={{ uri: course.imageUrl }}
                                        style={styles.courseThumbnail}
                                    />
                                ) : (
                                    <View style={styles.courseThumbnailPlaceholder}>
                                        <BookOpen size={32} color="#ea580c" />
                                    </View>
                                )}

                                <View style={styles.courseOverlay}>
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryText}>{course.category?.name || 'Genel'}</Text>
                                    </View>
                                </View>

                                <View style={styles.courseInfo}>
                                    <Text style={styles.courseTitle} numberOfLines={2}>
                                        {course.title}
                                    </Text>

                                    <View style={styles.courseMeta}>
                                        <View style={styles.metaItem}>
                                            <Play size={14} color="#ea580c" />
                                            <Text style={styles.metaText}>{course._count?.lessons || 0} Ders</Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Users size={14} color="#ea580c" />
                                            <Text style={styles.metaText}>{course._count?.enrollments || 0}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.courseFooter}>
                                        <View style={styles.playButtonCircle}>
                                            <Play size={16} color="white" fill="white" />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
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
    },

    // Profile Card
    profileCard: {
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        marginBottom: 16,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'rgba(234, 88, 12, 0.5)',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(234, 88, 12, 0.5)',
    },
    avatarText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#22c55e', // Green
        borderWidth: 2,
        borderColor: '#0a0a0a',
    },
    instructorNameLarge: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    instructorTitle: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
        width: '100%',
    },
    statBox: {
        flex: 1,
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    statValue: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        color: '#6b7280',
        fontSize: 11,
        fontWeight: 'bold',
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ea580c',
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    messageButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },

    // About Card
    aboutCard: {
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        padding: 8,
        borderRadius: 8,
        marginRight: 12,
    },
    cardTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    bioText: {
        color: '#9ca3af',
        fontSize: 14,
        lineHeight: 22,
    },

    // Courses Section
    coursesSection: {
        marginBottom: 20,
    },
    courseCountBadge: {
        color: '#6b7280',
        fontSize: 13,
    },
    emptyContainer: {
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#4b5563',
        marginTop: 12,
        fontSize: 15,
    },
    courseCard: {
        backgroundColor: '#0a0a0a',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    courseThumbnail: {
        width: '100%',
        height: 180,
    },
    courseThumbnailPlaceholder: {
        width: '100%',
        height: 180,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
    },
    courseOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
    },
    categoryBadge: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    categoryText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    courseInfo: {
        padding: 16,
    },
    courseTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        lineHeight: 22,
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
        gap: 6,
    },
    metaText: {
        color: '#9ca3af',
        fontSize: 13,
    },
    courseFooter: {
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
        paddingTop: 12,
        alignItems: 'flex-end',
    },
    playButtonCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
