// src/components/Image.jsx
import React from 'react';

// Base URL for your API; set this in your .env (and Netlify) as REACT_APP_API_URL
// e.g. REACT_APP_API_URL=https://maitristayvmm.vercel.app
const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * A smart <img> component that:
 * - Leaves absolute URLs (http:// or https://) untouched
 * - Prefixes relative paths (e.g. "/uploads/abc.jpg") with your API URL
 * - Forwards any other props (onClick, style, etc.)
 *
 * @param {object} props
 * @param {string} props.src         - image URL or relative path
 * @param {string} [props.alt]       - alt text
 * @param {string} [props.className] - CSS classes
 * @param {object} [props.rest]      - any other <img> props (e.g. onClick)
 */
export default function Image({ src, alt = '', className = '', ...rest }) {
  let finalSrc = '';

  if (typeof src !== 'string') {
    console.warn('Image component: src is not a string:', src);
  } else if (/^https?:\/\//i.test(src) || src.startsWith('//')) {
    // Already an absolute URL → use it directly
    finalSrc = src;
  } else {
    // Relative path → prefix with API_URL
    // Trim trailing slash from API_URL if present
    const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    // Ensure the path starts with a slash
    const path = src.startsWith('/') ? src : `/${src}`;
    finalSrc = `${base}${path}`;
  }

  return <img src={finalSrc} alt={alt} className={className} {...rest} />;
}
