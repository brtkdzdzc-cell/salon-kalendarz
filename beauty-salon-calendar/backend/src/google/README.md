# Google Contacts import (opcjonalnie)

Ta aplikacja ma gotowy „hak” na import z Google Contacts przez People API, ale wymaga:
1) Projektu w Google Cloud,
2) Włączonego People API,
3) Ekranu zgody OAuth,
4) Utworzonych danych OAuth Client ID.

## Kroki (skrót)
- Google Cloud Console -> APIs & Services -> Library -> **People API** -> Enable
- OAuth consent screen: skonfiguruj
- Credentials -> Create Credentials -> OAuth client ID -> Web application
- Authorized redirect URI:
  - `https://twojserwer.pl/api/google/callback`

## Zmienne .env (backend)
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `GOOGLE_REDIRECT_URL=...`

## Co dalej?
W tym szablonie import z Google jest wyłączony domyślnie (żeby działało „od razu” bez kluczy).
Jeśli chcesz, żebym dopiął pełną integrację i ekran w aplikacji (klik -> autoryzacja -> pobranie kontaktów -> zapis do klientek),
napisz: „włącz import z Google”.
