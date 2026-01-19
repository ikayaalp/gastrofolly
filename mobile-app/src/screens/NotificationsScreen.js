import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform, StatusBar, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bell, ChefHat, MessageCircle, Star, Info } from 'lucide-react-native';
import notificationService from '../api/notificationService';
import { useFocusEffect } from '@react-navigation/native';

export default function NotificationsScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const loadNotifications = async () => {
        const result = await notificationService.getNotifications();
        if (result.success) {
            setNotifications(result.data.notifications || []);
        } else {
            console.log('Failed to load notifications:', result.error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const handleNotificationPress = async (notification) => {
        console.log('Notification pressed:', JSON.stringify(notification, null, 2));

        if (!notification.read) {
            await notificationService.markAsRead(notification.id);
            // Update local state to show as read immediately
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
            );
        }

        // Robustly check for courseId in different possible locations
        // Backend API sends top-level courseId. Push notifications often wrap in data.
        const courseId = notification.courseId || notification.data?.courseId;

        // Navigate based on type
        if (courseId) {
            console.log('Navigating to CourseDetail with courseId:', courseId);
            navigation.navigate('CourseDetail', { courseId });
        } else if (notification.data?.topicId) {
            // Forum topic navigation if you have the stack setup
            // navigation.navigate('Social', { screen: 'TopicDetail', params: { topicId: notification.data.topicId }});
        } else {
            console.log('No navigation target found in notification object');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'course':
                return <ChefHat size={24} color="#ea580c" />;
            case 'reply':
                return <MessageCircle size={24} color="#3b82f6" />;
            case 'discount':
                return <Star size={24} color="#eab308" />;
            default:
                return <Bell size={24} color="#9ca3af" />;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.notificationItem, !item.read && styles.unreadItem]}
            activeOpacity={0.7}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={styles.iconContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.notificationImage} />
                ) : (
                    <View style={styles.iconPlaceholder}>
                        {getIcon(item.type)}
                    </View>
                )}
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
                    <Text style={styles.createdAt}>{new Date(item.createdAt).toLocaleDateString('tr-TR')}</Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    const handleMarkAllRead = async () => {
        setLoading(true);
        const result = await notificationService.markAllNotificationsAsRead();
        if (result.success) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } else {
            console.log("Failed to mark all read");
        }
        setLoading(false);
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bildirimler</Text>

                <TouchableOpacity onPress={handleMarkAllRead} style={styles.markReadButton}>
                    <Ionicons name="checkmark-done-circle-outline" size={24} color="#ea580c" />
                </TouchableOpacity>
            </View>

            {notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
                    }
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Bell size={64} color="#374151" />
                    <Text style={styles.emptyText}>Henüz bildiriminiz yok</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    listContent: {
        padding: 16,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        alignItems: 'center',
    },
    unreadItem: {
        backgroundColor: 'rgba(234, 88, 12, 0.05)',
        borderColor: 'rgba(234, 88, 12, 0.2)',
    },
    iconContainer: {
        marginRight: 16,
    },
    iconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1a1a1a',
    },
    contentContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#e5e5e5',
        flex: 1,
        marginRight: 8,
    },
    unreadText: {
        color: 'white',
    },
    createdAt: {
        fontSize: 12,
        color: '#6b7280',
    },
    message: {
        fontSize: 13,
        color: '#9ca3af',
        lineHeight: 18,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ea580c',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        color: '#6b7280',
        fontSize: 16,
    },
});
