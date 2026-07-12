/**
 * Design System — Merkezi Tema Token'ları
 * Uygulama genelinde tutarlı renk, boşluk, tipografi ve köşe yuvarlama değerleri.
 * Her dokunulan ekran bu token'ları kullanmalıdır; hardcoded hex yasaktır.
 */

const colors = {
    // ── Backgrounds ──
    background:     '#000000',   // Ana arka plan (#000)
    surface:        '#111111',   // Kart / section arka planı (#111)
    surfaceElevated:'#1a1a1a',   // Hafif yükseltilmiş yüzey
    surfaceHover:   '#0a0a0a',   // Basılı / hover durumu

    // ── Brand / Primary ──
    primary:        '#ea580c',   // Ana turuncu (CTA butonlar, vurgular)
    primaryMuted:   'rgba(234, 88, 12, 0.5)', // Switch track, yarı saydam vurgular
    primarySubtle:  'rgba(234, 88, 12, 0.1)', // Badge / chip arka planı

    // ── Text ──
    text:           '#FFFFFF',   // Başlıklar, ana metin
    textSecondary:  '#E5E5E5',   // İkincil açık metin
    textTertiary:   '#D1D5DB',   // e5e5e5 ile 9ca3af arası; ~19 yerde kullanılan gri basamak
    textMuted:      '#9CA3AF',   // Açıklama, altyazı
    textSubtle:     '#6B7280',   // Section başlıkları, meta bilgi
    textDisabled:   '#4B5563',   // Devre dışı, versiyon metni

    // ── Borders ──
    border:         '#1F2937',   // Kart kenarları, ayırıcılar
    borderLight:    '#374151',   // Modal ayırıcılar
    borderSubtle:   '#1a1a1a',   // Header alt çizgi

    // ── Semantic ──
    danger:         '#EF4444',   // Silme, hata
    dangerSubtle:   'rgba(239, 68, 68, 0.1)', // Danger icon arka planı
    success:        '#10B981',   // Başarı
    warning:        '#F97316',   // Uyarı
    info:           '#3B82F6',   // Bilgi

    // ── Overlay ──
    overlay:        'rgba(0,0,0,0.7)', // Modal backdrop
};

const spacing = {
    xs:  4,
    sm:  8,
    md:  12,
    lg:  16,
    xl:  20,
    xxl: 24,
    xxxl:32,
};

const radius = {
    sm:   4,
    md:   8,
    lg:   12,
    xl:   16,
    xxl:  20,
    full: 9999,
};

const typography = {
    // ── Font Sizes ──
    size: {
        xs:   10,
        sm:   12,
        md:   13,
        base: 14,
        lg:   15,
        xl:   16,
        '2xl':18,
        '3xl':20,
        '4xl':24,
        '5xl':32,
    },
    // ── Font Weights ──
    weight: {
        normal:   '400',
        medium:   '500',
        semibold: '600',
        bold:     '700',
        extrabold:'800',
        black:    '900',
    },
};

const theme = { colors, spacing, radius, typography };

export { colors, spacing, radius, typography };
export default theme;
