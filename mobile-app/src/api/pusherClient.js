import { Pusher } from '@pusher/pusher-websocket-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import { getToken } from '../utils/tokenStorage';


let pusherInstance = null;

export async function getPusherClient() {
    if (pusherInstance) return pusherInstance;

    if (!process.env.EXPO_PUBLIC_PUSHER_KEY || !process.env.EXPO_PUBLIC_PUSHER_CLUSTER) {
        console.warn('Pusher config missing, realtime disabled');
        return null;
    }

    const pusher = Pusher.getInstance();
    await pusher.init({
        apiKey: process.env.EXPO_PUBLIC_PUSHER_KEY,
        cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER,
        onAuthorizer: async (channelName, socketId) => {
            try {
                const token = await getToken();
                const response = await fetch(`${config.API_BASE_URL}/api/pusher/auth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
                });
                const data = await response.json();
                // Native köprü [String:String] bekliyor; auth string değilse hiç iletme,
                // kütüphane timeout ile subscription error'a düşer (crash yerine)
                if (!data || typeof data.auth !== 'string') return undefined;
                return data;
            } catch (err) {
                console.warn('Pusher auth request failed:', err?.message);
                return undefined;
            }
        },
    });
    await pusher.connect();
    pusherInstance = pusher;
    return pusher;
}
