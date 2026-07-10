
const SEVERE_WORDS = [
    "amk", "aq", "siktir", "sokayim", "sokayım", "ananı", "anani", "avradını", "avradini",
    "kaşar", "kasar", "oç", "oc", "piç", "pic", "yarak", "yarrak", "amcık", "amcik",
    "götveren", "gotveren", "gavat", "pezevenk", "kalta", "kahpe", "orospu",
    "sikerim", "sikeyim", "sikem", "sikim", "sik", "yarram", "yarragim", "yarrağım",
    "amına", "amina", "amigöt", "amın", "amin", "götü", "gotu",
    "ibne", "puşt", "pust", "şerefsiz", "serefsiz", "haysiyetsiz", "yavşak", "yavsak", "lavuk",
    "fuck", "shit", "bitch", "asshole", "dick", "cunt", "pussy",
    "orosbu", "fahişe", "fahise", "sürtük", "surtuk", "kaltak",
    "sktr", "sg", "s.g", "s.g.", "a.q", "a.q.", "a.m.k",
    "ananın", "ananin", "bacını", "bacini", "sülaleni", "sulaleni",
    "siktiğimin", "siktigimin", "amk çocuğu", "amk cocugu",
    "yarrak kafalı", "yarrak kafali", "amcık ağızlı", "amcik agizli"
];

const CONTEXTUAL_WORDS = [
    "am", "got", "göt", "salak", "aptal", "mal", "dangalak", "gerizekalı", "gerizekali"
];

const TARGET_WORDS = [
    "sen", "seni", "senin", "sana", "lan", "ulan", "moruk", "oğlum", "oglum", "olm"
];

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function containsProfanity(text: string): boolean {
    if (!text) return false;

    const lowerText = text.toLowerCase();

    // Ciddi küfür kontrolü (her zaman engellenir)
    const hasSevere = SEVERE_WORDS.some(word => {
        const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
        return regex.test(lowerText);
    });

    if (hasSevere) return true;

    // Bağlama duyarlı kelimelerin kontrolü
    const matchedContextualWords = CONTEXTUAL_WORDS.filter(word => {
        const regex = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
        return regex.test(lowerText);
    });

    if (matchedContextualWords.length > 0) {
        // Hedefe yönelik hitap kelimelerini bul
        const targetRegex = new RegExp(`\\b(${TARGET_WORDS.map(escapeRegExp).join('|')})\\b`, 'gi');
        let targetMatch;
        const targetIndices: number[] = [];
        
        while ((targetMatch = targetRegex.exec(lowerText)) !== null) {
            targetIndices.push(targetMatch.index);
        }

        if (targetIndices.length > 0) {
            // Bağlama duyarlı kelime ile hedefe yönelik kelime arasındaki mesafeyi kontrol et (yaklaşık 40 karakter / ~3-5 kelime)
            for (const contextWord of matchedContextualWords) {
                const contextRegex = new RegExp(`\\b${escapeRegExp(contextWord)}\\b`, 'gi');
                let contextMatch;
                while ((contextMatch = contextRegex.exec(lowerText)) !== null) {
                    const cIndex = contextMatch.index;
                    for (const tIndex of targetIndices) {
                        if (Math.abs(cIndex - tIndex) <= 40) {
                            return true; // Hedefe yönelik bağlam tespit edildi
                        }
                    }
                }
            }
        }
    }

    return false;
}
