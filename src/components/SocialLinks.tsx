import React from 'react';
import { SOCIAL_META, type SocialLink } from '../data/socials';

// Renders the accounts the club actually has. Nothing is shown for a platform
// with no link, so the footer never sends anyone to an empty page.

export const SocialLinks: React.FC<{ links: SocialLink[]; className?: string }> = ({ links, className = '' }) => {
  const live = links.filter((l) => l.visible && l.url.trim());
  if (!live.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {live.map((link) => {
        const meta = SOCIAL_META[link.platform];
        return (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            aria-label={meta.label}
            title={meta.label}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-cyan-400 hover:text-black text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d={meta.path} />
            </svg>
          </a>
        );
      })}
    </div>
  );
};
