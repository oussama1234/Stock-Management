import { useCallback } from 'react';

/**
 * Hook returning a helper to build a full image URL from a backend path.
 * Usage: const { getImageUrl } = useImageUrl(); const url = getImageUrl(imagePath)
 */
export const useImageUrl = () => {
  const getImageUrl = useCallback((imageUrl) => {
    if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined') {
      return null;
    }

    if (typeof imageUrl !== 'string') {
      return null;
    }

    // Already absolute
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

    if (imageUrl.startsWith('/storage/')) {
      return `${backendUrl}${imageUrl}`;
    }
    if (imageUrl.startsWith('storage/')) {
      return `${backendUrl}/${imageUrl}`;
    }

    return `${backendUrl}/storage/${imageUrl}`;
  }, []);

  return { getImageUrl };
};
