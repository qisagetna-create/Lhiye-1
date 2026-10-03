/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppConfig, LinkItem, SectionItem } from './types';
import { defaultAppConfig } from './data/defaultConfig';
import { ProfileHeader } from './components/ProfileHeader';
import { SectionHeader } from './components/SectionHeader';
import { LinkCard } from './components/LinkCard';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { EditLinkModal } from './components/EditLinkModal';
import { QuickUrlModal } from './components/QuickUrlModal';
import { ShareModal } from './components/ShareModal';
import { Toast } from './components/Toast';
import {
  SlidersHorizontal,
  Share2,
  Plus,
  Eye,
  Settings2,
  Smartphone,
  Maximize2,
  Monitor,
  Lock,
} from 'lucide-react';

const STORAGE_KEY = 'linkflow_template_config_v2';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile && parsed.theme && parsed.sections) {
          const profile = { ...defaultAppConfig.profile, ...parsed.profile };
          // İstifadəçinin istəyinə əsasən köhnə 'PULSUZLAR' dəyərlərini 'username' ilə əvəzləyirik
          if (profile.monogramText === 'PULSUZLAR') {
            profile.monogramText = 'username';
          }
          if (profile.displayName === 'PULSUZLAR') {
            profile.displayName = 'username';
          }
          if (!profile.name || profile.name.toLowerCase().includes('pulsuzlar')) {
            profile.name = '@username';
          }
          if (!profile.verifiedBadgeType) {
            profile.verifiedBadgeType = 'blue';
          }
          return {
            ...defaultAppConfig,
            ...parsed,
            profile,
            theme: { ...defaultAppConfig.theme, ...parsed.theme },
          };
        }
      }
    } catch (e) {
      console.error('Error reading configuration from localStorage', e);
    }
    return defaultAppConfig;
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Modals for editing links
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Quick URL change modal
  const [quickUrlLink, setQuickUrlLink] = useState<LinkItem | null>(null);
  const [isQuickUrlOpen, setIsQuickUrlOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Desktop viewport preview mode
  const [devicePreview, setDevicePreview] = useState<'fluid' | 'ref720' | 'mobile390'>('fluid');

  // Auto-save to localStorage whenever config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving configuration to localStorage', e);
    }
  }, [config]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  // --- Triple Click on Logo to Open Admin Login ---
  const handleLogoTripleClick = () => {
    if (isAdmin) {
      setIsAdminPanelOpen(true);
      showToast('İdarəetmə Paneli açıldı');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setIsAdmin(true);
    // Avtomatik birbaşa açılmır, istifadəçi istədiyi vaxt yuxarıdakı və ya loqodan aça bilər
    showToast('Admin girişi uğurludur');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsAdminPanelOpen(false);
    showToast('Admin sessiyasından çıxış edildi');
  };

  // --- Handlers for Link Management ---
  const handleOpenAddLink = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setEditingLink(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditLink = (link: LinkItem) => {
    const foundSection = config.sections.find((s) => s.links.some((l) => l.id === link.id));
    setActiveSectionId(foundSection ? foundSection.id : config.sections[0]?.id || null);
    setEditingLink(link);
    setIsEditModalOpen(true);
  };

  const handleSaveLink = (savedLink: LinkItem) => {
    if (!activeSectionId && config.sections.length > 0) {
      setActiveSectionId(config.sections[0].id);
    }

    const targetSectionId = activeSectionId || config.sections[0]?.id;

    setConfig((prev) => {
      const newSections = prev.sections.map((section) => {
        const hasLink = section.links.some((l) => l.id === savedLink.id);

        if (hasLink) {
          return {
            ...section,
            links: section.links.map((l) => (l.id === savedLink.id ? savedLink : l)),
          };
        }

        if (section.id === targetSectionId && !editingLink) {
          return {
            ...section,
            links: [...section.links, savedLink],
          };
        }

        return section;
      });

      return {
        ...prev,
        sections: newSections,
      };
    });

    showToast('Link yadda saxlanıldı');
  };

  const handleQuickChangeUrl = (link: LinkItem) => {
    setQuickUrlLink(link);
    setIsQuickUrlOpen(true);
  };

  const handleSaveQuickUrl = (linkId: string, newUrl: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => ({
        ...sec,
        links: sec.links.map((l) => (l.id === linkId ? { ...l, url: newUrl } : l)),
      })),
    }));
    showToast('Keçid URL yeniləndi');
  };

  const handleToggleVisibility = (linkId: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => ({
        ...sec,
        links: sec.links.map((l) => (l.id === linkId ? { ...l, visible: !l.visible } : l)),
      })),
    }));
    showToast('Görünüş statusu dəyişdirildi');
  };

  const handleDeleteLink = (linkId: string) => {
    if (confirm('Bu linki silmək istədiyinizə əminsiniz?')) {
      setConfig((prev) => ({
        ...prev,
        sections: prev.sections.map((sec) => ({
          ...sec,
          links: sec.links.filter((l) => l.id !== linkId),
        })),
      }));
      showToast('Link silindi');
    }
  };

  const handleClickCount = (linkId: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => ({
        ...sec,
        links: sec.links.map((l) => (l.id === linkId ? { ...l, clicks: (l.clicks || 0) + 1 } : l)),
      })),
    }));
  };

  // --- Handlers for Section Management ---
  const handleUpdateSectionTitle = (sectionId: string, newTitle: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s)),
    }));
    showToast('Bölmə adı yeniləndi');
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });

    setConfig((prev) => ({
      ...prev,
      sections: newSections,
    }));
  };

  const handleDeleteSection = (sectionId: string) => {
    if (config.sections.length <= 1) {
      showToast('Ən azı 1 bölmə qalmalıdır.');
      return;
    }
    if (confirm('Bu bölməni və bütün daxili linkləri silmək istəyirsiniz?')) {
      setConfig((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== sectionId),
      }));
      showToast('Bölmə silindi');
    }
  };

  // Compute page background style
  const getBackgroundStyle = (): React.CSSProperties => {
    const { theme } = config;
    if (theme.bgType === 'image' && theme.bgImageUrl) {
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(${theme.bgImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      };
    }

    if (theme.bgType === 'color') {
      return {
        backgroundColor: theme.bgColor || '#0a0a0c',
      };
    }

    const angle = theme.gradientAngle || 180;
    const start = theme.gradientStart || '#181510';
    const mid = theme.gradientMid;
    const end = theme.gradientEnd || '#08080a';

    if (mid) {
      return {
        background: `linear-gradient(${angle}deg, ${start} 0%, ${mid} 50%, ${end} 100%)`,
        backgroundColor: end,
      };
    }

    return {
      background: `linear-gradient(${angle}deg, ${start} 0%, ${end} 100%)`,
      backgroundColor: end,
    };
  };

  const getContainerWidthClass = () => {
    if (devicePreview === 'mobile390') {
      return 'w-full max-w-[390px] shadow-[0_0_50px_rgba(0,0,0,0.8)] my-8 rounded-[40px] border-4 border-black/80 overflow-hidden';
    }
    if (devicePreview === 'ref720') {
      return 'w-full max-w-[720px] shadow-[0_0_60px_rgba(0,0,0,0.9)] my-6 rounded-[32px] border-4 border-black/80 overflow-hidden';
    }
    return 'w-full max-w-[720px]';
  };

  return (
    <div
      className="min-h-screen w-full relative flex flex-col items-center select-none"
      style={getBackgroundStyle()}
    >
      {/* Subtle depth lighting overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />

      {/* Floating Header Control Bar */}
      <header className="sticky top-3 z-40 px-3 py-1 flex items-center justify-center w-full max-w-lg mx-auto">
        <nav
          aria-label="Əsas idarəetmə menyusu"
          className="bg-black/85 border border-stone-800 backdrop-blur-md rounded-full px-3 py-1.5 shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center gap-2 text-xs text-white"
        >
          {/* Admin Indicator / Open Panel */}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setIsAdminPanelOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold bg-[#52131b] hover:bg-[#681822] text-rose-200 border border-rose-500/40 shadow-sm transition-all"
              title="İdarəetmə Panelini Aç"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>İdarəetmə Paneli (Admin)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Loqoya 3 dəfə basaraq və ya buradan daxil olun"
            >
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Admin Girişi</span>
            </button>
          )}

          {/* Share Profile Link & QR Code */}
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Profili paylaş / QR Kod"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paylaş</span>
          </button>

          {/* Screen Width Simulation Selector for Viewers */}
          <div className="hidden md:flex items-center pl-1 border-l border-white/20 gap-0.5">
            <button
              type="button"
              onClick={() => setDevicePreview('fluid')}
              className={`p-1.5 rounded-full transition-colors ${
                devicePreview === 'fluid'
                  ? 'bg-white/20 text-white'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Tam Ekran Responsiv Baxış"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDevicePreview('ref720')}
              className={`p-1.5 rounded-full transition-colors ${
                devicePreview === 'ref720'
                  ? 'bg-white/20 text-white'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="720px Referans Ekran Ölçüsü"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDevicePreview('mobile390')}
              className={`p-1.5 rounded-full transition-colors ${
                devicePreview === 'mobile390'
                  ? 'bg-white/20 text-white'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="390px Mobil Ekran Ölçüsü"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Main Profile Layout Container - Responsive & 720px Reference Optimized */}
      <main
        className={`relative z-10 transition-all duration-300 flex flex-col flex-1 w-full items-center ${getContainerWidthClass()}`}
        style={devicePreview !== 'fluid' ? getBackgroundStyle() : undefined}
      >
        <div className="w-full px-4 sm:px-7 md:px-8 pb-8 flex flex-col items-center flex-1">
          {/* Top Profile Header: Circular/Rounded Logo/Avatar, @username, Qısa təsvir */}
          <ProfileHeader
            profile={config.profile}
            theme={config.theme}
            isAdmin={isAdmin}
            onAvatarTripleClick={handleLogoTripleClick}
            onEditProfileClick={() => setIsAdminPanelOpen(true)}
          />

          {/* Unlimited Sections and Links */}
          <div className="w-full space-y-2 mt-2">
            {config.sections.map((section, sectionIdx) => (
              <section key={section.id} className="w-full flex flex-col items-center">
                {/* Section Title: Bölmə adı */}
                <SectionHeader
                  section={section}
                  theme={config.theme}
                  isAdmin={isAdmin}
                  canMoveUp={sectionIdx > 0}
                  canMoveDown={sectionIdx < config.sections.length - 1}
                  onUpdateTitle={(newTitle) => handleUpdateSectionTitle(section.id, newTitle)}
                  onAddLink={() => handleOpenAddLink(section.id)}
                  onMoveUp={() => handleMoveSection(sectionIdx, 'up')}
                  onMoveDown={() => handleMoveSection(sectionIdx, 'down')}
                  onDeleteSection={() => handleDeleteSection(section.id)}
                />

                {/* Vertical Stack of Link Cards: 12px vertical spacing (space-y-3), max 440px */}
                <div className="w-full max-w-[440px] flex flex-col items-center space-y-3">
                  {section.links.map((link) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      theme={config.theme}
                      isAdmin={isAdmin}
                      onEdit={handleOpenEditLink}
                      onQuickChangeUrl={handleQuickChangeUrl}
                      onToggleVisibility={handleToggleVisibility}
                      onDelete={handleDeleteLink}
                      onClickCount={handleClickCount}
                    />
                  ))}

                  {/* Empty state for section if no links */}
                  {section.links.length === 0 && (
                    <div className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-white/20 text-center">
                      <p className="text-stone-400 text-sm font-medium mb-3">
                        Bu bölmədə hələ heç bir link yoxdur.
                      </p>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddLink(section.id)}
                          className="px-4 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-stone-200 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Link əlavə et</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* Admin Fast Action: Add Section Button */}
          {isAdmin && (
            <div className="w-full pt-10 pb-4 flex justify-center">
              <button
                type="button"
                onClick={() => setIsAdminPanelOpen(true)}
                className="px-6 py-3 bg-[#18181c] hover:bg-[#232328] border-2 border-stone-700 hover:border-stone-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-white" />
                <span>İdarəetmə Panelini Aç</span>
              </button>
            </div>
          )}

          {/* Minimalist Profile Footer - həmişə ən aşağıda yerləşir */}
          <footer className="mt-auto pt-10 pb-4 border-t border-white/10 w-full text-center">
            <p className="text-xs text-white/50 font-medium tracking-wide">
              {config.profile.name} · QisaGet Platforması
            </p>
          </footer>
        </div>
      </main>

      {/* FULL ADMIN PANEL MODAL (Exact match to requested UI photo and specs) */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        config={config}
        onUpdateConfig={(newConfig) => {
          setConfig(newConfig);
        }}
        onLogout={handleAdminLogout}
        showToast={showToast}
      />

      {/* Admin Password Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        currentPassword={config.adminPassword || 'fres123'}
      />

      {/* Edit Link Modal (Triggered from card three-dot menu) */}
      <EditLinkModal
        isOpen={isEditModalOpen}
        link={editingLink}
        sectionTitle={config.sections.find((s) => s.id === activeSectionId)?.title}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
      />

      {/* Quick Change URL Modal */}
      <QuickUrlModal
        isOpen={isQuickUrlOpen}
        link={quickUrlLink}
        onClose={() => {
          setIsQuickUrlOpen(false);
          setQuickUrlLink(null);
        }}
        onSaveUrl={handleSaveQuickUrl}
      />

      {/* Share & QR Code Modal */}
      <ShareModal
        isOpen={isShareOpen}
        profile={config.profile}
        onClose={() => setIsShareOpen(false)}
      />

      {/* Notification Toast */}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
