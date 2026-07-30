# EvTick — IT Talep ve Takip Sistemi

Mobil uyumlu, çok kiracılı IT destek talep ve takip web uygulaması.

## Özellikler

- **Çok kiracılı yapı:** Her şirketin kendi kodu ile izole veri
- **Kimlik doğrulama:** Şirket kodu + e-posta + şifre + e-posta doğrulama
- **Rol bazlı erişim:** Çalışan, IT Destek, Yönetici
- **Ticket yönetimi:** Talep açma, durum takibi, kapatma
- **Canlı destek chat:** Ticket bazlı gerçek zamanlı mesajlaşma

## Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Supabase projesi oluşturun

1. [supabase.com](https://supabase.com) üzerinde yeni proje oluşturun
2. SQL Editor'de `supabase/migrations/001_initial_schema.sql` dosyasını çalıştırın
3. Authentication > URL Configuration'da Site URL ve Redirect URL ekleyin:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 3. Ortam değişkenlerini ayarlayın

```bash
cp .env.local.example .env.local
```

`.env.local` dosyasını Supabase proje ayarlarından alınan değerlerle doldurun:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

## Test Hesabı

Migration sonrası demo şirket kodu: **DEMO01**

1. `/register` sayfasından kayıt olun (şirket kodu: DEMO01)
2. E-posta doğrulamasını tamamlayın
3. `/login` ile giriş yapın

Yönetici rolü atamak için Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE full_name = 'Adınız';
```

## Teknoloji

- Next.js 16 (App Router)
- Supabase (Auth, Postgres, Realtime)
- Tailwind CSS + shadcn/ui
- TypeScript
