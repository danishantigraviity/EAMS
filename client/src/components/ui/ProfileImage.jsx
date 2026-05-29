import { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageHelper';

/**
 * ProfileImage component displays a user profile picture or fallback name initials.
 * 
 * @param {object} props
 * @param {string} props.src - Image URL or path
 * @param {string} props.name - User's name for initials fallback
 * @param {string} props.className - Tailwind classes for the img tag
 * @param {string} props.fallbackClassName - Tailwind classes for the initials container
 */
export default function ProfileImage({
  src,
  name = '',
  className = 'w-9 h-9 rounded-full object-cover flex-shrink-0',
  fallbackClassName = 'w-9 h-9 bg-primary-100 dark:bg-primary-950/30 text-primary-650 dark:text-primary-400 flex items-center justify-center font-bold text-sm rounded-full flex-shrink-0',
}) {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = getImageUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!resolvedUrl || hasError) {
    const initials = name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

    return (
      <div className={fallbackClassName} title={name}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={name}
      className={className}
      onError={() => {
        console.warn(`⚠️ Failed to load profile image at: ${resolvedUrl}`);
        setHasError(true);
      }}
      loading="lazy"
    />
  );
}
