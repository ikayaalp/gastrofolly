export interface BlogPost {
    slug: string
    title: string
    description: string
    content: string
    author: string
    date: string
    readTime: string
    category: string
    imageUrl?: string
    tags: string[]
}

export const blogPosts: BlogPost[] = [
    {
        slug: "profesyonel-sef-olmak-icin-bilmeniz-gerekenler",
        title: "Profesyonel Şef Olmak İçin Bilmeniz Gereken 10 Temel Beceri",
        description: "Mutfakta kariyer yapmak isteyenler için profesyonel şefliğin gerektirdiği temel beceriler, eğitim süreçleri ve kariyer yol haritası.",
        category: "Kariyer",
        author: "Culinora",
        date: "2026-02-10",
        readTime: "8 dk",
        tags: ["şef olmak", "kariyer", "gastronomi eğitimi", "mutfak becerileri"],
        content: `
## Profesyonel Şef Olmak: Bir Tutkunun Kariyere Dönüşümü

Mutfakta profesyonel bir kariyer inşa etmek, sadece yemek yapmayı sevmekten çok daha fazlasını gerektirir. İşte başarılı bir şef olmanız için edinmeniz gereken temel beceriler:

### 1. Bıçak Becerileri

Her şefin mutfaktaki en önemli aracı bıçağıdır. Julienne, brunoise, chiffonade gibi kesim tekniklerini kusursuz yapabilmek hem hızınızı artırır hem de yemeklerinizin sunumunu profesyonelleştirir.

### 2. Isı Kontrolü ve Pişirme Teknikleri

Sautéing, braising, poaching, roasting... Her pişirme tekniğinin kendine özgü ısı seviyesi ve süresi vardır. Bu teknikleri ustaca kullanmak, malzemenin lezzetini en üst düzeye çıkarmanın anahtarıdır.

### 3. Lezzet Profili Oluşturma

Tuzlu, tatlı, acı, ekşi ve umami — beş temel tat arasındaki dengeyi kurabilmek bir şefin en önemli yeteneğidir. Baharatları, sosları ve garnitürleri doğru kombinasyonlarda kullanmak yılların deneyimiyle gelişir.

### 4. Menü Planlama

Mevsimsellik, maliyet kontrolü, beslenme değerleri ve müşteri beklentileri — tüm bunları bir arada düşünerek menü oluşturabilmek stratejik düşünme yeteneği gerektirir.

### 5. Hijyen ve Gıda Güvenliği

HACCP prensipleri, çapraz kontaminasyon önleme ve doğru saklama koşulları her profesyonel şefin bilmesi gereken konulardır. Bu sadece yasal bir zorunluluk değil, aynı zamanda etik bir sorumluluktur.

### 6. Zaman Yönetimi

Mutfakta her şey zamanlamaya bağlıdır. Birden fazla yemeği aynı anda hazırlayabilmek, mise en place (hazırlık düzeni) yapabilmek ve servis saatine yetişebilmek kritik becerilerdir.

### 7. Ekip Yönetimi

Brigade de cuisine sistemi, mutfaktaki hiyerarşiyi tanımlar. İster sous chef, ister executive chef olun, ekibinizi motive edebilmek ve yönetebilmek başarınızın anahtarıdır.

### 8. Yaratıcılık ve Sunum

Yemeğin tadı kadar görünümü de önemlidir. Tabak sunumu, renk uyumu ve garnitür yerleştirme — bunların hepsi yemek deneyiminin bir parçasıdır.

### 9. Maliyet Kontrolü ve İşletme Bilgisi

Food cost hesaplamak, porsiyon kontrolü yapmak ve fire oranlarını minimize etmek, kârlı bir mutfak işletmenin temelini oluşturur.

### 10. Sürekli Öğrenme

Gastronomi hızla değişen bir dünya. Yeni trendler, teknikler ve malzemeler sürekli ortaya çıkıyor. **Culinora gibi online eğitim platformları**, bu sürekli gelişimi destekleyen en etkili araçlardandır.

---

*Culinora'da profesyonel şeflerden bu becerileri online olarak öğrenebilir, sertifika programlarıyla kariyerinize güçlü bir başlangıç yapabilirsiniz.*
    `
    },
    {
        slug: "evde-yapabileceginiz-5-fransiz-klasik-tarif",
        title: "Evde Yapabileceğiniz 5 Fransız Klasik Tarif",
        description: "Fransız mutfağının en ikonik tariflerini evinizin konforunda hazırlamak için adım adım rehber. Ratatouille'den Crème Brûlée'ye.",
        category: "Tarifler",
        author: "Culinora",
        date: "2026-02-08",
        readTime: "10 dk",
        tags: ["fransız mutfağı", "tarifler", "klasik tarifler", "ev yemekleri"],
        content: `
## Fransız Mutfağının Büyüsünü Mutfağınıza Getirin

Fransız mutfağı, dünya gastronomi tarihinin temel taşlarından biridir. UNESCO Somut Olmayan Kültürel Miras listesinde yer alan bu mutfak geleneği, aslında düşündüğünüzden çok daha erişilebilir.

### 1. Ratatouille

Provence bölgesinin ikonik sebze yemeği olan Ratatouille, hem göze hem damağa hitap eder.

**Malzemeler:** Patlıcan, kabak, biber, domates, soğan, sarımsak, taze kekik, zeytinyağı

**İpuçları:**
- Sebzeleri eşit kalınlıkta dilimleyin
- Mandolin dilimleyici kullanmak profesyonel sonuç verir
- Düşük ısıda uzun süre pişirmek lezzetin derinleşmesini sağlar

### 2. French Onion Soup (Soğan Çorbası)

Karamelize soğanın derin lezzeti, et suyu ve üzerindeki eritilmiş Gruyère peyniri — kış aylarının vazgeçilmezi.

**Sırrı:** Soğanları en az 45 dakika boyunca çok düşük ateşte karamelize etmek. Acele etmeyin, sabır bu tarifte en önemli malzemedir.

### 3. Coq au Vin

Şarapta marine edilmiş tavuk, mantar, soğan ve domuz pastırması ile hazırlanan bu klasik, comfort food'un en üst seviyesidir.

**Önemli:** İyi bir Burgundy şarap kullanın. Yemekte kullanacağınız şarabı içebilir olmalısınız — bu Fransız mutfağının altın kuralıdır.

### 4. Crème Brûlée

Vanilya kreması üzerine karamelize şeker tabakası — restoranlarda sizi büyüleyen bu tatlıyı evde yapmak aslında çok kolay.

**İpuçları:**
- Gerçek vanilya çubuğu kullanın, özüt değil
- Benmari usulü pişirin
- Üzerini bir mutfak üfleciyle (torch) karamelize edin

### 5. Quiche Lorraine

Fransız usulü tuzlu tart olan Quiche, brunch'ların yıldızıdır. Tereyağlı hamur, yumurta-krema karışımı, jambon ve Gruyère peyniri ile hazırlanır.

**Sırrı:** Hamuru önceden kör pişirin (blind bake) — bu sayede alt kısım çıtır kalır.

---

*Bu tariflerin video anlatımlı versiyonlarını Culinora'daki Fransız Mutfağı kurslarında bulabilirsiniz.*
    `
    },
    {
        slug: "online-gastronomi-egitimi-neden-yukselen-trend",
        title: "Online Gastronomi Eğitimi: Neden Yükselen Bir Trend?",
        description: "Dijital çağda online aşçılık ve gastronomi eğitiminin avantajları, geleneksel eğitimle karşılaştırması ve geleceği hakkında kapsamlı analiz.",
        category: "Eğitim",
        author: "Culinora",
        date: "2026-02-06",
        readTime: "7 dk",
        tags: ["online eğitim", "gastronomi eğitimi", "edtech", "dijital öğrenme"],
        content: `
## Online Gastronomi Eğitiminin Yükselişi

COVID-19 pandemisi birçok sektörü dijitale taşıdı, ancak belki de en şaşırtıcı dönüşüm gastronomi eğitiminde yaşandı. Peki online gastronomi eğitimi gerçekten etkili mi?

### Geleneksel vs. Online Eğitim

| Özellik | Geleneksel | Online |
|---------|-----------|--------|
| Maliyet | 50.000-200.000 ₺/yıl | 299 ₺/ay |
| Esneklik | Sabit program | 7/24 erişim |
| Eğitmen Çeşitliliği | 3-5 eğitmen | 20+ farklı şef |
| Pratik | Yüz yüze | Kendi mutfağınızda |
| Sertifika | Var | Var |

### Online Eğitimin 5 Büyük Avantajı

**1. Kendi Hızınızda Öğrenin**

Bir tekniği anlamadıysanız videoyu geri sarın ve tekrar izleyin. Geleneksel sınıfta bu mümkün değil.

**2. Dünya Çapında Eğitmenler**

İstanbul'da oturarak, Paris'in en iyi şeflerinden ders alabilirsiniz. Coğrafya artık bir engel değil.

**3. Uygun Fiyat**

Bir gastronomi okulunun yıllık ücreti yerine, aylık abonelikle tüm içeriklere erişin.

**4. Gerçek Mutfağınızda Pratik**

Kendi mutfağınızda, kendi malzemelerinizle pratik yaparsınız. Bu aslında en gerçekçi öğrenme ortamıdır — çünkü sonuçta yemeği kendi mutfağınızda yapacaksınız.

**5. Güncel İçerik**

Online platformlar sürekli yeni içerik ekler. Trendler değiştikçe, eğitim de güncellenir.

### Online Eğitim Kimlere Uygun?

- Kariyer değişikliği düşünenler
- Hobi olarak gastronomi ile ilgilenenler
- Mevcut becerilerini geliştirmek isteyen profesyoneller
- Zaman ve bütçe kısıtlaması olanlar

### Geleceğe Bakış

Yapay zeka ve interaktif teknolojiler, online gastronomi eğitimini daha da ileri götürecek. **Culinora'nın Culi AI asistanı**, kişiselleştirilmiş öneriler ve anlık yardım sunarak bu geleceğin bir örneğini zaten sunuyor.

---

*Culinora ile gastronomi yolculuğunuza bugün başlayın. İlk dersiniz ücretsiz!*
    `
    },
    {
        slug: "mutfakta-en-cok-yapilan-10-hata",
        title: "Mutfakta En Çok Yapılan 10 Hata ve Çözümleri",
        description: "Hem amatör hem profesyonel aşçıların sıkça yaptığı mutfak hatalarını ve bunları nasıl düzelteceğinizi öğrenin.",
        category: "İpuçları",
        author: "Culinora",
        date: "2026-02-04",
        readTime: "6 dk",
        tags: ["mutfak ipuçları", "yemek yapma hataları", "pişirme teknikleri", "aşçılık"],
        content: `
## Herkesin Yaptığı Ama Kimsenin Konuşmadığı Mutfak Hataları

Yemek yaparken hepimiz zaman zaman aynı hatalara düşeriz. İşte en yaygın 10 hata ve profesyonel şeflerin çözüm önerileri:

### 1. Tavayı Yeterince Isıtmamak

**Hata:** Soğuk tavaya et koymak, etin yapışmasına ve suyunu bırakmasına neden olur.

**Çözüm:** Tavayı orta-yüksek ateşte 2-3 dakika ısıtın. Elinizi tava üzerinde tuttuğunuzda sıcaklığı hissedecek kadar ısınmalı.

### 2. Yemeği Çok Sık Karıştırmak

**Hata:** Sürekli karıştırmak, Maillard reaksiyonunun (kahverengileşme) oluşmasını engeller.

**Çözüm:** Eti tavaya koyun ve en az 3-4 dakika dokunmayın. Doğal olarak ayrılana kadar bekleyin.

### 3. Yeterince Tuz Kullanmamak

**Hata:** Tuzu sadece sonunda eklemek. Tuz, pişirme sürecinin her aşamasında kullanılmalı.

**Çözüm:** Katman katman tuzlayın — sebzeleri kavururken, sos yaparken ve sonunda tadına bakarak ayarlayın.

### 4. Soğan ve Sarımsağı Aynı Anda Eklemek

**Hata:** Sarımsak, soğandan çok daha hızlı yanar ve acılaşır.

**Çözüm:** Önce soğanı kavurun, şeffaflaşınca sarımsağı ekleyin ve 30-60 saniye sonra diğer malzemeleri ilave edin.

### 5. Makarnayı Yeterli Suda Pişirmemek

**Hata:** Az suda pişen makarna yapışır ve eşit pişmez.

**Çözüm:** Her 100g makarna için en az 1 litre su ve 10g tuz kullanın.

### 6. Eti Kesimden Hemen Sonra Servis Etmek

**Hata:** Pişen etin suları henüz yüzeye çıkmamıştır.

**Çözüm:** Eti pişirdikten sonra 5-10 dakika dinlendirin. Bu sürede sular eşit dağılır.

### 7. Künt Bıçak Kullanmak

**Hata:** Künt bıçak, keskin bıçaktan daha tehlikelidir ve düzgün kesim yapmanızı engeller.

**Çözüm:** Bıçaklarınızı düzenli olarak bileyin. Masat kullanarak her kullanımda hizalayın.

### 8. Tarifleri Okumadan Başlamak

**Hata:** Yarısında eksik malzeme olduğunu fark etmek.

**Çözüm:** Mise en place yapın — tüm malzemeleri önceden ölçüp hazırlayın.

### 9. Fırını Önceden Isıtmamak

**Hata:** Soğuk fırına konan yiyecek eşit pişmez.

**Çözüm:** Fırını en az 15-20 dakika önceden set edin.

### 10. Aynı Tarifleri Tekrarlamak

**Hata:** Konfor alanınızdan çıkmamak, gelişiminizi durdurur.

**Çözüm:** Her hafta yeni bir teknik veya tarif deneyin. **Culinora'daki kurslar** bu konuda mükemmel bir kaynak.

---

*Bu hataları detaylı video derslerle öğrenmek için Culinora kurslarına göz atın!*
    `
    },
    {
        slug: "2026-gastronomi-trendleri",
        title: "2026'nın Öne Çıkan Gastronomi Trendleri",
        description: "Sürdürülebilir mutfaktan yapay zeka destekli mutfak asistanlarına, 2026 yılında gastronomi dünyasını şekillendiren en önemli trendler.",
        category: "Trendler",
        author: "Culinora",
        date: "2026-02-01",
        readTime: "9 dk",
        tags: ["gastronomi trendleri", "2026", "sürdürülebilir mutfak", "yapay zeka"],
        content: `
## 2026 Gastronomi Dünyasında Neler Değişiyor?

Gastronomi dünyası sürekli evrim geçiriyor. 2026 yılında öne çıkan trendlere birlikte göz atalım:

### 1. Sürdürülebilir ve Sıfır Atık Mutfak

"Root to stem" (kökten uca) ve "nose to tail" (burundan kuyruğa) yaklaşımları artık lüks restoranlardan ev mutfaklarına yayılıyor. Malzemelerin tamamını kullanmak hem çevre hem bütçe dostu.

**Uygulama örnekleri:**
- Brokoli saplarından çorba
- Portakal kabuğundan reçel
- Bayat ekmekten panzanella salatası

### 2. Fermentasyon Rönesansı

Kimchi, kombucha ve kefir gibi fermente gıdalar bağırsak sağlığı üzerindeki olumlu etkileriyle daha da popülerleşiyor. Evde fermentasyon atölyeleri büyük ilgi görüyor.

### 3. Yapay Zeka Destekli Mutfak

AI, mutfakta devrim yaratıyor:
- **Kişisel tarif önerileri** — Elinizdeki malzemelere göre
- **Beslenme planlama** — Kişisel sağlık hedeflerinize uygun
- **Teknik rehberlik** — Anlık yardım ve ipuçları

Culinora'nın **Culi AI** asistanı, bu trendin en iyi örneklerinden biri. Yapay zeka destekli mutfak asistanınız, tarifler oluşturur, teknikler öğretir ve sorularınızı anında yanıtlar.

### 4. Hyper-Local Yemek Kültürü

Yerel üreticilerden alışveriş, köy pazarları ve community-supported agriculture (CSA) modelleri yükselişte. Malzemelerin kaynağını bilmek tüketiciler için artık bir lüks değil, bir beklenti.

### 5. Plant-Forward Mutfak

Tamamen vegan olmak yerine, bitkisel ağırlıklı beslenme trendi güçleniyor. Et bir "yan talep" olarak konumlandırılırken, sebzeler tabağın yıldızı oluyor.

### 6. Global Fusion 2.0

Kore-Meksika, Japon-İtalyan, Türk-Perulu gibi beklenmedik mutfak birleşimleri yaratıcılığın yeni sınırlarını zorluyor.

### 7. Nostaljik Comfort Food'un Geri Dönüşü

Büyükannelerimizin tarifleri, modern tekniklerle yeniden yorumlanıyor. Geleneksel tatlar artık fine dining restoranlarda karşımıza çıkıyor.

### 8. Mutfak Eğitiminin Demokratikleşmesi

Online gastronomi eğitim platformları sayesinde, profesyonel şeflerden ders almak artık herkes için erişilebilir. Culinora gibi platformlar bu trendin öncüsü konumunda.

---

*Bu trendleri yakından takip etmek ve mutfağınızda uygulamak için Culinora'nın kurslarına göz atın. Her ay yeni içerikler ekleniyor!*
    `
    },
]

export function getBlogPost(slug: string): BlogPost | undefined {
    return blogPosts.find(post => post.slug === slug)
}

export function getAllBlogSlugs(): string[] {
    return blogPosts.map(post => post.slug)
}
