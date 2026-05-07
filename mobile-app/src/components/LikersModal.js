import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { X, User, ThumbsUp } from 'lucide-react-native';
import forumService from '../api/forumService';

export default function LikersModal({ visible, onClose, type, targetId, likeCount }) {
    const [likers, setLikers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (visible && targetId) {
            loadLikers();
        }
        return () => {
            setLikers([]);
            setError(null);
        };
    }, [visible, targetId]);

    const loadLikers = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = type === 'topic'
                ? await forumService.getTopicLikers(targetId)
                : await forumService.getPostLikers(targetId);

            if (result.success) {
                setLikers(result.data.likers || []);
            } else {
                setError('Beğenenler yüklenemedi');
            }
        } catch (err) {
            console.error('Error loading likers:', err);
            setError('Beğenenler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.likerRow}>
            <View style={styles.avatarContainer}>
                {item.image ? (
                    <Image
                        source={item.image}
                        style={styles.avatar}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <User size={18} color="#9ca3af" />
                    </View>
                )}
            </View>
            <View style={styles.likerInfo}>
                <Text style={styles.likerName}>{item.name || 'Anonim'}</Text>
            </View>
            <ThumbsUp size={14} color="#ea580c" fill="#ea580c" />
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <ThumbsUp size={20} color="#ea580c" />
                            <Text style={styles.headerTitle}>Beğenenler</Text>
                            {likeCount > 0 && (
                                <View style={styles.countBadge}>
                                    <Text style={styles.countBadgeText}>{likeCount}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={22} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color="#ea580c" />
                            <Text style={styles.loadingText}>Yükleniyor...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.centerContent}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity onPress={loadLikers}>
                                <Text style={styles.retryText}>Tekrar Dene</Text>
                            </TouchableOpacity>
                        </View>
                    ) : likers.length === 0 ? (
                        <View style={styles.centerContent}>
                            <ThumbsUp size={40} color="#374151" />
                            <Text style={styles.emptyText}>Henüz beğenen yok</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={likers}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#0a0a0a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '65%',
        minHeight: 300,
        borderWidth: 1,
        borderColor: '#1f2937',
        borderBottomWidth: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        color: '#e5e7eb',
        fontSize: 18,
        fontWeight: 'bold',
    },
    countBadge: {
        backgroundColor: 'rgba(234, 88, 12, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    countBadgeText: {
        color: '#ea580c',
        fontSize: 12,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 6,
        borderRadius: 20,
        backgroundColor: '#1f2937',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
        gap: 12,
    },
    loadingText: {
        color: '#6b7280',
        fontSize: 14,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
    },
    retryText: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 14,
        marginTop: 8,
    },
    listContent: {
        paddingBottom: 40,
    },
    likerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#1f2937',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#374151',
    },
    likerInfo: {
        flex: 1,
    },
    likerName: {
        color: '#e5e7eb',
        fontSize: 15,
        fontWeight: '600',
    },
    likerTime: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 2,
    },
});
