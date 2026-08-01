# Borsa Gündem

GitHub Pages üzerinde çalışan, Borsa İstanbul odaklı haber ve grafik sitesi.

## Özellikler

- TradingView üzerinden BIST 100, BIST 30, sektör ve hisse grafikleri
- GitHub Actions ile 15 dakikada bir yenilenen RSS haber akışı
- Basit anahtar kelime tabanlı olumlu / olumsuz / nötr haber etiketi
- Hisse veya haber arama
- Karanlık ve açık tema
- Mobil uyumlu tasarım
- KAP, Borsa İstanbul, SPK ve TCMB hızlı bağlantıları

## Kurulum

1. GitHub'da yeni ve herkese açık bir depo oluşturun.
2. Bu klasördeki bütün dosyaları deponun ana dizinine yükleyin.
3. **Settings → Pages** bölümüne girin.
4. **Build and deployment → Deploy from a branch** seçin.
5. Branch olarak **main**, klasör olarak **/(root)** seçip kaydedin.
6. **Actions** sekmesinden **Haberleri Güncelle** iş akışını bir kez elle çalıştırın.
7. İş akışının depoya yazabilmesi için gerekirse:
   **Settings → Actions → General → Workflow permissions → Read and write permissions** seçin.

Site adresi genellikle:
`https://KULLANICI-ADINIZ.github.io/DEPO-ADI/`

## Haber kaynaklarını değiştirme

`scripts/fetch_news.py` içindeki `FEEDS` listesine RSS adresi ekleyebilir veya mevcut kaynakları kaldırabilirsiniz.

## Önemli teknik not

GitHub Pages statik barındırmadır. Gizli API anahtarları JavaScript içine veya `.env` dosyasına konulmamalıdır. Bu projede anahtar gerektirmeyen RSS kaynakları sunucu tarafı yerine GitHub Actions üzerinde işlenir ve sonuç `data/news.json` dosyasına yazılır.

## Veri ve lisans notu

TradingView widget'ları kendi hizmet koşulları kapsamında yüklenir. Haber başlıkları ve kısa özetler kaynak sayfaya bağlantı vermek amacıyla gösterilir. Ticari kullanımdan önce her veri ve haber sağlayıcısının kullanım koşullarını ayrıca inceleyin.

Bu proje yatırım tavsiyesi sunmaz.
