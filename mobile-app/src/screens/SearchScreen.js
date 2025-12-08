import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Platform,
    Keyboard
} from 'react-native';
import { Search, X, ArrowLeft, Star, ChevronRight, User } from 'lucide-react-native';
import courseService from '../api/courseService';

export default function SearchScreen({ navigation }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const searchTimeout = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        // Auto-focus input on mount
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleSearch = (text) => {
        setQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (text.trim().length === 0) {
            setResults([]);
            return;
        }

        setLoading(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const response = await courseService.searchCourses(text);
                if (response.success) {
                    setResults(response.data);
                } else {
                    setResults([]);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }, 500); // 500ms debounce
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        inputRef.current?.focus();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
        >
            <View style={styles.thumbnailContainer}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
                ) : (
                    <View style={styles.thumbnailPlaceholder}>
                        <Search size={20} color="#374151" />
                    </View>
                )}
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.itemMeta}>
                    <View style={styles.instructorRow}>
                        <User size={12} color="#9ca3af" />
                        <Text style={styles.instructorText} numberOfLines={1}>
                            {item.instructor?.name || 'Eğitmen'}
                        </Text>
                    </View>
                    {item.averageRating > 0 && (
                        <View style={styles.ratingRow}>
                            <Star size={12} color="#fbbf24" fill="#fbbf24" />
                            <Text style={styles.ratingText}>{item.averageRating?.toFixed(1)}</Text>
                        </View>
                    )}
                </View>
            </View>
            <ChevronRight size={20} color="#374151" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <View style={styles.container}>
                {/* Header / Search Bar */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            Keyboard.dismiss();
                            navigation.goBack();
                        }}
                    >
                        <ArrowLeft size={24} color="#9ca3af" />
                    </TouchableOpacity>

                    <View style={styles.searchBar}>
                        <Search size={20} color="#9ca3af" style={styles.searchIcon} />
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Kurs, eğitmen veya konu ara..."
                            placeholderTextColor="#6b7280"
                            value={query}
                            onChangeText={handleSearch}
                            returnKeyType="search"
                            selectionColor="#ea580c"
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                                <X size={16} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="small" color="#ea580c" />
                        </View>
                    ) : results.length > 0 ? (
                        <FlatList
                            data={results}
                            renderItem={renderItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        />
                    ) : query.length > 0 ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
                            <Text style={styles.emptySubtext}>Farklı anahtar kelimeler deneyin</Text>
                        </View>
                    ) : (
                        <View style={styles.centerContainer}>
                            <Search size={48} color="#1f2937" />
                            <Text style={styles.emptyText}>Ne öğrenmek istersin?</Text>
                            <Text style={styles.emptySubtext}>Favori yemeklerini ve şeflerini ara</Text>
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 16 : 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        height: '100%',
    },
    clearButton: {
        backgroundColor: '#374151',
        padding: 4,
        borderRadius: 12,
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#111',
    },
    thumbnailContainer: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#111',
        overflow: 'hidden',
        marginRight: 16,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbnailPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1f2937',
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    itemTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 6,
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    instructorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    instructorText: {
        color: '#9ca3af',
        fontSize: 13,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: '#9ca3af',
        fontSize: 12,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100, // Offset for keyboard or perception
    },
    emptyText: {
        color: '#d1d5db',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 8,
    },
});
