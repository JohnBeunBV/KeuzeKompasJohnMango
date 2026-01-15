# Proof of Concept

## Vereisten

- React en Vite >= 18 (frontend)
- npm of yarn (frontend dependencies)
- Node.js (backend)
- MongoDB of andere database (afhankelijk van je setup)

## Setup Frontend

Navigeer naar de frontend-map:

```bash
cd frontend
```

Installeer dependencies:

```bash
npm install
```

Maak een `.env`-bestand aan in de `frontend/` map met de volgende inhoud:

```
VITE_API_URL=
```

**Uitleg:**

- `VITE_API_URL`: basis-URL van de backend API.

Start de frontend:

```bash
npm run dev
```

De frontend is nu bereikbaar.

## Setup Backend

Navigeer naar de backend-map:

```bash
cd backend
```

Installeer dependencies:

```bash
npm install -r requirements.txt
```

Maak een `.env`-bestand aan in de `backend/` map:

```
DATABASE_URL=
SECRET_KEY=
PORT=
```

**Uitleg:**

- `DATABASE_URL` → database connectie
- `SECRET_KEY` → voor authenticatie en JWT-tokens

## Belangrijke functies en tips

### Favorieten
Werkt alleen wanneer een gebruiker ingelogd is en een geldig JWT-token in localStorage aanwezig is.

### Fallbacks
Velden die leeg zijn (zoals beschrijving, leerdoelen of tags) tonen standaardwaarden in de frontend.

### .env bestanden
Beide projecten hebben een eigen `.env` nodig. Zorg dat je deze niet commit naar Git.

### Tags en detailpagina
Modules tonen tags en detailinformatie op basis van de backend data. Tags worden automatisch geparsed en weergegeven, zelfs als sommige velden leeg zijn.

## Productie

- Let op CORS-instellingen
- Gebruik HTTPS
- Bewaar SECRET_KEY veilig

## Quickstart

### Backend starten
```bash
npm run dev
```
in de server map (of build hem en `npm run start`)

### Frontend starten
```bash
npm run dev
```
in de react-app map (of build hem en `npm run start`)

Log in met een testaccount of maak een account aan.

## Testgegevens

Om snel te testen kun je de backend vullen met testdata:

**Gebruiker:**
- email: `test@example.com`
- password: `Test123!`

**Voorbeeld VKM/module:**
- name: "Afvalmonitoring Module"
- studycredit: 3
- location: "Gemeente Breda"
- shortdescription: "Leer over slim afvalbeheer"
- description: "Een uitgebreide module over het monitoren en voorspellen van zwerfafval"
- learningoutcomes: "Inzicht in AI-gebaseerde afvalvoorspellingen"
- module_tags: ["AI", "Monitoring", "Data"]
