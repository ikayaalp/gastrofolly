import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'culinora_favorites';

const favoritesService = {
    // Tüm favorileri getir
    getFavorites: async () => {
        try {
            const data = await AsyncStorage.getItem(FAVORITES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Favoriler yüklenirken hata:', error);
            return [];
        }
    },

    // Favorilere tam bir kurs objesi ekle
    addFavorite: async (course) => {
        try {
            const favorites = await favoritesService.getFavorites();
            // Aynı kursun zaten olup olmadığını kontrol et
            if (!favorites.find(item => item.id === course.id)) {
                // Sadece ihtiyacımız olan alanları tutabiliriz veya temiz bir map yapabiliriz
                const newFavorite = {
                    id: course.id,
                    title: course.title,
                    imageUrl: course.imageUrl,
                    category: course.category || { name: 'Kategori' },
                    instructor: course.instructor || { name: 'Eğitmen' },
                    duration: course.duration,
                    course: course, // tam veriyi koruyalım CoursesScreen için
                    _count: course._count || { lessons: 0 }
                };
                favorites.push(newFavorite);
                await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
            }
            return true;
        } catch (error) {
            console.error('Favori eklenirken hata:', error);
            return false;
        }
    },

    // Favorilerden çıkar
    removeFavorite: async (courseId) => {
        try {
            const favorites = await favoritesService.getFavorites();
            const filtered = favorites.filter(item => item.id !== courseId);
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Favori silinirken hata:', error);
            return false;
        }
    },

    // Kurs favorilerde mi kontrol et
    isFavorite: async (courseId) => {
        try {
            const favorites = await favoritesService.getFavorites();
            return favorites.some(item => item.id === courseId);
        } catch (error) {
            return false;
        }
    }
};

export default favoritesService;
