# Hostify Frontend - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Run the setup script

```bash
cd scripts
./setup-frontend.sh
```

### Step 2: Navigate to frontend directory

```bash
cd ../fe
```

### Step 3: Follow the build guide

Open and follow: [docs/FRONTEND_BUILD_GUIDE.md](./FRONTEND_BUILD_GUIDE.md)

---

## 📋 Essential Commands

### Development

```bash
npm run dev           # Start dev server (http://localhost:5173)
npm run build         # Build for production
npm run preview       # Preview production build
```

### Code Quality

```bash
npm run check         # Type check
npm run lint          # Run ESLint
npm run format        # Format with Prettier
```

### Testing

```bash
npm run test          # Run Vitest tests
npm run test:e2e      # Run Playwright E2E tests
```

---

## 🗂️ Project Structure Overview

```
fe/
├── src/
│   ├── lib/
│   │   ├── components/    # Svelte components
│   │   ├── stores/        # State management
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   ├── routes/            # Pages and routing
│   │   ├── +layout.svelte
│   │   ├── +page.svelte
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── repositories/
│   │   ├── deployments/
│   │   └── auth/callback/
│   └── app.css
└── .env
```

---

## 🎯 Key Files to Create (in order)

### 1. Core Setup Files

- [ ] `tailwind.config.js` - Tailwind configuration
- [ ] `svelte.config.js` - SvelteKit config
- [ ] `.env` - Environment variables
- [ ] `src/app.css` - Global styles

### 2. Type Definitions

- [ ] `src/lib/types/auth.types.ts`
- [ ] `src/lib/types/repo.types.ts`
- [ ] `src/lib/types/deployment.types.ts`

### 3. Core Services

- [ ] `src/lib/services/api.ts` - API client
- [ ] `src/lib/services/auth.service.ts`
- [ ] `src/lib/services/repo.service.ts`
- [ ] `src/lib/services/deploy.service.ts`

### 4. State Management

- [ ] `src/lib/stores/auth.ts`

### 5. Layouts

- [ ] `src/routes/+layout.ts` - Root layout logic
- [ ] `src/routes/+layout.svelte` - Root layout UI

### 6. Pages

- [ ] `src/routes/+page.svelte` - Home page
- [ ] `src/routes/login/+page.svelte`
- [ ] `src/routes/auth/callback/+page.svelte`
- [ ] `src/routes/dashboard/+page.svelte`
- [ ] `src/routes/repositories/+page.svelte`
- [ ] `src/routes/deployments/+page.svelte`

### 7. Components

- [ ] `src/lib/components/Header.svelte`
- [ ] `src/lib/components/Footer.svelte`
- [ ] `src/lib/components/LoadingSpinner.svelte`
- [ ] `src/lib/components/RepoCard.svelte`
- [ ] `src/lib/components/DeploymentCard.svelte`
- [ ] `src/lib/components/DeployModal.svelte`

---

## 🔑 Key Features to Implement

### Authentication Flow

1. User clicks "Login with GitHub"
2. Redirected to `/api/v1/auth/github`
3. GitHub OAuth flow
4. Callback to `/auth/callback`
5. Token stored in cookie
6. User info fetched and stored in auth store

### Deployment Flow

1. User browses repositories
2. Clicks "Deploy" on a repo
3. Modal opens with subdomain input
4. Submits deployment request
5. Backend clones repo and uploads to Azure
6. User redirected to deployments page

### API Endpoints

| Method | Endpoint                       | Description       |
| ------ | ------------------------------ | ----------------- |
| GET    | `/api/v1/auth/github`          | Start OAuth       |
| GET    | `/api/v1/auth/github/callback` | OAuth callback    |
| GET    | `/api/v1/auth/me`              | Get current user  |
| POST   | `/api/v1/auth/logout`          | Logout            |
| GET    | `/api/v1/repo/repositories`    | List repos        |
| GET    | `/api/v1/repo/deployments`     | List deployments  |
| POST   | `/api/v1/deploy`               | Deploy a repo     |
| DELETE | `/api/v1/repo/deployments/:id` | Delete deployment |

---

## 🎨 Styling with Tailwind

### Common Classes

```html
<!-- Buttons -->
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  <!-- Cards -->
  <div class="bg-white rounded-lg shadow hover:shadow-lg p-6">
    <!-- Input -->
    <input
      class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    />

    <!-- Container -->
    <div class="container mx-auto px-4 py-8"></div>
  </div>
</button>
```

---

## 🔧 Environment Variables

### Development (`.env`)

```env
PUBLIC_API_BASE_URL=http://localhost:8000
PUBLIC_FRONTEND_URL=http://localhost:5173
```

### Production

```env
PUBLIC_API_BASE_URL=https://api.yourdomain.com
PUBLIC_FRONTEND_URL=https://yourdomain.com
```

---

## 🐛 Troubleshooting

### CORS Errors

- Ensure backend has CORS enabled for frontend URL
- Check `withCredentials: true` in axios config

### Authentication Not Working

- Verify token is being stored in cookies
- Check browser console for errors
- Ensure backend is running

### Deployment Fails

- Check network tab for API errors
- Verify GitHub repo URL is correct
- Ensure backend has proper Azure credentials

---

## 📚 Resources

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Full Build Guide](./FRONTEND_BUILD_GUIDE.md)

---

## ✅ Testing Checklist

Before going to production:

- [ ] Login with GitHub works
- [ ] User can view repositories
- [ ] User can deploy a repository
- [ ] Deployments list shows correct data
- [ ] User can visit deployed site
- [ ] User can delete deployment
- [ ] Logout works correctly
- [ ] Mobile responsive design works
- [ ] Error messages are clear
- [ ] Loading states are visible

---

## 🚀 Deployment

### Build for production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

### Deploy to Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

---

**Need help? Check the [full guide](./FRONTEND_BUILD_GUIDE.md) for detailed instructions!**
