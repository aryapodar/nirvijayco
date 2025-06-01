# Nirvijay & Co Website Deployment Guide

## Prerequisites
- Vercel account (free tier is sufficient)
- Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 18+ installed locally (for development)

## Project Structure
```
nirvijay-website/
├── public/
│   ├── images/
│   │   ├── Logo.png
│   │   └── profile-photo.png
│   └── favicon.ico
├── styles/
│   └── main.css
├── scripts/
│   └── main.js
├── api/
│   └── contact.js
├── index.html
├── package.json
├── vercel.json
├── .env.example
└── DEPLOYMENT.md
```

## Step 1: Set Up Your Repository

1. Create a new repository on GitHub/GitLab/Bitbucket
2. Clone the repository locally:
   ```bash
   git clone https://github.com/your-username/nirvijay-website.git
   cd nirvijay-website
   ```

3. Add all your files to the repository:
   - Copy `index.html`, `main.css`, `main.js` files
   - Create `api/contact.js` with the provided code
   - Add `package.json`, `vercel.json`, and `.env.example`
   - Add your logo and profile images to `public/images/`

4. Commit and push:
   ```bash
   git add .
   git commit -m "Initial website setup"
   git push origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect the configuration
5. Click "Deploy"

### Option B: Via Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

## Step 3: Set Up Vercel KV Database

1. In your Vercel dashboard, go to your project
2. Navigate to the "Storage" tab
3. Click "Create Database"
4. Choose "KV" (Key-Value store)
5. Name it `nirvijay-contact-db`
6. Select your region (choose closest to your users)
7. Click "Create"

The KV database environment variables will be automatically added to your project.

## Step 4: Configure Environment Variables

1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. The KV variables should already be there from Step 3
3. Optionally add other variables:
   ```
   NOTIFICATION_EMAIL=nirvijayco@gmail.com
   NODE_ENV=production
   ```

## Step 5: Test Your Deployment

1. Visit your deployed website URL (e.g., `https://your-project.vercel.app`)
2. Test the contact form:
   - Fill out all required fields
   - Solve the CAPTCHA
   - Submit the form
   - You should see a success message

3. Verify data storage:
   - Go to Vercel dashboard → Storage → your KV database
   - You should see stored contact submissions

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard, go to "Settings" → "Domains"
2. Add your custom domain (e.g., `nirvijayco.com`)
3. Follow Vercel's instructions to configure DNS
4. Vercel will automatically provision SSL certificate

## Step 7: Monitor and Maintain

### View Form Submissions
Access stored data via Vercel KV dashboard or create an admin panel.

### Monitor Performance
- Check Vercel Analytics for page views and performance
- Monitor function execution times in Vercel dashboard

### Update Content
Simply push changes to your Git repository - Vercel will auto-deploy.

## Troubleshooting

### Common Issues

**Form not submitting:**
- Check browser console for errors
- Verify API endpoint is accessible at `/api/contact`
- Check Vercel function logs

**Database connection errors:**
- Verify KV environment variables are set
- Check if KV database is active
- Review function logs in Vercel dashboard

**Images not loading:**
- Ensure images are in `public/images/` directory
- Check file names and extensions match HTML references
- Verify image files were committed to repository

### Getting Help
- Vercel Documentation: https://vercel.com/docs
- KV Database Docs: https://vercel.com/docs/storage/vercel-kv
- Contact form issues: Check `/api/contact` logs in Vercel dashboard

## Security Considerations

1. **Input Validation**: The API includes comprehensive validation
2. **Rate Limiting**: Consider adding rate limiting for production
3. **SPAM Protection**: Built-in CAPTCHA and keyword filtering
4. **Data Privacy**: Store minimal necessary data only
5. **SSL**: Vercel provides automatic HTTPS

## Analytics and Insights

Your contact form automatically tracks:
- Daily submission counts
- Service type breakdown
- Referrer sources
- Error logs

Access this data through the KV database or build a simple admin dashboard.

## Cost Estimation

**Vercel Free Tier Includes:**
- 100GB bandwidth per month
- 12 serverless function executions per day
- 1 commercial project
- Automatic HTTPS

**KV Database:**
- 30,000 read requests per month (free)
- 1,000 write requests per month (free)
- 256MB storage (free)

This should be more than sufficient for a small business website.

## Next Steps

1. **Email Notifications**: Set up email alerts for new form submissions
2. **Admin Dashboard**: Create a simple dashboard to view submissions
3. **Analytics Integration**: Add Google Analytics or similar
4. **SEO Optimization**: Add meta tags, sitemap, robots.txt
5. **Performance**: Optimize images and add caching headers

## Support

If you encounter any issues during deployment, check:
1. Vercel function logs
2. Browser developer console
3. Network tab for API request/response
4. This documentation for troubleshooting steps