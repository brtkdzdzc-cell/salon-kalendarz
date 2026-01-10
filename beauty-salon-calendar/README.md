# Beauty Salon Calendar (PWA) — gotowa aplikacja na serwer

Aplikacja do salonu kosmetycznego (wieloosobowa) z:
- logowaniem (administrator tworzy konta),
- kalendarzem rezerwacji przypisanym do pracowników,
- klientkami + historią zabiegów + „Ponów zabieg”,
- polami: czas, rodzaj zabiegu, uwagi,
- pracą wielu osób jednocześnie (odświeżanie na żywo przez WebSocket),
- działaniem na telefonie (responsywna PWA — można „zainstalować” na ekranie głównym),
- importem kontaktów: **vCard (.vcf)** z telefonu (działa od razu) + opcjonalnie import Google Contacts (opis w instrukcji).

## 1) Wymagania
- Node.js 18+ (backend i frontend)
- (opcjonalnie) Docker + Docker Compose

## 2) Szybki start (bez Dockera)
### Backend
```bash
cd backend
cp .env.example .env
npm i
npm run db:init
npm run dev
```

### Frontend
W drugim terminalu:
```bash
cd frontend
cp .env.example .env
npm i
npm run dev
```

Otwórz: http://localhost:5173

## 3) Logowanie (konto admina)
Po inicjalizacji bazy utworzone jest konto:
- login: **admin**
- hasło: **admin123**

Zmień hasło po uruchomieniu (panel Administratora).

## 4) Produkcja (deploy)
### Opcja A: Docker Compose (polecane)
```bash
docker compose up -d --build
```
Aplikacja: http://TwojSerwer

### Opcja B: manualnie
1. `backend`: `npm run build` niepotrzebne — to API. Uruchom np. PM2:
   ```bash
   cd backend
   npm i
   npm run db:init
   npm start
   ```
2. `frontend`: build statyczny:
   ```bash
   cd frontend
   npm i
   npm run build
   ```
   Skonfiguruj Nginx/Apache aby serwować `frontend/dist` oraz proxy `/api` i `/socket.io` do backendu.

## 5) Import kontaktów z telefonu (działa od razu)
W zakładce **Klientki** -> **Import vCard (.vcf)** wybierz plik z telefonu.
- Android: Kontakty -> Eksportuj -> .vcf
- iPhone: eksport przez iCloud lub aplikacje do eksportu kontaktów (plik .vcf)

## 6) Import z Google Contacts (opcjonalnie)
To wymaga własnego projektu Google Cloud + OAuth (People API).
W pliku `backend/.env` ustaw:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL` (np. `https://twojserwer.pl/api/google/callback`)

W kodzie jest gotowa integracja (endpointy), ale musisz podpiąć własne klucze.
Szczegóły: `backend/src/google/README.md`.

## 7) Bezpieczeństwo
Wersja „salonowa”: token logowania jest trzymany w `localStorage` aby użytkownik pozostawał zalogowany po zamknięciu strony.
Jeśli chcesz wersję „enterprise” (HttpOnly cookies + refresh tokens), daj znać — przygotuję wariant.

---

Miłego używania! 🙂
