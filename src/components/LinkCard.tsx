import React, { useState, useRef, useEffect } from 'react';
import { LinkItem, ThemeConfig } from '../types';
import { BrandIcon } from './icons';
import {
  MoreVertical,
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

interface LinkCardProps {
  link: LinkItem;
  theme: ThemeConfig;
  isAdmin: boolean;
  onEdit: (link: LinkItem) => void;
  onQuickChangeUrl?: (link: LinkItem) => void;
  onToggleVisibility: (linkId: string) => void;
  onDelete: (linkId: string) => void;
  onClickCount: (linkId: string) => void;
}

/**
 * LinkCard Component:
 * - Eni: Maksimum 440px (max-w-[440px] w-full)
 * - Hündürlüyü: 58px ilə 64px arası (tək başlıq 58px, alt mətn olduqda 64px)
 * - Künc radiusu: Dəqiq 20px (rounded-[20px])
 * - Haşiyə (Border): 2px qalınlığında dərin tünd/qara haşiyə (border-2 border-[#121218])
 * - Fon Rəngi: #252538 və ya theme.cardBg
 * - Kölgə: shadow-[0_8px_20px_rgba(0,0,0,0.35)]
 * - Sol Tərəf: 22px ikon, sol kənardan 16px (pl-4 / pl-[16px])
 * - Mərkəz: 14-15px Bold ağ başlıq, alt mətn 11px açıq boz
 * - Sağ Tərəf: 18px MoreVertical (⋮), sağ kənardan 16px (pr-4 / pr-[16px])
 * - Micro-interactions: hover:scale-[1.015], active:scale-[0.985]
 */
export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  theme,
  isAdmin,
  onEdit,
  onQuickChangeUrl,
  onToggleVisibility,
  onDelete,
  onClickCount,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpen]);

  const handleCardClick = () => {
    onClickCount(link.id);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (link.url) {
      navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setMenuOpen(false);
      }, 1200);
    }
  };

  // If hidden and not admin, do not render
  if (!link.visible && !isAdmin) {
    return null;
  }

  const titleLen = (link.title || '').length;
  // Uzun cümlə və ya başlıq olduqda şrift ölçüsünü avtomatik adaptiv tənzimləyirik ki, kəsilməsin və 3 nöqtəyə çevrilməsin:
  let titleFontSize = '14.5px';
  if (titleLen > 35) {
    titleFontSize = '11.5px';
  } else if (titleLen > 24) {
    titleFontSize = '12.5px';
  } else if (titleLen > 18) {
    titleFontSize = '13.5px';
  }

  const hasSubtitle = Boolean(link.subtitle?.trim());
  const cardHeightClass = hasSubtitle || titleLen > 28 ? 'min-h-[62px] py-2' : 'min-h-[58px] py-1.5';

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg || '#252538',
    borderColor: theme.cardBorderColor || '#121218',
    color: theme.textColor || '#ffffff',
  };

  return (
    <div className="relative w-full max-w-[440px] mx-auto group">
      <a
        href={link.url || '#'}
        target={link.url?.startsWith('http') ? '_blank' : undefined}
        rel={link.url?.startsWith('http') ? 'noopener noreferrer' : undefined}
        onClick={handleCardClick}
        style={cardStyle}
        className={`w-full ${cardHeightClass} flex items-center justify-between
          pl-[16px] pr-[16px]
          rounded-[20px] border-2 border-[#121218]
          shadow-[0_8px_20px_rgba(0,0,0,0.35)]
          transition-all duration-150 ease-out select-none
          hover:scale-[1.015] hover:brightness-105
          active:scale-[0.985]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80
          ${!link.visible ? 'opacity-55 border-dashed' : ''}
        `}
        aria-label={`${link.title} - keçid aç`}
      >
        {/* Sol Tərəf: 22px ölçüdə təmiz ağ/konfiqurasiya ikonu, sol kənar 16px */}
        <div
          className="w-[28px] flex items-center justify-start shrink-0 pointer-events-none"
          style={{ color: theme.iconColor || '#ffffff' }}
        >
          <BrandIcon
            name={link.icon}
            className="w-[22px] h-[22px] transition-transform duration-150 group-hover:scale-105"
          />
        </div>

        {/* Mərkəz: Əsas ad Bold və kəsilmədən (dotsuz), Alt mətn incə */}
        <div className="flex-1 px-2 text-center flex flex-col items-center justify-center">
          <span
            className="block font-bold leading-tight text-center tracking-tight break-words max-w-full"
            style={{
              fontSize: titleFontSize,
              color: theme.textColor || '#ffffff',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            {link.title}
          </span>
          {hasSubtitle && (
            <span className="block text-[11px] text-stone-300 font-normal leading-tight mt-0.5 break-words max-w-full">
              {link.subtitle}
            </span>
          )}
          {!link.visible && isAdmin && (
            <span className="block text-[9.5px] uppercase tracking-wider text-stone-400 font-semibold leading-none mt-0.5">
              (Gizlədilib)
            </span>
          )}
        </div>

        {/* Sağ Tərəf: Şaquli 3 nöqtə ikonu (MoreVertical), 18px, sağ kənar 16px */}
        <div className="w-[28px] flex items-center justify-end shrink-0 relative">
          <button
            ref={buttonRef}
            type="button"
            data-menu-trigger="true"
            aria-label="Link parametrləri menyusu"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors focus:outline-none"
            style={{ color: theme.moreIconColor || '#a3a3a3' }}
          >
            <MoreVertical className="w-[18px] h-[18px]" />
          </button>
        </div>
      </a>

      {/* Dropdown Menyusu (More Options) */}
      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 bg-[#18181c] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header məlumatı: Başlıq və qısa URL */}
          <div className="px-2.5 py-1.5 mb-1 border-b border-white/10">
            <p className="text-xs font-bold text-white truncate">{link.title}</p>
            {link.url && (
              <p className="text-[10.5px] text-stone-400 font-mono truncate mt-0.5">
                {link.url}
              </p>
            )}
          </div>

          {/* Hər kəs üçün görünən seçimlər: Linki kopyala və Səhifəni aç */}
          <button
            type="button"
            role="menuitem"
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-stone-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-400" />
                <span>Linki kopyala</span>
              </>
            )}
          </button>

          {link.url && (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-stone-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-stone-400" />
              <span>Səhifəni aç</span>
            </a>
          )}

          {/* YALNIZ ADMIN GİRİŞİNDƏ GÖRÜNƏN ƏMƏLİYYATLAR (Redaktə et, Linki dəyiş, Gizlət, Sil) */}
          {isAdmin && (
            <>
              <div className="my-1.5 border-t border-white/10" />

              {/* Redaktə et */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(link);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:bg-white/10 rounded-xl transition-colors"
              >
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <span>Redaktə et</span>
              </button>

              {/* Linki dəyiş (Quick change URL) */}
              {onQuickChangeUrl && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onQuickChangeUrl(link);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-stone-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-stone-400" />
                  <span>Linki dəyiş</span>
                </button>
              )}

              {/* Gizlət / Göstər */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onToggleVisibility(link.id);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-stone-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                {link.visible ? (
                  <>
                    <EyeOff className="w-4 h-4 text-stone-400" />
                    <span>Gizlət</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Göstər</span>
                  </>
                )}
              </button>

              {/* Sil */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(link.id);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Sil</span>
              </button>

              {/* Statistika göstəricisi */}
              <div className="px-2.5 py-1.5 mt-1 bg-black/40 rounded-xl text-[10px] text-stone-400 font-mono flex items-center justify-between">
                <span>Klik sayı:</span>
                <span className="text-white font-bold">{link.clicks || 0}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
