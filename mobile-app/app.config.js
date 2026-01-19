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
                    "current_key": "AIzaSyAJ3d9gm8iLbksaQhv3BnBgOeQbRFtxH5M"
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
        "name": "Chef 2.0",
        "slug": "chef-2-0",
        "scheme": "chef2",
        "version": "1.0.0",
        "orientation": "portrait",
        "icon": "./assets/icon.png",
        "userInterfaceStyle": "dark",
        "splash": {
            "image": "./assets/icon.png",
            "resizeMode": "contain",
            "backgroundColor": "#000000"
        },
        "ios": {
            "supportsTablet": true,
            "bundleIdentifier": "com.chef2.app"
        },
        "android": {
            "package": "com.chef2.app",
            "versionCode": 1,
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
                    "icon": "./assets/icon.png",
                    "color": "#FF6B00",
                    "sounds": []
                }
            ],
            "expo-web-browser"
        ],
        "extra": {
            "eas": {
                "projectId": "b516f8ca-586e-4c27-8895-4eeb55549f80"
            }
        },
        "owner": "ikayaalpp"
    }
};
