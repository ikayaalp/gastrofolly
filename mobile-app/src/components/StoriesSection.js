import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const STORY_SIZE = 72;

// Dummy stories data - replace with API data later
const DUMMY_STORIES = [
    {
        id: '1',
        title: 'Makarna Yapımı',
        thumbnail: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=200',
        videoUrl: 'https://example.com/story1.mp4',
        viewed: false,
    },
    {
        id: '2',
        title: 'Steak Pişirme',
        thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200',
        videoUrl: 'https://example.com/story2.mp4',
        viewed: false,
    },
    {
        id: '3',
        title: 'Çorba Tarifleri',
        thumbnail: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200',
        videoUrl: 'https://example.com/story3.mp4',
        viewed: true,
    },
    {
        id: '4',
        title: 'Tatlı Sanatı',
        thumbnail: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200',
        videoUrl: 'https://example.com/story4.mp4',
        viewed: false,
    },
    {
        id: '5',
        title: 'Kahvaltı',
        thumbnail: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200',
        videoUrl: 'https://example.com/story5.mp4',
        viewed: true,
    },
];

export default function StoriesSection({ navigation }) {
    const handleStoryPress = (story, index) => {
        navigation.navigate('StoryViewer', {
            stories: DUMMY_STORIES,
            initialIndex: index,
        });
    };

    const renderStory = ({ item, index }) => (
        <TouchableOpacity
            style={styles.storyContainer}
            onPress={() => handleStoryPress(item, index)}
            activeOpacity={0.8}
        >
            {/* Gradient Border */}
            <LinearGradient
                colors={item.viewed
                    ? ['#374151', '#374151']
                    : ['#f59e0b', '#ea580c', '#dc2626', '#db2777', '#9333ea']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBorder}
            >
                <View style={styles.storyImageContainer}>
                    <Image
                        source={{ uri: item.thumbnail }}
                        style={styles.storyImage}
                    />
                    {/* Play Icon Overlay */}
                    <View style={styles.playOverlay}>
                        <Play size={16} color="white" fill="white" />
                    </View>
                </View>
            </LinearGradient>
            <Text style={styles.storyTitle} numberOfLines={1}>
                {item.title}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Hikayeler</Text>
            <FlatList
                data={DUMMY_STORIES}
                renderItem={renderStory}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    listContent: {
        paddingHorizontal: 12,
    },
    storyContainer: {
        alignItems: 'center',
        marginHorizontal: 4,
        width: STORY_SIZE + 16,
    },
    gradientBorder: {
        width: STORY_SIZE + 4,
        height: STORY_SIZE + 4,
        borderRadius: (STORY_SIZE + 4) / 2,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyImageContainer: {
        width: STORY_SIZE,
        height: STORY_SIZE,
        borderRadius: STORY_SIZE / 2,
        backgroundColor: '#000',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#000',
    },
    storyImage: {
        width: '100%',
        height: '100%',
        borderRadius: STORY_SIZE / 2,
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: STORY_SIZE / 2,
    },
    storyTitle: {
        fontSize: 11,
        color: '#d1d5db',
        marginTop: 6,
        textAlign: 'center',
        maxWidth: STORY_SIZE + 8,
    },
});
