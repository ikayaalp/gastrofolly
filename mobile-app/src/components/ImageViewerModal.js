import React from 'react';
import { StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import ImageView from 'react-native-image-viewing';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Enhanced Fullscreen Image Viewer
 * Uses react-native-image-viewing for performant pinch-to-zoom and gestures
 */
export default function ImageViewerModal({ visible, imageUrl, onClose }) {
    // Return empty if no image (though visible should handle this)
    if (!imageUrl) return null;

    const insets = useSafeAreaInsets();
    const images = [{ uri: imageUrl }];

    // Custom Header with Close Button that respects safe area
    const renderHeader = () => (
        <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + 10 }]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
        >
            <X size={24} color="#fff" />
        </TouchableOpacity>
    );

    return (
        <ImageView
            images={images}
            imageIndex={0}
            visible={visible}
            onRequestClose={onClose}
            HeaderComponent={renderHeader}
            swipeToCloseEnabled={true}
            doubleTapToZoomEnabled={true}
            presentationStyle="overFullScreen"
            backgroundColor="#000000"
            animationType="fade"
        />
    );
}

const styles = StyleSheet.create({
    closeButton: {
        position: 'absolute',
        left: 20,
        zIndex: 999,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
