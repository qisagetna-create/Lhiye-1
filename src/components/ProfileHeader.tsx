import React, { useRef } from 'react';
import { ProfileData, ThemeConfig } from '../types';
import { AutoFitMonogram } from './AutoFitMonogram';
import { Move } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';

interface ProfileHeaderProps {
  profile: ProfileData;
  theme: ThemeConfig;
  isAdmin: boolean;
  onAvatarTripleClick: () => void;
  onEditProfileClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  theme,
  isAdmin,
  onAvatarTripleClick,
  onEditProfileClick,
}) => {
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<any>(null);

  const handleAvatarClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onAvatarTripleClick();
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      if (clickCountRef.current === 1 && isAdmin) {
        onEditProfileClick();
      }
      clickCountRef.current = 0;
    }, 400);
  };

  const isSquare = profile.avatarShape === 'rounded';
  const shapeClass = isSquare ? 'rounded-3xl' : 'rounded-full';

  return (
    <div className="flex flex-col items-center justify-center text-center pt-8 sm:pt-12 md:pt-14 pb-5 px-4 w-full">
      {/* Profile Avatar / Photo / Logo */}
      <div className="relative group mb-4 sm:mb-5">
        <button
          type="button"
          onClick={handleAvatarClick}
          aria-label="Profil loqosu - admin girişi üçün 3 dəfə klikləyin"
          className={`relative w-[110px] h-[110px] sm:w-[142px] sm:h-[142px] ${shapeClass} p-1 transition-transform duration-300 active:scale-95 cursor-pointer focus:outline-none bg-stone-900 border-2 border-stone-700 shadow-2xl shadow-black`}
          title={isAdmin ? 'Profili redaktə et' : 'Admin girişi üçün 3 dəfə klikləyin'}
        >
          {/* Inner Frame with Zero-Crop enforcement and pure black background */}
          <div
            className={`w-full h-full ${shapeClass} overflow-hidden flex items-center justify-center border border-stone-800 relative bg-black`}
            style={{ backgroundColor: profile.avatarBg || '#000000' }}
          >
            {profile.logoMode !== 'text' && profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="max-w-full max-h-full w-full h-full select-none pointer-events-none transition-all duration-150"
                style={{
                  objectFit: 'contain',
                  transform: `scale(${(profile.avatarZoom || 100) / 100}) translate(${profile.avatarPosX || 0}%, ${profile.avatarPosY || 0}%)`,
                }}
              />
            ) : (
              /* Qızıl Orta Balanslı və Adaptiv Yazılı Loqo */
              <AutoFitMonogram text={profile.monogramText || 'username'} />
            )}

            {/* Admin Indicator hint on hover */}
            {isAdmin && (
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-semibold gap-1 backdrop-blur-xs">
                <Move className="w-5 h-5 text-white" />
                <span>Foto Tənzimlə</span>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Main Profile Name: @username */}
      <div className="flex items-center justify-center gap-1.5 mb-2 max-w-full px-2">
        <h1
          className="font-extrabold tracking-tight select-text text-center transition-colors text-white"
          style={{
            fontSize: 'clamp(1.4rem, 4.8vw, 2.1rem)',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {profile.name || '@username'}
        </h1>
        {profile.verified && (
          <VerifiedBadge
            type={profile.verifiedBadgeType || 'blue'}
            className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 inline-block drop-shadow-md"
          />
        )}
      </div>

      {/* Profile Bio / Description */}
      <p
        className="font-medium text-center max-w-md mx-auto leading-relaxed select-text text-stone-300"
        style={{
          fontSize: 'clamp(0.95rem, 3.2vw, 1.15rem)',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}
      >
        {profile.description || 'Qısa təsvir'}
      </p>
    </div>
  );
};
