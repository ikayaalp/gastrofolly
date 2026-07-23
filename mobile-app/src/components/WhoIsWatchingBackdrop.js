import React from 'react';
import Svg, {
    Defs,
    LinearGradient,
    RadialGradient,
    Stop,
    Rect,
    Path,
    G,
    Line,
    Circle,
    Ellipse,
    Polygon,
    Text as SvgText,
} from 'react-native-svg';

/**
 * "Kim izliyor?" arka plan afişi — webteki public/who-is-watching-bg.svg'nin
 * dikey (1080x1920) uyarlaması. Tamamen vektörel: ağ isteği yok, anında çizilir.
 * Kurs kapağı kolajının (Cloudinary'den 20+ görsel) yerini alır.
 */
export default function WhoIsWatchingBackdrop(props) {
    return (
        <Svg
            width="100%"
            height="100%"
            viewBox="0 0 1080 1920"
            preserveAspectRatio="xMidYMid slice"
            {...props}
        >
            <Defs>
                <LinearGradient id="kiwBg" x1="0" y1="0" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#0a0705" />
                    <Stop offset="0.45" stopColor="#120b07" />
                    <Stop offset="1" stopColor="#000000" />
                </LinearGradient>
                <RadialGradient id="kiwHalo" cx="540" cy="780" r="640" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#ea580c" stopOpacity="0.16" />
                    <Stop offset="0.5" stopColor="#ea580c" stopOpacity="0.05" />
                    <Stop offset="1" stopColor="#ea580c" stopOpacity="0" />
                </RadialGradient>
                <RadialGradient id="kiwEmber" cx="160" cy="1750" r="560" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#f97316" stopOpacity="0.07" />
                    <Stop offset="1" stopColor="#f97316" stopOpacity="0" />
                </RadialGradient>
                <RadialGradient id="kiwVignette" cx="540" cy="960" r="1150" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#000000" stopOpacity="0" />
                    <Stop offset="0.65" stopColor="#000000" stopOpacity="0.25" />
                    <Stop offset="1" stopColor="#000000" stopOpacity="0.88" />
                </RadialGradient>
                <LinearGradient id="kiwBeam" x1="0" y1="0" x2="1080" y2="1920" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#ffffff" stopOpacity="0.035" />
                    <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </LinearGradient>
            </Defs>

            {/* Zemin */}
            <Rect width="1080" height="1920" fill="url(#kiwBg)" />
            <Rect width="1080" height="1920" fill="url(#kiwHalo)" />
            <Rect width="1080" height="1920" fill="url(#kiwEmber)" />

            {/* Diyagonal ışık huzmeleri */}
            <Polygon points="180,0 380,0 900,1920 700,1920" fill="url(#kiwBeam)" />
            <Polygon points="860,0 980,0 300,1920 180,1920" fill="url(#kiwBeam)" />

            {/* Şef şapkası — sol üst, hafif eğik */}
            <G
                transform="translate(210,300) rotate(-8) scale(1.25)"
                stroke="#f97316"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.09"
            >
                <Path d="M -78 40 C -120 40 -132 -14 -92 -26 C -96 -66 -44 -84 -22 -56 C -6 -92 58 -86 62 -46 C 104 -44 108 16 66 26 L 66 40 Z" />
                <Path d="M -66 62 L 56 62 L 52 108 L -62 108 Z" />
                <Line x1="-30" y1="62" x2="-32" y2="30" />
                <Line x1="0" y1="62" x2="0" y2="26" />
                <Line x1="30" y1="62" x2="32" y2="30" />
            </G>

            {/* Oklava — sağ üst */}
            <G
                transform="translate(880,330) rotate(28)"
                stroke="#d1d5db"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                opacity="0.06"
            >
                <Rect x="-130" y="-16" width="260" height="32" rx="16" />
                <Line x1="-130" y1="0" x2="-190" y2="0" />
                <Line x1="130" y1="0" x2="190" y2="0" />
            </G>
            <G fill="#e5e5e5" opacity="0.05">
                <Circle cx="780" cy="450" r="5" />
                <Circle cx="840" cy="490" r="3.6" />
                <Circle cx="740" cy="510" r="3" />
                <Circle cx="890" cy="540" r="4.4" />
            </G>

            {/* Buhar kıvrımları — kartın üstünde */}
            <G stroke="#e5e5e5" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.05">
                <Path d="M 460 640 C 440 590 480 560 460 510 C 445 470 475 440 465 400" />
                <Path d="M 540 660 C 515 605 560 570 538 515 C 520 470 555 435 542 390" />
                <Path d="M 620 640 C 600 590 640 560 620 510 C 605 470 635 440 625 400" />
            </G>

            {/* Çatal ve bıçak — sol kenar */}
            <G
                transform="translate(120,1180) rotate(12) scale(1.15)"
                stroke="#d1d5db"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.07"
            >
                <Line x1="0" y1="0" x2="0" y2="150" />
                <Path d="M -14 -70 L -14 -18 C -14 -6 14 -6 14 -18 L 14 -70 M 0 -70 L 0 -12" />
                <G transform="translate(70,0)">
                    <Line x1="0" y1="0" x2="0" y2="150" />
                    <Path d="M 0 -75 C 26 -60 26 -20 0 -5 Z" />
                </G>
            </G>

            {/* Kepçe — sağ orta */}
            <G
                transform="translate(950,980) rotate(-38)"
                stroke="#d1d5db"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                opacity="0.055"
            >
                <Line x1="0" y1="-95" x2="0" y2="30" />
                <Path d="M -38 30 C -38 74 38 74 38 30 Z" />
            </G>

            {/* Tel çırpıcı — sağ alt, büyük */}
            <G
                transform="translate(890,1560) rotate(-24) scale(1.4)"
                stroke="#f97316"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                opacity="0.08"
            >
                <Line x1="0" y1="0" x2="0" y2="120" />
                <Path d="M 0 0 C -52 -46 -36 -128 0 -132 C 36 -128 52 -46 0 0" />
                <Path d="M 0 0 C -24 -52 -16 -124 0 -132 C 16 -124 24 -52 0 0" />
                <Ellipse cx="0" cy="-64" rx="34" ry="52" />
            </G>

            {/* Servis tabağı (kloş) — sol alt */}
            <G
                transform="translate(280,1720) scale(1.2)"
                stroke="#f97316"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                opacity="0.07"
            >
                <Path d="M -110 0 C -110 -66 110 -66 110 0" />
                <Line x1="-140" y1="0" x2="140" y2="0" />
                <Circle cx="0" cy="-72" r="7" />
            </G>

            {/* Marka izi — en altta, çok silik */}
            <SvgText
                x="540"
                y="1856"
                textAnchor="middle"
                fontSize="30"
                letterSpacing="18"
                fill="#f97316"
                opacity="0.13"
            >
                C U L I N O R A
            </SvgText>

            {/* Vinyet en üstte: kenarlar koyu, merkez temiz */}
            <Rect width="1080" height="1920" fill="url(#kiwVignette)" />
        </Svg>
    );
}
