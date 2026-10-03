import React, { useState } from 'react';
import { X, Copy, Check, Share2, Download, Smartphone } from 'lucide-react';
import { ProfileData } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  profile: ProfileData;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, profile, onClose }) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://linkflow.app/@username';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-[#191920] border-2 border-black rounded-3xl shadow-2xl p-6 text-white text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-white/90" />
            <h3 className="text-lg font-bold tracking-tight">Profili Paylaş</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Card */}
        <div className="bg-white p-5 rounded-2xl mx-auto inline-block shadow-lg border-2 border-black mb-4">
          {/* High precision SVG QR Code generator representation */}
          <svg className="w-44 h-44 text-black" viewBox="0 0 100 100" fill="none">
            {/* Top Left Corner */}
            <rect x="5" y="5" width="28" height="28" fill="black" rx="4" />
            <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
            <rect x="13" y="13" width="12" height="12" fill="black" rx="1.5" />

            {/* Top Right Corner */}
            <rect x="67" y="5" width="28" height="28" fill="black" rx="4" />
            <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
            <rect x="75" y="13" width="12" height="12" fill="black" rx="1.5" />

            {/* Bottom Left Corner */}
            <rect x="5" y="67" width="28" height="28" fill="black" rx="4" />
            <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
            <rect x="13" y="75" width="12" height="12" fill="black" rx="1.5" />

            {/* Simulated Data Pattern Matrix */}
            <rect x="38" y="8" width="6" height="6" fill="black" />
            <rect x="48" y="12" width="6" height="6" fill="black" />
            <rect x="56" y="8" width="6" height="6" fill="black" />
            <rect x="38" y="24" width="6" height="6" fill="black" />
            <rect x="48" y="20" width="6" height="6" fill="black" />
            <rect x="56" y="26" width="6" height="6" fill="black" />

            <rect x="8" y="38" width="6" height="6" fill="black" />
            <rect x="20" y="44" width="6" height="6" fill="black" />
            <rect x="12" y="52" width="6" height="6" fill="black" />
            <rect x="24" y="56" width="6" height="6" fill="black" />

            <rect x="38" y="38" width="8" height="8" fill="black" rx="2" />
            <rect x="50" y="42" width="6" height="6" fill="black" />
            <rect x="42" y="52" width="6" height="6" fill="black" />
            <rect x="54" y="54" width="8" height="8" fill="black" rx="2" />

            <rect x="70" y="38" width="6" height="6" fill="black" />
            <rect x="82" y="44" width="6" height="6" fill="black" />
            <rect x="74" y="52" width="6" height="6" fill="black" />
            <rect x="86" y="56" width="6" height="6" fill="black" />

            <rect x="38" y="70" width="6" height="6" fill="black" />
            <rect x="48" y="76" width="6" height="6" fill="black" />
            <rect x="56" y="68" width="6" height="6" fill="black" />
            <rect x="42" y="86" width="6" height="6" fill="black" />
            <rect x="52" y="84" width="6" height="6" fill="black" />
            <rect x="62" y="86" width="6" height="6" fill="black" />

            <rect x="72" y="72" width="6" height="6" fill="black" />
            <rect x="82" y="68" width="6" height="6" fill="black" />
            <rect x="76" y="82" width="6" height="6" fill="black" />
            <rect x="86" y="86" width="6" height="6" fill="black" />
          </svg>
        </div>

        <p className="font-bold text-white text-base">{profile.name}</p>
        <p className="text-xs text-stone-400 mb-4">{profile.description}</p>

        {/* Copy Link Input */}
        <div className="flex items-center gap-2 bg-[#22222a] border-2 border-black rounded-2xl p-2 mb-4">
          <input
            type="text"
            readOnly
            value={currentUrl}
            className="flex-1 bg-transparent text-xs text-stone-300 font-mono px-2 truncate focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-stone-200 transition-colors shrink-0 flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Kopyala</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-stone-500">
          Bu linki Instagram, TikTok və ya digər platformaların bioqrafiyasında yerləşdirə bilərsiniz.
        </p>
      </div>
    </div>
  );
};
