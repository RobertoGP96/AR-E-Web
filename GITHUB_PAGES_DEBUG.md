# GitHub Pages Configuration

## Current Status
- **Repository**: AR-E-Web  
- **Owner**: RobertoGP96
- **GitHub Pages URL**: https://robertogp96.github.io/AR-E-Web/

## Required Settings in GitHub:
1. Go to: https://github.com/RobertoGP96/AR-E-Web/settings/pages
2. **Source**: GitHub Actions
3. **Branch**: Not needed (using Actions)

## Troubleshooting Steps:

### 1. Check Actions Status
- Visit: https://github.com/RobertoGP96/AR-E-Web/actions
- Look for "Deploy to GitHub Pages" workflow
- Check if it's green ✅, yellow 🟡, or red ❌

### 2. Common Issues:

#### Issue A: Base path mismatch
- Current config: `/AR-E-Web/`
- Should match repository name exactly

#### Issue B: Build environment
- Make sure NODE_ENV=production is set
- Verify assets are generated correctly

#### Issue C: 404 errors on routes
- 404.html file should handle SPA routing
- Script in index.html should decode URLs

### 3. Manual Verification:
```bash
# Test build locally:
cd apps/client
pnpm build
# Check if dist/ folder has all files

# Test with GitHub Pages base:
# Open dist/index.html and verify paths
```

## Alternative: Quick Deploy Test
If GitHub Pages continues failing, we can:
1. Try Netlify (drag & drop dist folder)
2. Use Vercel (connects to GitHub automatically)
3. Use Surge.sh (simple CLI deploy)