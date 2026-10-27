# EvTick — IT Talep ve Takip Sistemi

Mobil uyumlu, çok kiracılı IT destek talep ve takip web uygulaması.

## Özellikler

- **Çok kiracılı yapı:** Her şirketin kendi kodu ile izole veri
- **Kimlik doğrulama:** Şirket kodu + e-posta + şifre + e-posta doğrulama
- **Rol bazlı erişim:** Çalışan, IT Destek, Yönetici, Sistem Yöneticisi
- **Tam kapsamlı sistem paneli:** Dashboard, şirket/kullanıcı/ticket yönetimi, super admin davet, denetim kaydı
- **Ticket yönetimi:** Talep açma, durum takibi, platform geneli müdahale
- **Canlı destek chat:** Ticket bazlı gerçek zamanlı mesajlaşma

## Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Supabase projesi oluşturun

1. [supabase.com](https://supabase.com) üzerinde yeni proje oluşturun
2. SQL Editor'de migration dosyalarını **sırayla ve ayrı ayrı** çalıştırın:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_fix_auth_trigger.sql`
   - `supabase/migrations/003_add_super_admin_enum.sql` ← **tek başına çalıştırın, Run**
   - `supabase/migrations/004_system_admin.sql` ← **sonra bunu çalıştırın**
   - `supabase/migrations/005_system_panel_full.sql` ← **sistem paneli genişletmeleri**

   > **Not:** `003` ve `004` aynı seferde birleştirilmemeli. PostgreSQL enum değeri commit edilmeden kullanılamaz.
3. Authentication > URL Configuration'da Site URL ve Redirect URL ekleyin:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 3. Ortam değişkenlerini ayarlayin

**Vercel (Production):** Project Settings → Environment Variables

| Değişken | Değer |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` (**zorunlu** — sadece `SUPABASE_URL` yetmez) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` (Vercel domain'iniz) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (**super admin davet için zorunlu — yalnızca sunucu**) |

> **Güvenlik:** `SUPABASE_SERVICE_ROLE_KEY` asla istemci tarafına eklenmemeli. Yalnızca Vercel sunucu ortam değişkenlerinde tutulmalıdır.

**Supabase Auth URL ayarları** (Authentication → URL Configuration):

- Site URL: `https://your-app.vercel.app`
- Redirect URLs:
  - `https://your-app.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (local geliştirme için)

**Local:**

```bash
cp .env.local.example .env.local
```

`.env.local` dosyasına `SUPABASE_SERVICE_ROLE_KEY` ekleyin (Supabase Dashboard → Settings → API → service_role).

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

## Sistem Yöneticisi (Super Admin)

### Panelden super admin davet (önerilen)

1. İlk super admin'i SQL ile oluşturun (aşağıdaki fallback) veya mevcut hesabınızı yükseltin
2. `/system/admins` sayfasından e-posta + ad soyad ile davet gönderin
3. Davet edilen kullanıcı e-postasındaki bağlantıyla şifresini belirler
4. Giriş şirket kodu: **EVTK**

### SQL fallback (ilk kurulum)

Migration sonrası Supabase SQL Editor'de:

```sql
UPDATE profiles
SET
  role = 'super_admin',
  company_id = (SELECT id FROM companies WHERE code = 'EVTK')
WHERE full_name = 'Adınız';
```

### Sistem paneli (`/system`)

| Bölüm | Yol | Açıklama |
|-------|-----|----------|
| Dashboard | `/system` | KPI, grafikler, aktivite, uyarılar |
| Şirketler | `/system/companies` | Arama, filtre, detay sekmeleri |
| Kullanıcılar | `/system/users` | Platform geneli rol yönetimi |
| Talepler | `/system/tickets` | Tam müdahale (durum, ata, kapat) |
| Yöneticiler | `/system/admins` | Super admin davet/yükseltme |
| Denetim | `/system/audit` | Admin işlem geçmişi |

### Şirket kodu oluşturma

1. **Yeni Şirket** → Manuel kod (ör. `ACME01`) veya otomatik kod
2. Oluşturulan kodu şirket çalışanlarına verin
3. Çalışanlar `/register` sayfasında bu kodla kayıt olur

Pasif şirketler kayıt ve girişte reddedilir.

### Roller

| Rol | Panel | Yetki |
|-----|-------|-------|
| `super_admin` | `/system` | Tüm platform, şirket/kullanıcı/ticket yönetimi |
| `admin` | `/admin/users` | Şirket içi kullanıcı yönetimi |
| `support` | `/support` | Şirket ticketları |
| `employee` | `/tickets` | Kendi ticketları |

## Teknoloji

- Next.js 16 (App Router)
- Supabase (Auth, Postgres, Realtime)
- Tailwind CSS + shadcn/ui
- TypeScript
