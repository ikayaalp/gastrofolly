import { Pusher } from '@pusher/pusher-websocket-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import { getToken } from '../utils/tokenStorage';


let pusherInstance = null;

export async function getPusherClient() {
    if (pusherInstance) return pusherInstance;

    const pusher = Pusher.getInstance();
    await pusher.init({
        apiKey: process.env.EXPO_PUBLIC_PUSHER_KEY,
        cluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER,
        onAuthorizer: async (channelName, socketId) => {
            const token = await getToken();
            const response = await fetch(`${config.API_BASE_URL}/api/pusher/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
            });
            return await response.json();
        },
    });
    await pusher.connect();
    pusherInstance = pusher;
    return pusher;
}
