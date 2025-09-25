# Deployment Guide

This guide will walk you through deploying the Smart Recipe Agent to Cloudflare's platform.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **Node.js**: Version 18 or higher
4. **Workers AI Access**: Ensure your account has Workers AI enabled

## Step 1: Initial Setup

### 1.1 Login to Cloudflare
```bash
wrangler login
```
Follow the prompts to authenticate with your Cloudflare account.

### 1.2 Verify Workers AI Access
```bash
wrangler ai models list
```
This should show available AI models. If you get an error, you may need to enable Workers AI in your account.

## Step 2: Create KV Namespaces

### 2.1 Create Recipe Database
```bash
wrangler kv:namespace create "RECIPE_DB"
```
Copy the namespace ID from the output.

### 2.2 Create Nutrition Database
```bash
wrangler kv:namespace create "NUTRITION_DB"
```
Copy the namespace ID from the output.

### 2.3 Create Preview Namespaces (for development)
```bash
wrangler kv:namespace create "RECIPE_DB" --preview
wrangler kv:namespace create "NUTRITION_DB" --preview
```

## Step 3: Configure wrangler.toml

Update the `wrangler.toml` file with your actual namespace IDs:

```toml
[[kv_namespaces]]
binding = "RECIPE_DB"
id = "your_recipe_db_namespace_id_here"
preview_id = "your_recipe_db_preview_id_here"

[[kv_namespaces]]
binding = "NUTRITION_DB"
id = "your_nutrition_db_namespace_id_here"
preview_id = "your_nutrition_db_preview_id_here"
```

## Step 4: Deploy the Application

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Deploy to Cloudflare
```bash
npm run deploy
```

This will:
- Build the worker code
- Deploy to Cloudflare Workers
- Deploy the frontend to Cloudflare Pages

### 4.3 Verify Deployment
After deployment, you should see output with your application URLs:
- Worker URL: `https://smart-recipe-agent.your-subdomain.workers.dev`
- Pages URL: `https://smart-recipe-agent.pages.dev`

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add Custom Domain
In the Cloudflare dashboard:
1. Go to Pages → Your Project
2. Click "Custom domains"
3. Add your domain
4. Update DNS records as instructed

### 5.2 Update CORS Settings
If using a custom domain, update the CORS headers in `src/worker.js`:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## Step 6: Environment Variables

### 6.1 Set Production Variables
```bash
wrangler secret put ENVIRONMENT
# Enter: production
```

### 6.2 Verify Configuration
```bash
wrangler whoami
wrangler deployments list
```

## Development Workflow

### Local Development
```bash
# Start development server
npm run dev

# This will start:
# - Worker at http://localhost:8787
# - Frontend at http://localhost:3000
```

### Testing
```bash
# Run tests (if available)
npm test

# Test API endpoints
curl http://localhost:8787/api/recipes/search?q=chicken
```

### Staging Deployment
```bash
# Deploy to staging
wrangler deploy --env staging
```

## Monitoring and Debugging

### 1. View Logs
```bash
# Real-time logs
wrangler tail

# Historical logs
wrangler tail --format=pretty
```

### 2. Monitor Performance
- Check Cloudflare Analytics dashboard
- Monitor Workers AI usage
- Track KV storage usage

### 3. Debug Issues
```bash
# Check worker status
wrangler deployments list

# View worker details
wrangler deployments tail <deployment-id>
```

## Troubleshooting

### Common Issues

#### 1. Workers AI Not Available
```
Error: Workers AI not enabled
```
**Solution**: Enable Workers AI in your Cloudflare account dashboard.

#### 2. KV Namespace Not Found
```
Error: KV namespace not found
```
**Solution**: Verify namespace IDs in `wrangler.toml` match your created namespaces.

#### 3. CORS Issues
```
Error: CORS policy blocked
```
**Solution**: Update CORS headers in the worker code for your domain.

#### 4. AI Model Errors
```
Error: Model not available
```
**Solution**: Check available models with `wrangler ai models list`.

### Performance Optimization

#### 1. Reduce Cold Starts
- Use Durable Objects for stateful operations
- Implement proper caching strategies
- Optimize AI model usage

#### 2. Minimize AI Costs
- Cache recipe responses
- Use smaller models for simple tasks
- Implement request batching

#### 3. Optimize Frontend
- Enable Cloudflare caching
- Use CDN for static assets
- Implement service worker caching

## Security Considerations

### 1. API Security
- Implement rate limiting
- Add request validation
- Use proper error handling

### 2. Data Protection
- Encrypt sensitive data in KV storage
- Implement proper access controls
- Regular security audits

### 3. AI Safety
- Validate AI responses
- Implement content filtering
- Monitor for inappropriate content

## Scaling Considerations

### 1. High Traffic
- Use Cloudflare's global network
- Implement request queuing
- Monitor resource usage

### 2. Data Growth
- Implement data archiving
- Use efficient data structures
- Regular cleanup of old data

### 3. Feature Expansion
- Modular architecture
- Microservices pattern
- API versioning

## Maintenance

### Regular Tasks
1. **Weekly**: Monitor usage and performance
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Review and optimize AI model usage
4. **Annually**: Security audit and architecture review

### Backup Strategy
- KV data is automatically backed up by Cloudflare
- Export critical data regularly
- Maintain deployment rollback capability

## Support and Resources

### Documentation
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Durable Objects Documentation](https://developers.cloudflare.com/durable-objects/)

### Community
- [Cloudflare Community Forum](https://community.cloudflare.com/)
- [Workers Discord](https://discord.gg/cloudflaredev)

### Professional Support
- [Cloudflare Support](https://support.cloudflare.com/)
- [Enterprise Support](https://www.cloudflare.com/enterprise/)

---

For additional help, please refer to the main README.md or open an issue in the repository.
