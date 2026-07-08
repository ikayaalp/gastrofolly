import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Modal,
    ScrollView,
    RefreshControl,
    Platform,
    Dimensions,
    TextInput,
    Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Calendar,
    Users,
    Heart,
    FileText,
    UserPlus,
    UserCheck,
    MessageCircle,
    ChefHat,
    X,
    User,
    Pencil,
    Check,
    Settings,
    Trash2,
    ShieldAlert,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import forumService from '../api/forumService';
import authService from '../api/authService';
import TopicCard from '../components/TopicCard';
import ImageViewerModal from '../components/ImageViewerModal';

const { width } = Dimensions.get('window');
const COVER_HEIGHT = 160;
const AVATAR_SIZE = 90;


function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const past = new Date(dateStr);
    const diff = Math.floor((now - past) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
    return formatDate(dateStr);
}

export default function ChefSocialProfileScreen({ navigation, route }) {
    const { userId } = route.params || {};
    const insets = useSafeAreaInsets();

    const [profile, setProfile] = useState(null);
    const [topics, setTopics] = useState([]);
    const [likedTopics, setLikedTopics] = useState([]);
    const [savedTopics, setSavedTopics] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [followListModal, setFollowListModal] = useState(null);
    const [followListData, setFollowListData] = useState([]);
    const [followListLoading, setFollowListLoading] = useState(false);
    const [bioEditing, setBioEditing] = useState(false);
    const [bioText, setBioText] = useState('');
    const [bioSaving, setBioSaving] = useState(false);
    const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null);

    // Load saved topics from AsyncStorage
    const loadSavedTopics = useCallback(async () => {
        try {
            const saved = await AsyncStorage.getItem('chef-saved-topics');
            setSavedTopics(saved ? JSON.parse(saved) : []);
        } catch { setSavedTopics([]); }
    }, []);

    const toggleSave = useCallback(async (topicId) => {
        setSavedTopics(prev => {
            const next = prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId];
            AsyncStorage.setItem('chef-saved-topics', JSON.stringify(next));
            return next;
        });
    }, []);

    const loadProfile = useCallback(async (pageNum = 1, isRefresh = false) => {
        if (!userId) return;
        try {
            if (pageNum === 1 && !isRefresh) setLoading(true);
            if (pageNum > 1) setLoadingMore(true);

            const result = await forumService.getUserProfile(userId, pageNum);
            if (result.success) {
                const data = result.data;
                setProfile(data.user);
                setBioText(data.user.bio || '');
                setIsFollowing(data.isFollowing);
                setIsOwnProfile(data.isOwnProfile);

                if (pageNum === 1 || isRefresh) {
                    setTopics(data.topics || []);
                } else {
                    setTopics(prev => [...prev, ...(data.topics || [])]);
                }
                setHasMore(data.pagination.page < data.pagination.pages);
                setPage(pageNum);
            }
        } catch (e) {
            console.error('Profile load error:', e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [userId]);

    const loadLikedTopics = useCallback(async () => {
        const result = await forumService.getLikedTopics();
        if (result.success) {
            setLikedTopics(result.data.likedTopicIds || []);
        }
    }, []);

    const loadCurrentUser = useCallback(async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user?.id) setCurrentUserId(user.id);
        } catch { }
    }, []);

    useEffect(() => {
        loadCurrentUser();
        loadProfile(1);
        loadLikedTopics();
        loadSavedTopics();
    }, [userId]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadProfile(1, true);
        loadLikedTopics();
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            loadProfile(page + 1);
        }
    };

    const handleFollow = async () => {
        if (!currentUserId) {
            navigation.navigate('Login');
            return;
        }
        setFollowLoading(true);
        const prevFollowing = isFollowing;
        // Optimistic update
        setIsFollowing(!isFollowing);
        setProfile(prev => prev ? {
            ...prev,
            followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
        } : prev);

        const result = await forumService.toggleFollow(userId);
        if (!result.success) {
            // Revert on failure
            setIsFollowing(prevFollowing);
            setProfile(prev => prev ? {
                ...prev,
                followersCount: isFollowing ? prev.followersCount : prev.followersCount - 1
            } : prev);
        }
        setFollowLoading(false);
    };

    const saveBio = async () => {
        if (!bioText.trim() && !profile?.bio) { setBioEditing(false); return; }
        setBioSaving(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`${require('../api/config').default.API_BASE_URL}/api/user/update-profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ bio: bioText.trim() }),
            });
            if (response.ok) {
                setProfile(prev => prev ? { ...prev, bio: bioText.trim() } : prev);
            }
        } catch (e) {
            console.error('Bio save error:', e);
        } finally {
            setBioSaving(false);
            setBioEditing(false);
        }
    };

    const handleLike = async (topicId) => {
        if (!currentUserId) {
            navigation.navigate('Login');
            return;
        }
        const wasLiked = likedTopics.includes(topicId);
        setLikedTopics(prev =>
            wasLiked ? prev.filter(id => id !== topicId) : [...prev, topicId]
        );
        setTopics(prev => prev.map(t =>
            t.id === topicId ? { ...t, likeCount: wasLiked ? Math.max(0, (t.likeCount || 0) - 1) : (t.likeCount || 0) + 1 } : t
        ));
        await forumService.likeTopic(topicId);
    };

    const openFollowList = async (type) => {
        setFollowListModal(type);
        setFollowListLoading(true);
        setFollowListData([]);
        const result = await forumService.getFollowList(userId, type);
        if (result.success) {
            setFollowListData(result.data.users || []);
        }
        setFollowListLoading(false);
    };

    const handleDeleteTopic = (topicItem) => {
        Alert.alert(
            'Gönderiyi Sil',
            'Bu gönderiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await forumService.deleteTopic(topicItem.id);
                        if (result.success) {
                            setTopics(prev => prev.filter(t => t.id !== topicItem.id));
                            if (profile) {
                                setProfile(prev => ({ ...prev, topicsCount: Math.max(0, (prev.topicsCount || 0) - 1) }));
                            }
                            Alert.alert('Başarılı', 'Gönderi silindi.');
                        } else {
                            Alert.alert('Hata', result.error || 'Gönderi silinemedi.');
                        }
                    }
                }
            ]
        );
    };

    const navigateToProfile = (uid) => {
        if (!uid) return;
        setFollowListModal(null);
        // Navigate to same screen with new userId
        navigation.push('ChefSocialProfile', { userId: uid });
    };

    // Render header (profile info)
    const renderHeader = () => {
        if (!profile) return null;

        return (
            <View>
                {/* Cover Image */}
                <View style={styles.coverContainer}>
                    {profile.coverImage ? (
                        <Image
                            source={{ uri: profile.coverImage }}
                            style={styles.coverImage}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <View style={styles.coverFallback}>
                            <ChefHat size={48} color="rgba(255,255,255,0.15)" />
                        </View>
                    )}
                </View>

                {/* Avatar + Action Button Row */}
                <View style={styles.avatarActionRow}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        activeOpacity={profile.image ? 0.8 : 1}
                        onPress={() => { if (profile.image) setFullscreenImageUrl(profile.image); }}
                    >
                        {profile.image ? (
                            <Image
                                source={{ uri: profile.image }}
                                style={styles.avatar}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Text style={styles.avatarFallbackText}>
                                    {(profile.name || 'U')[0].toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Follow / Edit button */}
                    {isOwnProfile ? (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Text style={styles.editButtonText}>Profili Düzenle</Text>
                        </TouchableOpacity>
                    ) : currentUserId ? (
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <TouchableOpacity
                                style={[styles.followButton, isFollowing && styles.followingButton]}
                                onPress={handleFollow}
                                disabled={followLoading}
                            >
                                {followLoading ? (
                                    <ActivityIndicator size="small" color={isFollowing ? '#ea580c' : '#fff'} />
                                ) : isFollowing ? (
                                    <>
                                        <UserCheck size={16} color="#ea580c" />
                                        <Text style={styles.followingButtonText}>Takip Ediliyor</Text>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={16} color="#fff" />
                                        <Text style={styles.followButtonText}>Takip Et</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.messageButton}
                                onPress={() => navigation.navigate('Chat', { otherUserId: userId, otherUser: profile })}
                            >
                                <MessageCircle size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.followButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <UserPlus size={16} color="#fff" />
                            <Text style={styles.followButtonText}>Takip Et</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Name */}
                <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.profileName}>{profile.name}</Text>
                    </View>

                    {/* Join Date */}
                    <View style={styles.joinRow}>
                        <Calendar size={13} color="#6b7280" />
                        <Text style={styles.joinText}>{formatDate(profile.createdAt)} tarihinde katıldı</Text>
                    </View>

                    {/* Bio */}
                    {isOwnProfile ? (
                        bioEditing ? (
                            <View style={styles.bioEditContainer}>
                                <TextInput
                                    style={styles.bioInput}
                                    value={bioText}
                                    onChangeText={setBioText}
                                    placeholder="Kendinizi tanıtın..."
                                    placeholderTextColor="#4b5563"
                                    multiline
                                    maxLength={160}
                                    autoFocus
                                />
                                <View style={styles.bioEditActions}>
                                    <Text style={styles.bioCharCount}>{bioText.length}/160</Text>
                                    <TouchableOpacity onPress={() => { setBioEditing(false); setBioText(profile?.bio || ''); }} style={styles.bioCancelBtn}>
                                        <X size={16} color="#6b7280" />
                                        <Text style={styles.bioCancelText}>Vazgeç</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={saveBio} disabled={bioSaving} style={styles.bioSaveBtn}>
                                        {bioSaving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#fff" />}
                                        <Text style={styles.bioSaveText}>Kaydet</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.bioEditableRow} onPress={() => setBioEditing(true)}>
                                {profile?.bio ? (
                                    <Text style={styles.bio}>{profile.bio}</Text>
                                ) : (
                                    <Text style={styles.bioPlaceholder}>Biyografi ekle...</Text>
                                )}
                                <Pencil size={14} color="#4b5563" style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        )
                    ) : (
                        profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null
                    )}

                    {/* Follow Stats */}
                    <View style={styles.followStats}>
                        <TouchableOpacity style={styles.followStat} onPress={() => openFollowList('following')}>
                            <Text style={styles.followStatNumber}>{profile.followingCount ?? 0}</Text>
                            <Text style={styles.followStatLabel}> Takip</Text>
                        </TouchableOpacity>
                        <View style={styles.followStatDivider} />
                        <TouchableOpacity style={styles.followStat} onPress={() => openFollowList('followers')}>
                            <Text style={styles.followStatNumber}>{profile.followersCount ?? 0}</Text>
                            <Text style={styles.followStatLabel}> Takipçi</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tab Header */}
                <View style={styles.tabHeader}>
                    <View style={styles.tabActive}>
                        <Text style={styles.tabActiveText}>Gönderiler</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <MessageCircle size={48} color="#374151" />
            <Text style={styles.emptyTitle}>Henüz gönderi yok</Text>
            <Text style={styles.emptySubtitle}>Bu kullanıcı henüz bir şey paylaşmadı.</Text>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#ea580c" />
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>Kullanıcı bulunamadı.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: 0 }]}>
            {/* Fixed Navbar */}
            <View style={[styles.navbar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBack}>
                    <ArrowLeft size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.navTitleContainer}>
                    <Text style={styles.navTitle} numberOfLines={1}>{profile.name}</Text>
                    <Text style={styles.navSubtitle}>{profile.topicsCount ?? 0} gönderi</Text>
                </View>
                {isOwnProfile ? (
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.navSettings}>
                        <Settings size={22} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 44 }} />
                )}
            </View>

            <FlatList
                data={topics}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TopicCard
                        item={item}
                        onPress={() => navigation.navigate('TopicDetail', { topicId: item.id })}
                        onLike={() => handleLike(item.id)}
                        isLiked={likedTopics.includes(item.id)}
                        onSave={() => toggleSave(item.id)}
                        isSaved={savedTopics.includes(item.id)}
                        formatTimeAgo={formatTimeAgo}
                        onAuthorPress={(authorId) => {
                            if (authorId && authorId !== userId) {
                                navigation.push('ChefSocialProfile', { userId: authorId });
                            }
                        }}
                        currentUserId={currentUserId}
                        onEdit={(topicItem) => navigation.navigate('EditTopic', { topic: topicItem })}
                        onDelete={handleDeleteTopic}
                    />
                )}
                ListHeaderComponent={renderHeader()}
                ListEmptyComponent={!loading ? renderEmpty : null}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#ea580c"
                        colors={['#ea580c']}
                    />
                }
                contentContainerStyle={{
                    paddingTop: insets.top + 52,
                    paddingBottom: 100,
                }}
                showsVerticalScrollIndicator={false}
            />

            {/* Follow List Modal */}
            <Modal
                visible={!!followListModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFollowListModal(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.followModal}>
                        <View style={styles.followModalHeader}>
                            <Text style={styles.followModalTitle}>
                                {followListModal === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                            </Text>
                            <TouchableOpacity onPress={() => setFollowListModal(null)}>
                                <X size={22} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {followListLoading ? (
                            <View style={styles.centered}>
                                <ActivityIndicator size="large" color="#ea580c" />
                            </View>
                        ) : followListData.length === 0 ? (
                            <View style={styles.centered}>
                                <Text style={styles.emptySubtitle}>Henüz kimse yok.</Text>
                            </View>
                        ) : (
                            <ScrollView>
                                {followListData.map(user => (
                                    <TouchableOpacity
                                        key={user.id}
                                        style={styles.followListItem}
                                        onPress={() => navigateToProfile(user.id)}
                                    >
                                        <View style={styles.followListAvatar}>
                                            {user.image ? (
                                                <Image
                                                    source={{ uri: user.image }}
                                                    style={styles.followListAvatarImg}
                                                    contentFit="cover"
                                                />
                                            ) : (
                                                <User size={20} color="#fff" />
                                            )}
                                        </View>
                                        <View style={styles.followListInfo}>
                                            <Text style={styles.followListName}>{user.name}</Text>
                                            {user.bio ? (
                                                <Text style={styles.followListBio} numberOfLines={1}>{user.bio}</Text>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
            
            <ImageViewerModal
                visible={!!fullscreenImageUrl}
                imageUrl={fullscreenImageUrl}
                onClose={() => setFullscreenImageUrl(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Navbar
    navbar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    navBack: {
        padding: 6,
        marginRight: 10,
    },
    navTitleContainer: {
        flex: 1,
    },
    navTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    navSubtitle: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 1,
    },
    navSettings: {
        padding: 6,
        marginLeft: 10,
    },

    // Cover
    coverContainer: {
        height: COVER_HEIGHT,
        width: '100%',
        backgroundColor: '#1a1a1a',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverFallback: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    // Avatar + Action
    avatarActionRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginTop: -(AVATAR_SIZE / 2),
        marginBottom: 12,
    },
    avatarContainer: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 3,
        borderColor: '#000',
        overflow: 'hidden',
        backgroundColor: '#1f2937',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarFallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ea580c',
    },
    avatarFallbackText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '700',
    },

    // Buttons
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ea580c',
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 20,
        marginBottom: 4,
    },
    followButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    followingButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#ea580c',
    },
    followingButtonText: {
        color: '#ea580c',
        fontSize: 14,
        fontWeight: '600',
    },
    editButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#374151',
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 20,
        marginBottom: 4,
    },
    editButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    messageButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ea580c',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Profile info
    profileInfo: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    profileName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    joinRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 8,
    },
    joinText: {
        color: '#6b7280',
        fontSize: 13,
    },
    bio: {
        color: '#d1d5db',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    bioEditableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    bioPlaceholder: {
        color: '#6b7280',
        fontSize: 14,
        fontStyle: 'italic',
    },
    bioEditContainer: {
        marginBottom: 12,
        backgroundColor: '#000',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#374151',
    },
    bioInput: {
        color: '#fff',
        fontSize: 14,
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 8,
    },
    bioEditActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 12,
    },
    bioCharCount: {
        color: '#6b7280',
        fontSize: 12,
        flex: 1,
    },
    bioCancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    bioCancelText: {
        color: '#9ca3af',
        fontSize: 13,
        fontWeight: '600',
    },
    bioSaveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ea580c',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    bioSaveText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },

    // Follow stats
    followStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    followStat: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    followStatNumber: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    followStatLabel: {
        color: '#6b7280',
        fontSize: 14,
    },
    followStatDivider: {
        width: 1,
        height: 14,
        backgroundColor: '#374151',
        marginHorizontal: 12,
    },

    // Stat cards
    statCards: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 4,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#1f2937',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 4,
    },
    statCardNumber: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    statCardLabel: {
        color: '#6b7280',
        fontSize: 11,
    },

    // Tab
    tabHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
        marginTop: 16,
        paddingHorizontal: 16,
    },
    tabActive: {
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#ea580c',
    },
    tabActiveText: {
        color: '#ea580c',
        fontSize: 15,
        fontWeight: '600',
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        color: '#9ca3af',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    emptySubtitle: {
        color: '#6b7280',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 4,
    },

    loadingMore: {
        paddingVertical: 16,
        alignItems: 'center',
    },

    errorText: {
        color: '#9ca3af',
        fontSize: 16,
        marginBottom: 16,
    },
    backBtn: {
        backgroundColor: '#ea580c',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    backBtnText: {
        color: '#fff',
        fontWeight: '600',
    },

    // Follow List Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    followModal: {
        backgroundColor: '#111',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '75%',
        minHeight: 300,
        paddingBottom: 32,
    },
    followModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937',
    },
    followModalTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    followListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    followListAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1f2937',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    followListAvatarImg: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    followListInfo: {
        flex: 1,
    },
    followListName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    followListBio: {
        color: '#6b7280',
        fontSize: 13,
        marginTop: 2,
    },
});
