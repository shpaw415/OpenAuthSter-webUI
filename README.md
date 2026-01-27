# OpenAuthster WebUI

> ⚠️ **Work in Progress** - This project is under active development. Please [submit issues](https://github.com/shpaw415/openauth-webui/issues) if you encounter bugs or inconsistencies.

## Overview

OpenAuthster WebUI is the management dashboard for your [OpenAuthster](https://github.com/shpaw415/openauthster) authentication system. It provides an intuitive interface to:

- 🎨 **Customize Themes** - Brand your authentication pages
- 🔧 **Configure Providers** - Set up OAuth providers (Google, GitHub, etc.)
- 📊 **Manage Projects** - Orchestrate multiple applications from one dashboard

## Prerequisites

Before setting up the WebUI, you must first deploy the OpenAuthster issuer server:

👉 [OpenAuthster Issuer Setup](https://github.com/shpaw415/OpenAuthSter-issuer)

## Installation

### 1. Fork & Clone

Fork this repository to your GitHub account (recommended as private), then clone it:

```bash
git clone https://github.com/shpaw415/openauth-webui.git
cd openauth-webui
```

### 2. Configure Wrangler

rename `wrangler.example.json` to `wrangler.json` then,
update your `wrangler.json` with the following settings:

#### Database Binding

Add the D1 database from your OpenAuthster issuer deployment:

```json
{
  "d1_databases": [
    {
      "binding": "PROJECT_DB",
      "database_name": "<your-database-name>",
      "database_id": "<your-database-id>"
    }
  ]
}
```

> 💡 You can find the `database_id` and `database_name` in your OpenAuthster issuer's `wrangler.json`

#### Environment Variables

Configure the required environment variables:

| Variable              | Description                | Example                                      |
| --------------------- | -------------------------- | -------------------------------------------- |
| `PUBLIC_ISSUER`       | OpenAuthster issuer domain | `https://auth.yourdomain.com`                |
| `PUBLIC_REDIRECT_URI` | WebUI callback URL         | `https://admin.yourdomain.com/auth/callback` |

### 3. Deploy

Deploy to Cloudflare Pages:

```bash
npx wrangler pages deploy
```

## Development Setup

For local development and contributing to the WebUI:

### Requirements

- [Bun.js](https://bun.sh) - Fast JavaScript runtime and package manager

### Getting Started

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Configure environment**

   Create a `.env` file with your local configuration:

   ```env
   PUBLIC_ISSUER=http://localhost:8787
   PUBLIC_REDIRECT_URI=http://localhost:8788/auth/callback
   ```

3. **Start development server**

   ```bash
   bun dev
   ```

## Project Structure

```
openauth-webui/
├── src/              # Application source code
├── functions/        # Cloudflare Pages Functions (API routes) **Build only**
├── static/           # Static assets
├── templates/        # Email and page templates
├── drizzle/          # Database migrations
└── wrangler.jsonc    # Cloudflare configuration
```

## Related Repositories

- [OpenAuthster](https://github.com/shpaw415/openauthster) - Main project documentation
- [OpenAuthster Issuer](https://github.com/shpaw415/openauth-multi-tenant-server-provider) - Authentication server
- [Shared Types](https://github.com/shpaw415/OpenAuthSter-shared) - TypeScript types and client SDK

## License

> License information coming soon
