
const TR_BAD_WORDS = [
    // Genel Küfürler
    "am", "amk", "aq", "siktir", "sokayim", "sokayım", "ananı", "anani", "avradını", "avradini",
    "kaşar", "kasar", "oç", "oc", "piç", "pic", "yarak", "yarrak", "amcık", "amcik",
    "götveren", "gotveren", "gavat", "pezevenk", "kalta", "kahpe", "orospu",
    "sikerim", "sikeyim", "sikem", "sikim", "sik", "yarram", "yarragim", "yarrağım",
    "amına", "amina", "amigöt", "amın", "amin", "göt", "got", "götü", "gotu",
    "ibne", "puşt", "pust", "şerefsiz", "serefsiz", "haysiyetsiz", "gerizekalı", "gerizekali",
    "salak", "aptal", "mal", "dangalak", "yavşak", "yavsak", "lavuk",

    // İngilizce (Yaygın kullanılanlar)
    "fuck", "shit", "bitch", "asshole", "dick", "cunt", "pussy",

    // Diğer Varyasyonlar
    "orosbu", "fahişe", "fahise", "sürtük", "surtuk", "kaltak",
    "sktr", "sg", "s.g", "s.g.", "a.q", "a.q.", "a.m.k",
    "ananın", "ananin", "bacını", "bacini", "sülaleni", "sulaleni",
    "siktiğimin", "siktigimin", "amk çocuğu", "amk cocugu",
    "yarrak kafalı", "yarrak kafali", "amcık ağızlı", "amcik agizli"
];

export function containsProfanity(text: string): boolean {
    if (!text) return false;

    const lowerText = text.toLowerCase();

    // Basit kelime kontrolü
    // Kelime sınırlarına bakarak kontrol edelim (böylece "saman" içinde "am" kelimesi triggerlanmaz)
    // Ancak Türkçe eklemeli dil olduğu için bazen ekleri de düşünmek lazım. 
    // Şimdilik basit contains + word boundary karması yapalım.

    return TR_BAD_WORDS.some(word => {
        // Tam kelime eşleşmesi veya bariz küfürlerin geçtiği yerler
        // .includes() kaldırıldı çünkü "am" gibi kısa kelimeler "tamam" içinde geçebiliyor.
        // Sadece regex boundary (\b) kullanıyoruz.
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowerText);
    });
}
