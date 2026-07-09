// Veritabanı gelir takibi 2026-02-21'de başladı. Bu tarihten önceki gelir
// (85 TL) elle takip ediliyordu ve DB'de kaydı yok, bu yüzden toplam gelir
// hesaplarına manuel olarak ekleniyor.
export const REVENUE_TRACKING_START = new Date('2026-02-21T10:00:00.000Z')
export const HISTORICAL_REVENUE_OFFSET = 85
