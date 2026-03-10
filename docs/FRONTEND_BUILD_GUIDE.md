# Hostify Frontend Build Guide (SvelteKit)

A complete step-by-step guide to build the Hostify frontend using SvelteKit.

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Project Structure](#2-project-structure)
3. [Environment Configuration](#3-environment-configuration)
4. [Core Utilities & Services](#4-core-utilities--services)
5. [Authentication System](#5-authentication-system)
6. [Pages & Routes](#6-pages--routes)
7. [Components](#7-components)
8. [Styling](#8-styling)
9. [Testing](#9-testing)
10. [Deployment](#10-deployment)

---

## 1. Project Setup

### Step 1.1: Initialize SvelteKit Project

```bash
# Navigate to project root
cd /home/rudra/Desktop/hostify

# Create SvelteKit project
npm create svelte@latest fe

# Choose the following options:
# ✔ Which template? › Skeleton project
# ✔ Add type checking with TypeScript? › Yes, using TypeScript syntax
# ✔ Add ESLint? › Yes
# ✔ Add Prettier? › Yes
# ✔ Add Playwright? › Yes
# ✔ Add Vitest? › Yes
```

### Step 1.2: Install Dependencies

```bash
cd fe
npm install

# Install additional dependencies
npm install -D tailwindcss postcss autoprefixer
npm install axios
npm install js-cookie
npm install @types/js-cookie -D
npm install lucide-svelte
npm install svelte-sonner
```

### Step 1.3: Initialize Tailwind CSS

```bash
npx tailwindcss init -p
```

---

## 2. Project Structure

Create the following folder structure:

```
fe/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Header.svelte
│   │   │   ├── Footer.svelte
│   │   │   ├── RepoCard.svelte
│   │   │   ├── DeploymentCard.svelte
│   │   │   ├── DeployModal.svelte
│   │   │   └── LoadingSpinner.svelte
│   │   ├── stores/
│   │   │   ├── auth.ts
│   │   │   └── toast.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── deploy.service.ts
│   │   │   └── repo.service.ts
│   │   └── types/
│   │       ├── auth.types.ts
│   │       ├── repo.types.ts
│   │       └── deployment.types.ts
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +layout.ts
│   │   ├── +page.svelte
│   │   ├── login/
│   │   │   └── +page.svelte
│   │   ├── dashboard/
│   │   │   └── +page.svelte
│   │   ├── repositories/
│   │   │   └── +page.svelte
│   │   ├── deployments/
│   │   │   ├── +page.svelte
│   │   │   └── [id]/
│   │   │       └── +page.svelte
│   │   └── auth/
│   │       └── callback/
│   │           └── +page.svelte
│   └── app.css
├── static/
│   └── favicon.png
└── svelte.config.js
```

---

## 3. Environment Configuration

### Step 3.1: Create `.env` file

```bash
# In fe/ directory
touch .env
```

Add the following:

```env
PUBLIC_API_BASE_URL=http://localhost:8000
PUBLIC_FRONTEND_URL=http://localhost:5173
```

### Step 3.2: Update `svelte.config.js`

```javascript
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $lib: "src/lib",
      $components: "src/lib/components",
      $stores: "src/lib/stores",
      $services: "src/lib/services",
      $types: "src/lib/types",
    },
  },
};

export default config;
```

### Step 3.3: Configure Tailwind

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
    },
  },
  plugins: [],
};
```

---

## 4. Core Utilities & Services

### Step 4.1: API Client (`src/lib/services/api.ts`)

```typescript
import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { browser } from "$app/environment";

const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:8000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    // Request interceptor to add JWT token
    this.client.interceptors.request.use((config) => {
      if (browser) {
        const token = Cookies.get("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && browser) {
          // Clear auth and redirect to login
          Cookies.remove("auth_token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### Step 4.2: Type Definitions

**`src/lib/types/auth.types.ts`:**

```typescript
export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  githubId: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
```

**`src/lib/types/repo.types.ts`:**

```typescript
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}
```

**`src/lib/types/deployment.types.ts`:**

```typescript
export interface Deployment {
  id: string;
  subdomain: string;
  folderName: string;
  repoUrl: string;
  repoName?: string;
  createdAt: string;
  lastDeployedAt: string;
  url: string;
  userId: string;
}

export interface DeployRequest {
  ghlink: string;
  subdomain?: string;
}

export interface DeployResponse {
  success: boolean;
  message: string;
  deploymentUrl: string;
  subdomain: string;
  folderName: string;
  deployment?: Deployment;
}
```

### Step 4.3: Auth Store (`src/lib/stores/auth.ts`)

```typescript
import { writable } from "svelte/store";
import type { User } from "$types/auth.types";
import { browser } from "$app/environment";
import Cookies from "js-cookie";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  return {
    subscribe,
    setUser: (user: User | null) => {
      update((state) => ({
        ...state,
        user,
        isAuthenticated: !!user,
        isLoading: false,
      }));
    },
    setLoading: (isLoading: boolean) => {
      update((state) => ({ ...state, isLoading }));
    },
    logout: () => {
      if (browser) {
        Cookies.remove("auth_token");
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },
  };
}

export const authStore = createAuthStore();
```

### Step 4.4: Service Files

**`src/lib/services/auth.service.ts`:**

```typescript
import { apiClient } from "./api";
import type { User } from "$types/auth.types";
import Cookies from "js-cookie";
import { authStore } from "$stores/auth";

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await apiClient.get<{ user: User }>("/api/v1/auth/me");
      return data.user;
    } catch (error) {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      Cookies.remove("auth_token");
      authStore.logout();
    }
  },

  getGithubLoginUrl(): string {
    const apiBase =
      import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:8000";
    return `${apiBase}/api/v1/auth/github`;
  },
};
```

**`src/lib/services/repo.service.ts`:**

```typescript
import { apiClient } from "./api";
import type { Repository } from "$types/repo.types";

export const repoService = {
  async listRepositories(): Promise<Repository[]> {
    const data = await apiClient.get<{ repositories: Repository[] }>(
      "/api/v1/repo/repositories",
    );
    return data.repositories;
  },
};
```

**`src/lib/services/deploy.service.ts`:**

```typescript
import { apiClient } from "./api";
import type {
  Deployment,
  DeployRequest,
  DeployResponse,
} from "$types/deployment.types";

export const deployService = {
  async deploy(request: DeployRequest): Promise<DeployResponse> {
    return await apiClient.post<DeployResponse>("/api/v1/deploy", request);
  },

  async listDeployments(): Promise<Deployment[]> {
    const data = await apiClient.get<{ deployments: Deployment[] }>(
      "/api/v1/repo/deployments",
    );
    return data.deployments;
  },

  async getDeployment(id: string): Promise<Deployment> {
    const data = await apiClient.get<{ deployment: Deployment }>(
      `/api/v1/repo/deployments/${id}`,
    );
    return data.deployment;
  },

  async deleteDeployment(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/repo/deployments/${id}`);
  },
};
```

---

## 5. Authentication System

### Step 5.1: Root Layout (`src/routes/+layout.ts`)

```typescript
import { authService } from "$services/auth.service";
import { authStore } from "$stores/auth";

export const ssr = false; // Disable SSR for client-side auth

export async function load() {
  authStore.setLoading(true);
  const user = await authService.getCurrentUser();
  authStore.setUser(user);
  return { user };
}
```

### Step 5.2: Layout Component (`src/routes/+layout.svelte`)

```svelte
<script lang="ts">
  import '../app.css';
  import { authStore } from '$stores/auth';
  import { page } from '$app/stores';
  import Header from '$components/Header.svelte';
  import Footer from '$components/Footer.svelte';
  import { Toaster } from 'svelte-sonner';

  $: isAuthPage = $page.url.pathname.startsWith('/auth') || $page.url.pathname === '/login';
</script>

<Toaster />

<div class="min-h-screen flex flex-col bg-gray-50">
  {#if !isAuthPage && $authStore.isAuthenticated}
    <Header />
  {/if}

  <main class="flex-1">
    <slot />
  </main>

  {#if !isAuthPage}
    <Footer />
  {/if}
</div>
```

### Step 5.3: Login Page (`src/routes/login/+page.svelte`)

```svelte
<script lang="ts">
  import { authStore } from '$stores/auth';
  import { authService } from '$services/auth.service';
  import { goto } from '$app/navigation';
  import { Github } from 'lucide-svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    if ($authStore.isAuthenticated) {
      goto('/dashboard');
    }
  });

  function handleGithubLogin() {
    window.location.href = authService.getGithubLoginUrl();
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
  <div class="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-2xl">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">Hostify</h1>
      <p class="text-gray-600">Deploy your static sites with ease</p>
    </div>

    <div class="space-y-4">
      <button
        on:click={handleGithubLogin}
        class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Github class="w-5 h-5" />
        <span>Continue with GitHub</span>
      </button>
    </div>

    <div class="mt-8 text-center text-sm text-gray-600">
      <p>Deploy unlimited static sites</p>
      <p>Automatic deployments on push</p>
      <p>Custom subdomain support</p>
    </div>
  </div>
</div>
```

### Step 5.4: OAuth Callback (`src/routes/auth/callback/+page.svelte`)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { authService } from '$services/auth.service';
  import { authStore } from '$stores/auth';
  import Cookies from 'js-cookie';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';

  let error = '';

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    const errorParam = $page.url.searchParams.get('error');

    if (errorParam) {
      error = errorParam;
      setTimeout(() => goto('/login'), 3000);
      return;
    }

    if (token) {
      // Store token in cookie
      Cookies.set('auth_token', token, { expires: 7 });

      // Fetch user info
      const user = await authService.getCurrentUser();
      if (user) {
        authStore.setUser(user);
        goto('/dashboard');
      } else {
        error = 'Failed to fetch user information';
        setTimeout(() => goto('/login'), 3000);
      }
    } else {
      error = 'No token received';
      setTimeout(() => goto('/login'), 3000);
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="text-center">
    {#if error}
      <div class="text-red-600 mb-4">
        <p class="text-xl font-semibold">Authentication Error</p>
        <p class="text-sm">{error}</p>
        <p class="text-sm mt-2">Redirecting to login...</p>
      </div>
    {:else}
      <LoadingSpinner />
      <p class="mt-4 text-gray-600">Completing authentication...</p>
    {/if}
  </div>
</div>
```

---

## 6. Pages & Routes

### Step 6.1: Home Page (`src/routes/+page.svelte`)

```svelte
<script lang="ts">
  import { authStore } from '$stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Rocket, Zap, Shield, GitBranch } from 'lucide-svelte';

  onMount(() => {
    if ($authStore.isAuthenticated) {
      goto('/dashboard');
    }
  });
</script>

<div class="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
  <!-- Hero Section -->
  <div class="container mx-auto px-4 py-20">
    <div class="text-center text-white max-w-4xl mx-auto">
      <h1 class="text-6xl font-bold mb-6">
        Deploy Static Sites <br />in Seconds
      </h1>
      <p class="text-xl mb-8 text-blue-100">
        Connect your GitHub repository and deploy instantly. Automatic deployments on every push.
      </p>
      <a
        href="/login"
        class="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
      >
        Get Started for Free
      </a>
    </div>
  </div>

  <!-- Features Section -->
  <div class="bg-white py-20">
    <div class="container mx-auto px-4">
      <h2 class="text-4xl font-bold text-center mb-12">Why Hostify?</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div class="text-center p-6">
          <div class="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <Rocket class="w-8 h-8 text-blue-600" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Instant Deploys</h3>
          <p class="text-gray-600">Deploy your site in seconds with one click</p>
        </div>

        <div class="text-center p-6">
          <div class="inline-block p-4 bg-purple-100 rounded-full mb-4">
            <GitBranch class="w-8 h-8 text-purple-600" />
          </div>
          <h3 class="text-xl font-semibold mb-2">GitHub Integration</h3>
          <p class="text-gray-600">Automatic webhooks and continuous deployment</p>
        </div>

        <div class="text-center p-6">
          <div class="inline-block p-4 bg-green-100 rounded-full mb-4">
            <Zap class="w-8 h-8 text-green-600" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Lightning Fast</h3>
          <p class="text-gray-600">Powered by Azure Blob Storage CDN</p>
        </div>

        <div class="text-center p-6">
          <div class="inline-block p-4 bg-red-100 rounded-full mb-4">
            <Shield class="w-8 h-8 text-red-600" />
          </div>
          <h3 class="text-xl font-semibold mb-2">Secure</h3>
          <p class="text-gray-600">HTTPS enabled with custom subdomains</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Step 6.2: Dashboard (`src/routes/dashboard/+page.svelte`)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$stores/auth';
  import { goto } from '$app/navigation';
  import { deployService } from '$services/deploy.service';
  import type { Deployment } from '$types/deployment.types';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';
  import DeploymentCard from '$components/DeploymentCard.svelte';
  import { Rocket, Package } from 'lucide-svelte';

  let deployments: Deployment[] = [];
  let isLoading = true;

  onMount(async () => {
    if (!$authStore.isAuthenticated) {
      goto('/login');
      return;
    }

    try {
      deployments = await deployService.listDeployments();
    } catch (error) {
      console.error('Failed to load deployments:', error);
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">
      Welcome back, {$authStore.user?.username}!
    </h1>
    <p class="text-gray-600">Manage your deployments and repositories</p>
  </div>

  <!-- Quick Actions -->
  <div class="grid md:grid-cols-2 gap-6 mb-8">
    <a
      href="/repositories"
      class="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
    >
      <div class="flex items-center gap-4">
        <div class="p-3 bg-blue-100 rounded-lg">
          <Rocket class="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">Deploy New Site</h3>
          <p class="text-sm text-gray-600">Browse your repositories and deploy</p>
        </div>
      </div>
    </a>

    <a
      href="/deployments"
      class="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-500"
    >
      <div class="flex items-center gap-4">
        <div class="p-3 bg-purple-100 rounded-lg">
          <Package class="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">View All Deployments</h3>
          <p class="text-sm text-gray-600">Manage your deployed sites</p>
        </div>
      </div>
    </a>
  </div>

  <!-- Recent Deployments -->
  <div>
    <h2 class="text-2xl font-bold mb-4">Recent Deployments</h2>
    {#if isLoading}
      <div class="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    {:else if deployments.length === 0}
      <div class="text-center py-12 bg-white rounded-lg shadow">
        <p class="text-gray-600 mb-4">No deployments yet</p>
        <a
          href="/repositories"
          class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Deploy Your First Site
        </a>
      </div>
    {:else}
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each deployments.slice(0, 6) as deployment}
          <DeploymentCard {deployment} />
        {/each}
      </div>
    {/if}
  </div>
</div>
```

### Step 6.3: Repositories Page (`src/routes/repositories/+page.svelte`)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$stores/auth';
  import { goto } from '$app/navigation';
  import { repoService } from '$services/repo.service';
  import type { Repository } from '$types/repo.types';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';
  import RepoCard from '$components/RepoCard.svelte';
  import { Search } from 'lucide-svelte';

  let repositories: Repository[] = [];
  let filteredRepos: Repository[] = [];
  let isLoading = true;
  let searchQuery = '';

  onMount(async () => {
    if (!$authStore.isAuthenticated) {
      goto('/login');
      return;
    }

    try {
      repositories = await repoService.listRepositories();
      filteredRepos = repositories;
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      isLoading = false;
    }
  });

  $: {
    if (searchQuery) {
      filteredRepos = repositories.filter((repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      filteredRepos = repositories;
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Your Repositories</h1>
    <p class="text-gray-600">Select a repository to deploy</p>
  </div>

  <!-- Search Bar -->
  <div class="mb-6">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search repositories..."
        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  </div>

  {#if isLoading}
    <div class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
  {:else if filteredRepos.length === 0}
    <div class="text-center py-12 bg-white rounded-lg shadow">
      <p class="text-gray-600">
        {searchQuery ? 'No repositories found matching your search' : 'No repositories found'}
      </p>
    </div>
  {:else}
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredRepos as repo}
        <RepoCard repository={repo} />
      {/each}
    </div>
  {/if}
</div>
```

### Step 6.4: Deployments Page (`src/routes/deployments/+page.svelte`)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$stores/auth';
  import { goto } from '$app/navigation';
  import { deployService } from '$services/deploy.service';
  import type { Deployment } from '$types/deployment.types';
  import LoadingSpinner from '$components/LoadingSpinner.svelte';
  import DeploymentCard from '$components/DeploymentCard.svelte';

  let deployments: Deployment[] = [];
  let isLoading = true;

  onMount(async () => {
    if (!$authStore.isAuthenticated) {
      goto('/login');
      return;
    }

    await loadDeployments();
  });

  async function loadDeployments() {
    isLoading = true;
    try {
      deployments = await deployService.listDeployments();
    } catch (error) {
      console.error('Failed to load deployments:', error);
    } finally {
      isLoading = false;
    }
  }

  async function handleDelete(id: string) {
    deployments = deployments.filter((d) => d.id !== id);
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">All Deployments</h1>
    <p class="text-gray-600">Manage your deployed sites</p>
  </div>

  {#if isLoading}
    <div class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
  {:else if deployments.length === 0}
    <div class="text-center py-12 bg-white rounded-lg shadow">
      <p class="text-gray-600 mb-4">No deployments yet</p>
      <a
        href="/repositories"
        class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Deploy Your First Site
      </a>
    </div>
  {:else}
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each deployments as deployment}
        <DeploymentCard {deployment} on:delete={() => handleDelete(deployment.id)} />
      {/each}
    </div>
  {/if}
</div>
```

---

## 7. Components

### Step 7.1: Header (`src/lib/components/Header.svelte`)

```svelte
<script lang="ts">
  import { authStore } from '$stores/auth';
  import { authService } from '$services/auth.service';
  import { goto } from '$app/navigation';
  import { LogOut, User, Menu, X } from 'lucide-svelte';
  import { page } from '$app/stores';

  let mobileMenuOpen = false;

  async function handleLogout() {
    await authService.logout();
    goto('/login');
  }

  $: currentPath = $page.url.pathname;
</script>

<header class="bg-white shadow-sm">
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/dashboard" class="text-2xl font-bold text-blue-600">
        Hostify
      </a>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-6">
        <a
          href="/dashboard"
          class="text-gray-700 hover:text-blue-600 transition-colors"
          class:font-semibold={currentPath === '/dashboard'}
          class:text-blue-600={currentPath === '/dashboard'}
        >
          Dashboard
        </a>
        <a
          href="/repositories"
          class="text-gray-700 hover:text-blue-600 transition-colors"
          class:font-semibold={currentPath === '/repositories'}
          class:text-blue-600={currentPath === '/repositories'}
        >
          Repositories
        </a>
        <a
          href="/deployments"
          class="text-gray-700 hover:text-blue-600 transition-colors"
          class:font-semibold={currentPath === '/deployments'}
          class:text-blue-600={currentPath === '/deployments'}
        >
          Deployments
        </a>
      </nav>

      <!-- User Menu -->
      <div class="hidden md:flex items-center gap-4">
        <div class="flex items-center gap-2 text-gray-700">
          <User class="w-5 h-5" />
          <span>{$authStore.user?.username}</span>
        </div>
        <button
          on:click={handleLogout}
          class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
        >
          <LogOut class="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      <!-- Mobile Menu Button -->
      <button
        class="md:hidden"
        on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
      >
        {#if mobileMenuOpen}
          <X class="w-6 h-6" />
        {:else}
          <Menu class="w-6 h-6" />
        {/if}
      </button>
    </div>

    <!-- Mobile Menu -->
    {#if mobileMenuOpen}
      <div class="md:hidden py-4 border-t">
        <nav class="flex flex-col gap-4">
          <a href="/dashboard" class="text-gray-700 hover:text-blue-600">
            Dashboard
          </a>
          <a href="/repositories" class="text-gray-700 hover:text-blue-600">
            Repositories
          </a>
          <a href="/deployments" class="text-gray-700 hover:text-blue-600">
            Deployments
          </a>
          <button
            on:click={handleLogout}
            class="text-left text-gray-700 hover:text-red-600"
          >
            Logout
          </button>
        </nav>
      </div>
    {/if}
  </div>
</header>
```

### Step 7.2: Footer (`src/lib/components/Footer.svelte`)

```svelte
<footer class="bg-gray-900 text-white py-8">
  <div class="container mx-auto px-4">
    <div class="flex flex-col md:flex-row justify-between items-center">
      <div class="mb-4 md:mb-0">
        <p class="text-lg font-bold">Hostify</p>
        <p class="text-sm text-gray-400">Deploy with confidence</p>
      </div>
      <div class="flex gap-6 text-sm text-gray-400">
        <a href="https://github.com/pandarudra/hostify" target="_blank" class="hover:text-white">
          GitHub
        </a>
        <a href="/docs" class="hover:text-white">Documentation</a>
        <a href="/about" class="hover:text-white">About</a>
      </div>
    </div>
    <div class="mt-4 text-center text-sm text-gray-500">
      © 2026 Hostify. All rights reserved.
    </div>
  </div>
</footer>
```

### Step 7.3: RepoCard (`src/lib/components/RepoCard.svelte`)

```svelte
<script lang="ts">
  import type { Repository } from '$types/repo.types';
  import { Github, Star, GitFork } from 'lucide-svelte';
  import DeployModal from './DeployModal.svelte';

  export let repository: Repository;

  let showDeployModal = false;
</script>

<div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
  <div class="flex items-start justify-between mb-4">
    <div class="flex items-center gap-2">
      <Github class="w-5 h-5 text-gray-600" />
      <h3 class="font-semibold text-lg truncate">{repository.name}</h3>
    </div>
    {#if repository.private}
      <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Private</span>
    {/if}
  </div>

  <p class="text-gray-600 text-sm mb-4 line-clamp-2">
    {repository.description || 'No description provided'}
  </p>

  <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
    {#if repository.language}
      <span class="flex items-center gap-1">
        <span class="w-3 h-3 rounded-full bg-blue-500"></span>
        {repository.language}
      </span>
    {/if}
    <span class="flex items-center gap-1">
      <Star class="w-4 h-4" />
      {repository.stargazers_count}
    </span>
    <span class="flex items-center gap-1">
      <GitFork class="w-4 h-4" />
      {repository.forks_count}
    </span>
  </div>

  <button
    on:click={() => (showDeployModal = true)}
    class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
  >
    Deploy Now
  </button>
</div>

{#if showDeployModal}
  <DeployModal
    {repository}
    on:close={() => (showDeployModal = false)}
  />
{/if}
```

### Step 7.4: DeploymentCard (`src/lib/components/DeploymentCard.svelte`)

```svelte
<script lang="ts">
  import type { Deployment } from '$types/deployment.types';
  import { ExternalLink, Trash2, Calendar } from 'lucide-svelte';
  import { deployService } from '$services/deploy.service';
  import { toast } from 'svelte-sonner';
  import { createEventDispatcher } from 'svelte';

  export let deployment: Deployment;

  const dispatch = createEventDispatcher();

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this deployment?')) {
      return;
    }

    try {
      await deployService.deleteDeployment(deployment.id);
      toast.success('Deployment deleted successfully');
      dispatch('delete');
    } catch (error) {
      toast.error('Failed to delete deployment');
      console.error(error);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
</script>

<div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
  <div class="mb-4">
    <h3 class="font-semibold text-lg mb-1">{deployment.subdomain}</h3>
    <p class="text-sm text-gray-600 truncate">{deployment.repoUrl}</p>
  </div>

  <div class="mb-4 space-y-2 text-sm">
    <div class="flex items-center gap-2 text-gray-600">
      <Calendar class="w-4 h-4" />
      <span>Deployed: {formatDate(deployment.lastDeployedAt)}</span>
    </div>
  </div>

  <div class="flex gap-2">
    <a
      href={deployment.url}
      target="_blank"
      rel="noopener noreferrer"
      class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <ExternalLink class="w-4 h-4" />
      Visit Site
    </a>
    <button
      on:click={handleDelete}
      class="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
      title="Delete deployment"
    >
      <Trash2 class="w-4 h-4" />
    </button>
  </div>
</div>
```

### Step 7.5: DeployModal (`src/lib/components/DeployModal.svelte`)

```svelte
<script lang="ts">
  import type { Repository } from '$types/repo.types';
  import { deployService } from '$services/deploy.service';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { X, Loader } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  export let repository: Repository;

  const dispatch = createEventDispatcher();

  let subdomain = '';
  let isDeploying = false;

  async function handleDeploy() {
    isDeploying = true;

    try {
      const response = await deployService.deploy({
        ghlink: repository.clone_url,
        subdomain: subdomain || undefined
      });

      toast.success('Deployment successful!');
      goto('/deployments');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Deployment failed');
      console.error(error);
    } finally {
      isDeploying = false;
    }
  }

  function handleClose() {
    if (!isDeploying) {
      dispatch('close');
    }
  }
</script>

<div
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  on:click={handleClose}
>
  <div
    class="bg-white rounded-lg max-w-md w-full p-6"
    on:click|stopPropagation
  >
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold">Deploy Repository</h2>
      <button
        on:click={handleClose}
        disabled={isDeploying}
        class="text-gray-500 hover:text-gray-700"
      >
        <X class="w-6 h-6" />
      </button>
    </div>

    <div class="mb-6">
      <p class="text-gray-600 mb-2">Repository:</p>
      <p class="font-semibold">{repository.full_name}</p>
    </div>

    <div class="mb-6">
      <label for="subdomain" class="block text-sm font-medium text-gray-700 mb-2">
        Subdomain (optional)
      </label>
      <input
        id="subdomain"
        type="text"
        bind:value={subdomain}
        placeholder="my-site"
        disabled={isDeploying}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <p class="text-xs text-gray-500 mt-1">
        Leave empty to use repository name
      </p>
    </div>

    <div class="flex gap-3">
      <button
        on:click={handleClose}
        disabled={isDeploying}
        class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        on:click={handleDeploy}
        disabled={isDeploying}
        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {#if isDeploying}
          <Loader class="w-4 h-4 animate-spin" />
          Deploying...
        {:else}
          Deploy
        {/if}
      </button>
    </div>
  </div>
</div>
```

### Step 7.6: LoadingSpinner (`src/lib/components/LoadingSpinner.svelte`)

```svelte
<div class="flex justify-center items-center">
  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
</div>
```

---

## 8. Styling

### Step 8.1: Global Styles (`src/app.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings:
      "rlig" 1,
      "calt" 1;
  }
}

@layer utilities {
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

---

## 9. Testing

Run the development server:

```bash
cd fe
npm run dev
```

Visit `http://localhost:5173` and test:

- [ ] Login with GitHub OAuth
- [ ] View repositories
- [ ] Deploy a repository
- [ ] View deployments
- [ ] Delete a deployment
- [ ] Logout

---

## 10. Deployment

### Step 10.1: Build for Production

```bash
npm run build
npm run preview
```

### Step 10.2: Deploy to Vercel/Netlify

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or use GitHub Actions for CI/CD.

---

## Next Steps

1. ✅ Set up the project structure
2. ✅ Implement authentication
3. ✅ Create all pages
4. ✅ Add deployment functionality
5. ⏭️ Add error boundaries
6. ⏭️ Add loading states
7. ⏭️ Add tests (Vitest + Playwright)
8. ⏭️ Optimize performance
9. ⏭️ Add analytics

---

## Troubleshooting

### CORS Issues

Ensure your backend has proper CORS configuration:

```typescript
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
```

### Cookie Issues

Make sure cookies are set with proper options:

```typescript
Cookies.set("auth_token", token, {
  expires: 7,
  secure: false, // true in production
  sameSite: "lax",
});
```

### Build Errors

Clear cache and reinstall:

```bash
rm -rf node_modules .svelte-kit
npm install
npm run dev
```

---

**Happy Coding! 🚀**
