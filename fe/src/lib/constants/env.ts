import { env } from '$env/dynamic/public';
import type { Theme } from '$lib/stores/theme';

/**
 * Environment configuration
 * Centralized environment variables for the application
 */

// Environment type with fallback
export const ENV = (env.PUBLIC_ENV || 'production') as 'local' | 'production';

// API URLs with fallbacks
export const API_URL_LOCAL = env.PUBLIC_API_URL || 'http://localhost:8000';
export const API_URL_PROD = env.PUBLIC_PROD_API_URL || 'https://hostify-be.onrender.com';

// Active API URL based on environment
export const API_URL = ENV === 'production' ? API_URL_PROD : API_URL_LOCAL;

// Cookie configuration
export const AUTH_TOKEN_COOKIE_NAME = 'auth_token';
export const COOKIE_MAX_AGE_DAYS = 7; // 7 days expiration

export const STORAGE_KEY = 'hostify-theme';
export const DEFAULT_THEME: Theme = 'light';
