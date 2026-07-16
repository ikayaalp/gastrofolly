# mobile-app/ — Claude Kuralları

Expo ~54, React Native 0.81.5, React 19. Ayrı `package.json`/`node_modules`; web ile kod paylaşmaz, aynı backend'i (`https://culinora.net`) HTTP ile çağırır. Dil: **JavaScript** (TS değil).

## Kritik kurallar

1. **Token saklama**: SADECE `src/utils/tokenStorage.js` (`getToken`/`setToken`/`removeToken`, SecureStore tabanlı). Token için doğrudan `AsyncStorage` KULLANMA — geçmişte AsyncStorage'dan okuyan ekranlar sahte "giriş yap" hatasına yol açtı. AsyncStorage yalnızca token dışı hafif state için (userData cache, onboarding flag'i vb.).
2. **API çağrıları**: SADECE `src/api/apiClient.js` (axios instance) üzerinden. Bearer token'ı request interceptor otomatik ekler; 401 gelirse response interceptor "başka cihazdan giriş" akışını çalıştırır (tek cihaz oturumu — backend `currentSessionId` kontrolü yapar). Yeni endpoint eklerken ilgili `src/api/*Service.js` dosyasına fonksiyon ekle, ekrandan doğrudan axios/fetch çağırma.
3. **Tema**: Hardcoded hex YASAK. `src/constants/theme.js` token'larını kullan (`colors.primary` = #ea580c turuncu, `colors.background` = #000, `colors.surface` = #111...). Spacing için `src/constants/layout.js`.
4. **Ödeme**: Mobilde SADECE **RevenueCat** (IAP) — Stripe/Iyzico kodu ekleme. `src/api/revenueCatService.js`; sunucu senkronu `POST /api/user/sync-revenuecat` + RC webhook.
5. **Navigasyon**: Tüm route'lar tek dosyada: `src/navigation/AppNavigator.js` (`navigationRef` export eder). Yeni ekran = `src/screens/XScreen.js` + AppNavigator'a kayıt.

## Dizin haritası

- `src/api/` — `apiClient.js`, `config.js` (base URL + bazı endpoint sabitleri), servisler: auth, course, forum, dm, ai, home, notification, story, certificate, revenueCat, pusherClient
- `src/screens/` — ~28 ekran (`HomeScreen`, `LearnScreen` (video), `SocialScreen`/`TopicDetailScreen` (Chef Sosyal), `CuliScreen` (AI), `MessagesScreen`/`ChatScreen` (DM/Pusher), `SubscriptionScreen` (RC paywall)...)
- `src/components/` — FloatingTabBar, TopicCard, Skeleton, CustomAlert, ErrorBoundary, OfflineBanner, LoginRequiredModal, Stories...
- `src/hooks/` — `useAppleAuth`, `useGoogleAuth` (native login → backend `apple-mobile`/`google-mobile` endpoint'i), `useTabBarClearance`
- Root: `App.js` (giriş), `app.config.js` (Expo config, versiyon/build no burada), `eas.json` (EAS build profilleri)

## Bilinen hassas noktalar

- `LearnScreen` video player ref'leri: unmount sırasında null-guard şart (geçmişte crash).
- Pusher (ChatScreen): native katman force-cast SIGABRT geçmişi var — JS tarafında bağlantı/parametre guard'larını koru.
- Build/versiyon artırma `app.config.js` içinde (iOS buildNumber, Android versionCode).
