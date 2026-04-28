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
import { Image } from 'expo-image';
import { ArrowLeft, Heart, Trash2, BookOpen } from 'lucide-react-native';
import favoriteService from '../services/favoritesService';
import CustomAlert from '../components/CustomAlert';

export default function FavoritesScreen({ navigation }) {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        title: '',
        message: '',
        buttons: [],
        type: 'info'
    });

    const showAlert = (title, message, buttons = [{ text: 'Tamam' }], type = 'info') => {
        setAlertConfig({ title, message, buttons, type });
        setAlertVisible(true);
    };

    const loadFavorites = useCallback(async () => {
        setLoading(true);
        const favs = await favoriteService.getFavorites();
        setFavorites(favs);
        setLoading(false);
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadFavorites();
        });
        return unsubscribe;
    }, [navigation, loadFavorites]);

    const handleRemoveFavorite = (courseId, courseTitle) => {
        showAlert(
            'Favoriden Çıkar',
            `"${courseTitle}" kursunu favorilerinizden çıkarmak istiyor musunuz?`,
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Çıkar',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await favoriteService.removeFavorite(courseId);
                        if (result) {
                            // Reload favorites after successful removal
                            loadFavorites();
                        }
                    }
                }
            ],
            'confirm'
        );
    };

    const renderFavoriteItem = ({ item }) => (
        <TouchableOpacity
            style={styles.courseCard}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item.id, initialCourse: item })}
            activeOpacity={0.8}
        >
            <Image
                source={item.imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=400'}
                style={styles.courseImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
            />
            <View style={styles.courseInfo}>
                <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.instructorName}>{item.instructorName}</Text>
                {item.category ? <Text style={styles.categoryText}>{item.category}</Text> : null}
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFavorite(item.id, item.title)}
            >
                <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <Heart size={64} color="#374151" />
            <Text style={styles.emptyTitle}>Henüz Favoriniz Yok</Text>
            <Text style={styles.emptySubtitle}>
                Beğendiğiniz kursları favorilere ekleyerek kolayca erişebilirsiniz
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
                <Text style={styles.headerTitle}>Favorilerim</Text>
                <View style={{ width: 24 }} />
            </View>

            {favorites.length > 0 ? (
                <FlatList
                    data={favorites}
                    renderItem={renderFavoriteItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <EmptyState />
            )}

            <CustomAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
            />
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 6 : 46,
        paddingBottom: 8,
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
    courseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    courseImage: {
        width: 90,
        height: 90,
    },
    courseInfo: {
        flex: 1,
        padding: 12,
    },
    courseTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    instructorName: {
        color: '#9ca3af',
        fontSize: 13,
    },
    categoryText: {
        color: '#ea580c',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 4,
    },
    removeButton: {
        padding: 16,
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
