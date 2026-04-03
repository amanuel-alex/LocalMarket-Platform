# EthioLocal Telegram bot

Premium-style UX: inline keyboards, HTML formatting, product cards, AI assistant (Gemini when configured on the API, otherwise rule-based `/assistant/chat`), search, trending, location-aware ranking, and deep links to the Next.js app for checkout and partner signup.

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather), copy the token.

2. Copy env:

   ```bash
   cp .env.example .env
   ```

3. Fill `TELEGRAM_BOT_TOKEN`, and ensure `API_BASE_URL` points at your running EthioLocal API (`http://localhost:4000/api/v1` in dev).

4. Run:

   ```bash
   npm install
   npm run dev
   ```

## Commands

| Command   | Action                                      |
|----------|---------------------------------------------|
| `/start` | Welcome + main menu (inline buttons)      |
| `/menu`  | Same as start                               |
| `/link`  | Link account (phone/email → password) for **My Orders** |
| `/unlink`| Clear stored tokens                         |
| `/help`  | Short help                                  |

**My Orders** uses `GET /orders` with the JWT from `/link`. Tokens are held in memory on the bot process only (restart clears them). For production, persist securely or add an OAuth-style flow.

## API requirements

- `GET /products/ranked`, `/products/search`, `/products`, `/products/:id`, `/products/:id/compare`
- `POST /assistant/chat`, optional `POST /assistant/gemini/chat` + `GET /assistant/gemini/status`
- `POST /auth/login`, `GET /orders` (with Bearer token)

The API must be reachable from the machine running the bot. For devices testing against a laptop, use your LAN IP in `API_BASE_URL`.

## Product images

Telegram only loads **HTTPS** photo URLs. Localhost image URLs are skipped; the bot still sends rich text cards.

## Security

- Do not commit `.env`.
- `/link` in Telegram is convenient for demos only; prefer web login + a proper token exchange for production.
