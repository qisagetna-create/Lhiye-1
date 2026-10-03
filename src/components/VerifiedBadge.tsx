import React from 'react';
import { VerifiedBadgeType } from '../types';

interface VerifiedBadgeProps {
  type?: VerifiedBadgeType;
  className?: string;
  size?: number | string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  type = 'blue',
  className = 'w-5 h-5 sm:w-6 sm:h-6 shrink-0 inline-block',
}) => {
  if (type === 'gold') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Qızıl təsdiq nişanı"
      >
        <defs>
          <linearGradient id="goldBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="45%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <filter id="goldDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.35" />
          </filter>
        </defs>
        {/* Scalloped 12-point starburst rosette */}
        <path
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
          fill="url(#goldBadgeGrad)"
          stroke="#FEF08A"
          strokeWidth="0.6"
        />
        {/* Crisp checkmark with shadow */}
        <path
          d="M7.4 12.4L10.3 15.3L16.6 9"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#goldDropShadow)"
        />
      </svg>
    );
  }

  if (type === 'white') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Ağ təsdiq nişanı"
      >
        <circle cx="12" cy="12" r="10" fill="#FFFFFF" />
        <path
          d="M7.5 12.5L10.4 15.4L16.5 9.3"
          stroke="#000000"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Default: 'blue' (Instagram / Twitter style)
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Mavi təsdiq nişanı"
    >
      <defs>
        <linearGradient id="blueBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00A2FF" />
          <stop offset="100%" stopColor="#0077E6" />
        </linearGradient>
      </defs>
      <path
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
        fill="url(#blueBadgeGrad)"
      />
      <path
        d="M7.4 12.4L10.3 15.3L16.6 9"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
