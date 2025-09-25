# Local Development Setup Guide

## Option 1: Full Local Development with Mock AI

For development and testing without Cloudflare Workers AI, you can run the frontend locally with mock responses.

### Start Frontend Development Server

```bash
cd client
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Mock API Responses

The frontend includes mock responses for testing the UI workflow without needing the full Cloudflare setup.

## Option 2: Full Cloudflare Development

For complete functionality including AI features, you'll need:

### 1. Cloudflare Account Setup

```bash
wrangler login
```

### 2. Create KV Namespaces

```bash
wrangler kv:namespace create "RECIPE_DB"
wrangler kv:namespace create "NUTRITION_DB"
```

### 3. Update wrangler.toml

Replace the namespace IDs in wrangler.toml with your actual IDs.

### 4. Start Development Server

```bash
wrangler dev
```

This will start:
- Worker at `http://localhost:8787`
- Frontend at `http://localhost:3000`

## Testing Workflow

### 1. Basic UI Testing (No Cloudflare Required)

1. Open `http://localhost:3000`
2. Test navigation between sections
3. Test form inputs and interactions
4. Test responsive design
5. Test timer functionality

### 2. Full Feature Testing (Requires Cloudflare)

1. Set up Cloudflare account and KV namespaces
2. Start `wrangler dev`
3. Test AI recipe generation
4. Test voice processing
5. Test meal planning
6. Test nutrition analysis

## Mock Data for Testing

The application includes sample data for testing:

- Sample recipes
- Mock user preferences
- Test pantry ingredients
- Demo meal plans
