import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT, TAB_BAR_BOTTOM_GAP } from '../constants/layout';

export default function useTabBarClearance() {
    const insets = useSafeAreaInsets();
    const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 36) : insets.bottom;
    return TAB_BAR_HEIGHT + bottomPadding + TAB_BAR_BOTTOM_GAP;
}
