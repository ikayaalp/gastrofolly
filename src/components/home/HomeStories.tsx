"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronLeft, ChevronRight, Plus, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getOptimizedMediaUrl } from '@/lib/utils';

interface Story {
    id: string;
    title?: string;
    mediaUrl: string;
    mediaType: string;
    duration: number;
    courseId?: string;
    course?: { title: string };
    creator: { name: string; image?: string };
    createdAt: string;
}

interface StoryGroup {
    id: string; // Use string for unique key from map
    user: {
        name: string;
        avatar: string;
    };
    stories: Story[];
}

interface StoryViewerProps {
    stories: StoryGroup[];
    initialIndex: number;
    onClose: () => void;
}

const StoryViewer = ({ stories, initialIndex, onClose }: StoryViewerProps) => {
    const router = useRouter();
    const [currentGroupIndex, setCurrentGroupIndex] = useState(initialIndex);
    const [internalStoryIndex, setInternalStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);

    const currentGroup = stories[currentGroupIndex];
    const currentStory = currentGroup?.stories[internalStoryIndex];

    useEffect(() => {
        if (!currentGroup) return;
        setInternalStoryIndex(0);
        setProgress(0);
    }, [currentGroupIndex]);

    useEffect(() => {
        if (!currentStory) return;
        setProgress(0);
        startProgress();
        return () => stopProgress();
    }, [currentStory]); // Remove unnecessary deps to avoid restart bugs

    const startProgress = () => {
        stopProgress();
        const duration = currentStory?.duration || 5000;
        const intervalTime = 50;
        const step = 100 / (duration / intervalTime);

        progressInterval.current = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    stopProgress();
                    handleNext();
                    return 100;
                }
                return prev + step;
            });
        }, intervalTime);
    };

    const stopProgress = () => {
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
        }
    };

    const handleNext = () => {
        // Check if there are more stories in current group
        if (internalStoryIndex < currentGroup.stories.length - 1) {
            setInternalStoryIndex(prev => prev + 1);
        } else {
            // Move to next group
            if (currentGroupIndex < stories.length - 1) {
                setCurrentGroupIndex(prev => prev + 1);
            } else {
                onClose();
            }
        }
    };

    const handlePrev = () => {
        if (internalStoryIndex > 0) {
            setInternalStoryIndex(prev => prev - 1);
        } else {
            // Move to previous group
            if (currentGroupIndex > 0) {
                setCurrentGroupIndex(prev => prev - 1);
            } else {
                setProgress(0); // Restart first story of first group
            }
        }
    };

    const handleNavigateToCourse = () => {
        if (currentStory?.courseId) {
            onClose(); // Close viewer first
            router.push(`/course/${currentStory.courseId}`);
        }
    };

    if (!currentStory) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
            {/* Background Media */}
            <div className="absolute inset-0 bg-black flex items-center justify-center">
                {currentStory.mediaType === 'VIDEO' ? (
                    <video
                        src={getOptimizedMediaUrl(currentStory.mediaUrl, 'VIDEO')}
                        className="w-full h-full object-contain"
                        autoPlay
                        playsInline
                    // muted={false} // Autoplay policy might block unmuted. 
                    // Usually stories start muted or user interaction required.
                    // For mobile web usually strict.
                    />
                ) : (
                    <img
                        src={getOptimizedMediaUrl(currentStory.mediaUrl, 'IMAGE')}
                        className="w-full h-full object-contain"
                        alt="Story"
                    />
                )}
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 flex flex-col justify-between p-4 pointer-events-none">

                {/* Header - Pointer events auto to allow interaction */}
                <div className="absolute top-0 left-0 right-0 p-4 z-20 pointer-events-auto">
                    {/* Progress Bars (one for each story in group) */}
                    <div className="flex space-x-1 mb-4">
                        {currentGroup.stories.map((story, idx) => (
                            <div key={story.id} className="h-1 bg-white/30 rounded overflow-hidden flex-1">
                                <div
                                    className={`h-full bg-white transition-all duration-75 ease-linear ${idx < internalStoryIndex ? 'w-full' : idx === internalStoryIndex ? '' : 'w-0'}`}
                                    style={idx === internalStoryIndex ? { width: `${progress}%` } : {}}
                                />
                            </div>
                        ))}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center">
                        <img
                            src={getOptimizedMediaUrl(currentGroup.user.avatar, 'IMAGE')}
                            alt={currentGroup.user.name}
                            className="w-8 h-8 rounded-full border border-white/20 mr-3"
                        />
                        <span className="text-white font-bold text-sm mr-3">{currentGroup.user.name}</span>
                        <span className="text-white/70 text-xs">
                            {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                            onClick={onClose}
                            className="ml-auto p-1 text-white hover:bg-white/10 rounded-full"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tap Zones - Pointer events auto */}
                <div className="flex-1 flex w-full z-10 absolute inset-0 top-16 bottom-20 pointer-events-auto">
                    <div className="flex-1" onClick={handlePrev} />
                    <div className="flex-[2]" onClick={handleNext} />
                </div>

                {/* Footer (Course Link) - Pointer events auto */}
                {currentStory.courseId && (
                    <div
                        className="absolute bottom-8 md:bottom-12 left-0 right-0 p-4 z-20 text-center cursor-pointer pointer-events-auto flex flex-col items-center"
                        onClick={handleNavigateToCourse}
                    >
                        <div className="flex flex-col items-center text-white animate-bounce-slow hover:text-orange-500 transition-colors">
                            <span className="text-xs font-bold mb-1 drop-shadow-md">Daha Fazla</span>
                            <ChevronUp size={24} className="drop-shadow-md" />
                            {currentStory.course?.title && (
                                <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mt-2 border border-white/30 max-w-[80vw]">
                                    <span className="text-sm font-semibold truncate block w-full">{currentStory.course.title}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function HomeStories() {
    const [stories, setStories] = useState<StoryGroup[]>([]);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [showControls, setShowControls] = useState(false);

    const checkScrollability = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const res = await fetch('/api/stories');
                if (!res.ok) return;
                const data = await res.json();

                if (data.success && Array.isArray(data.stories) && data.stories.length > 0) {
                    // Group by title (if exists) or by creator
                    const groupedMap = new Map();

                    data.stories.forEach((story: any) => {
                        const groupKey = story.title
                            ? `title_${story.title.toLowerCase().trim()}`
                            : `user_${story.creatorId || story.creator?.name || 'anonymous'}`;

                        if (!groupedMap.has(groupKey)) {
                            const displayName = story.title || story.creator?.name || "Culinora";
                            const avatarUrl = story.coverImage || story.creator?.image ||
                                (story.mediaType === 'IMAGE' ? story.mediaUrl : story.mediaUrl.replace(/\.[^.]+$/, '.jpg'));

                            groupedMap.set(groupKey, {
                                id: groupKey,
                                user: {
                                    name: displayName,
                                    avatar: avatarUrl,
                                },
                                stories: []
                            });
                        }
                        groupedMap.get(groupKey).stories.push(story);
                    });

                    setStories(Array.from(groupedMap.values()));
                }
            } catch (error) {
                console.error("Failed to load stories", error);
            }
        };

        fetchStories();
    }, []);

    useEffect(() => {
        checkScrollability();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollability);
            return () => container.removeEventListener('scroll', checkScrollability);
        }
    }, [stories]);

    const scrollLeftHandler = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRightHandler = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const openStory = (index: number) => {
        setSelectedGroupIndex(index);
        setViewerVisible(true);
    };

    if (stories.length === 0) return null;

    return (
        <div
            className="py-4 md:py-8 relative"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Sol Ok */}
            {canScrollLeft && (
                <button
                    onClick={scrollLeftHandler}
                    className={`absolute left-0 top-0 bottom-0 z-10 bg-black/50 hover:bg-black/70 text-white w-10 flex items-center justify-center transition-opacity duration-200 rounded-r-lg ${showControls ? 'opacity-100' : 'opacity-0'}`}
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
            )}

            {/* Sağ Ok */}
            {canScrollRight && (
                <button
                    onClick={scrollRightHandler}
                    className={`absolute right-0 top-0 bottom-0 z-10 bg-black/50 hover:bg-black/70 text-white w-10 flex items-center justify-center transition-opacity duration-200 rounded-l-lg ${showControls ? 'opacity-100' : 'opacity-0'}`}
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            )}

            <div
                ref={scrollContainerRef}
                className="flex space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide"
            >
                {stories.map((group, index) => (
                    <div
                        key={group.id}
                        className="flex flex-col items-center space-y-2 min-w-[104px] md:min-w-[128px] cursor-pointer"
                        onClick={() => openStory(index)}
                    >
                        <div className="w-[104px] h-[104px] md:w-[128px] md:h-[128px] rounded-full p-[3px] bg-gradient-to-tr from-orange-400 to-orange-600">
                            <img
                                src={getOptimizedMediaUrl(group.user.avatar, 'IMAGE')}
                                alt={group.user.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        <span className="text-xs md:text-sm text-center text-gray-300 truncate w-full">
                            {group.user.name}
                        </span>
                    </div>
                ))}
            </div>

            {viewerVisible && (
                <StoryViewer
                    stories={stories}
                    initialIndex={selectedGroupIndex}
                    onClose={() => setViewerVisible(false)}
                />
            )}
        </div>
    );
}
