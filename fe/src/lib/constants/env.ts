import { PUBLIC_API_URL, PUBLIC_PROD_API_URL, PUBLIC_ENV } from '$env/static/public';

/**
 * Environment configuration
 * Centralized environment variables for the application
 */

// Environment type
export const ENV = PUBLIC_ENV as 'local' | 'production';

// API URLs
export const API_URL_LOCAL = PUBLIC_API_URL;
export const API_URL_PROD = PUBLIC_PROD_API_URL;

// Active API URL based on environment
export const API_URL = ENV === 'production' ? API_URL_PROD : API_URL_LOCAL;

// Cookie configuration
export const AUTH_TOKEN_COOKIE_NAME = 'auth_token';
export const COOKIE_MAX_AGE_DAYS = 7; // 7 days expiration
