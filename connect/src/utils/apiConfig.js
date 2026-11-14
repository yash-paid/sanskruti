/**
 * API Endpoint Configuration for Web & Native Android (Capacitor)
 *
 * In web browsers, relative URLs resolve against the hosting origin.
 * In Capacitor Android WebView (origin: capacitor://localhost or https://localhost),
 * relative URLs must resolve to the production backend origin.
 */

export const PRODUCTION_ORIGIN = 'https://sanskrutiservice.in';
export const VIDEO_CDN_BASE = 'https://sanskrutiservice.in/connect/assets/videos';

/**
 * Returns the optimized HTTPS streaming URL for a video asset.
 * Supports HTTP Range streaming (206 Partial Content) with zero APK bloat.
 *
 * @param {string} pathOrFilename - e.g. '/assets/videos/1.mp4' or '1.mp4'
 * @returns {string} - Direct HTTPS streaming URL
 */
export const getVideoUrl = (pathOrFilename) => {
  if (!pathOrFilename) return `${VIDEO_CDN_BASE}/1.mp4`;
  if (pathOrFilename.startsWith('http://') || pathOrFilename.startsWith('https://')) {
    return pathOrFilename;
  }
  const filename = pathOrFilename.split('/').pop() || '1.mp4';
  return `${VIDEO_CDN_BASE}/${filename}`;
};

/**
 * Checks if the application is running inside a native mobile runtime (e.g. Capacitor Android).
 */
export const isNativePlatform = () => {
  if (typeof window === 'undefined') return false;
  if (window.Capacitor?.isNativePlatform?.()) return true;
  const origin = window.location.origin || '';
  return origin.startsWith('capacitor://') || origin === 'https://localhost' || origin === 'http://localhost' && window.Capacitor;
};

/**
 * Resolves an endpoint path to an absolute URL when running natively,
 * or preserves the relative path for browser and dev-server compatibility.
 *
 * @param {string} path - e.g. '/.netlify/functions/connect-user' or '/api/connect-auth-phone'
 * @returns {string} - Fully qualified URL or relative path
 */
export const getApiUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (isNativePlatform()) {
    return `${PRODUCTION_ORIGIN}${cleanPath}`;
  }
  return cleanPath;
};

export default {
  PRODUCTION_ORIGIN,
  isNativePlatform,
  getApiUrl,
};

