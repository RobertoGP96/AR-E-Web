/**
 * Auth Endpoints Constants
 */

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/',
  REGISTER: '/register/',
  LOGOUT: '/logout/',
  REFRESH: '/auth/refresh/',
  CURRENT_USER: '/user/',
  VERIFY: '/auth/verify/',
} as const;
