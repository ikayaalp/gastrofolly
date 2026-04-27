import 'dotenv/config'; // Load env vars if needed
import fs from 'fs';

// Embed google-services.json content to ensure it exists on EAS Build
const googleServicesJson = {
    "project_info": {
        "project_number": "1099008075489",
        "project_id": "gastrofolly-videos",
        "storage_bucket": "gastrofolly-videos.firebasestorage.app"
    },
    "client": [
        {
            "client_info": {
                "mobilesdk_app_id": "1:1099008075489:android:cab0e62599fc990ebaf9a0",
                "android_client_info": {
                    "package_name": "com.chef2.app"
                }
            },
            "oauth_client": [],
            "api_key": [
                {
                    "current_key": process.env.FIREBASE_API_KEY || "AIzaSyAJ3d9gm8iLbksaQhv3BnBgOeQbRFtxH5M" // Fallback only for local dev without env
                }
            ],
            "services": {
                "appinvite_service": {
                    "other_platform_oauth_client": []
                }
            }
        }
    ],
    "configuration_version": "1"
};

// Write the file if it doesn't exist
if (!fs.existsSync('google-services.json')) {
    try {
        fs.writeFileSync('google-services.json', JSON.stringify(googleServicesJson, null, 2));
        console.log('Created google-services.json from config');
    } catch (error) {
        console.error('Error creating google-services.json:', error);
    }
}

export default {
    "expo": {
        "name": "Culinora",
        "slug": "chef-2-0",

        "scheme": "chef2",
        "version": "1.0.4",
        "orientation": "portrait",
        "icon": "./assets/icon_blackBg.png",
        "userInterfaceStyle": "dark",
        "splash": {
            "image": "./assets/icon_blackBg.png",
            "resizeMode": "contain",
            "backgroundColor": "#000000"
        },
        "ios": {
            "buildNumber": "28",
            "supportsTablet": true,
            "bundleIdentifier": "com.chef2.app",
            "infoPlist": {
                "UIBackgroundModes": ["remote-notification"]
            },
            "googleServicesFile": "./GoogleService-Info.plist"
        },
        "android": {
            "package": "com.chef2.app",
            "versionCode": 3,
            "adaptiveIcon": {
                "foregroundImage": "./assets/adaptive-icon.png",
                "backgroundColor": "#000000"
            },
            "googleServicesFile": "./google-services.json"
        },
        "web": {
            "favicon": "./assets/icon.png"
        },
        "plugins": [
            [
                "expo-notifications",
                {
                    "icon": "./assets/icon_blackBg.png",
                    "color": "#FF6B00",
                    "sounds": []
                }
            ],
            [
                "expo-image-picker",
                {
                    "photosPermission": "Kendi profil fotoğrafınızı güncelleyebilmeniz ve toplulukta yemek tariflerinizi paylaşabilmeniz için fotoğraflarınıza erişim izni gereklidir.",
                    "cameraPermission": "Kendi profil fotoğrafınızı çekebilmeniz ve toplulukta yemek tariflerinizi paylaşabilmeniz için kameranıza erişim izni gereklidir."
                }
            ],
            "expo-web-browser",
            "expo-font",
            "expo-asset",
            "expo-apple-authentication"
        ],
        "owner": "ikayaalpp",
        "extra": {
            "eas": {
                "projectId": "b516f8ca-586e-4c27-8895-4eeb55549f80"
            }
        },
        "termsOfServiceUrl": "https://culinora.net/terms"
    }
};
