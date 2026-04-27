import Cookies from 'js-cookie';

// Safe base64 encoding that handles special characters
const encode = (str: string) => {
  try {
    return btoa(encodeURIComponent(str));
  } catch (e) {
    return str;
  }
};

// Safe base64 decoding
const decode = (str: string) => {
  try {
    return decodeURIComponent(atob(str));
  } catch (e) {
    return str; // Fallback to raw string if it wasn't encoded properly (e.g. legacy cookies)
  }
};

export const setObfuscatedCookie = (name: string, value: string, options?: any) => {
  Cookies.set(name, encode(value), options);
};

export const getObfuscatedCookie = (name: string) => {
  const value = Cookies.get(name);
  if (!value) return null;
  return decode(value);
};
