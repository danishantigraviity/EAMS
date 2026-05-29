/**
 * Resolves the full URL for a given image path or Cloudinary URL.
 * Handles rewriting localhost references to production backend in deployed environments.
 * 
 * @param {string} url - The stored image URL/path.
 * @returns {string|null} The resolved absolute image URL.
 */
export const getImageUrl = (url) => {
  if (!url) return null;

  // Force HTTPS for Cloudinary URLs to prevent mixed content issues
  if (typeof url === 'string' && url.includes('res.cloudinary.com') && url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }

  // Handle base64 encoded images
  if (url.startsWith('data:')) {
    return url;
  }

  const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
  
  // Resolve backend base url
  let backendBaseUrl = '';
  const apiURL = import.meta.env.VITE_API_URL;
  if (apiURL) {
    backendBaseUrl = apiURL.replace(/\/api$/, '').replace(/\/$/, '');
  } else {
    // Default fallback to localhost development server port
    backendBaseUrl = 'http://localhost:5000';
  }

  // If it is already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (isProduction && url.includes('localhost:5000') && backendBaseUrl) {
      return url.replace(/http:\/\/localhost:5000/g, backendBaseUrl);
    }
    return url;
  }

  // If it is a relative path
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendBaseUrl}${cleanPath}`;
};
