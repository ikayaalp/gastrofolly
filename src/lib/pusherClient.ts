import Pusher from 'pusher-js'

let pusherInstance: Pusher | null = null

export function getPusherClient(): Pusher | null {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    if (!key) return null

    if (!pusherInstance) {
        pusherInstance = new Pusher(key, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
            authEndpoint: '/api/pusher/auth',
        })
    }
    return pusherInstance
}
