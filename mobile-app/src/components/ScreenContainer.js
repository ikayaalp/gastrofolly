import { StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenContainer({
    children,
    edges = ['top', 'bottom'],
    statusBarStyle = 'light-content',
    statusBarBackgroundColor = '#000000',
    statusBarTranslucent = false,
    statusBarHidden = false,
    style,
}) {
    return (
        <SafeAreaView style={[styles.container, style]} edges={edges}>
            <StatusBar
                barStyle={statusBarStyle}
                backgroundColor={statusBarBackgroundColor}
                translucent={statusBarTranslucent}
                hidden={statusBarHidden}
            />
            {children}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
});
