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
  Settings2,
  LogOut,
  Plus,
} from 'lucide-react';
import {
  fetchAppConfigFromSupabase,
  subscribeToDatabaseChanges,
  saveConfigToDatabase,
} from './lib/supabase';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(defaultAppConfig);
  const [isSavingToDb, setIsSavingToDb] = useState(false);

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

  // Load config from Supabase / API on mount and subscribe to Realtime updates
  useEffect(() => {
    let isCancelled = false;

    async function loadLatestConfig() {
      try {
        const fetched = await fetchAppConfigFromSupabase();
        if (!isCancelled && fetched) {
          setConfig(fetched);
        }
      } catch (err) {
        console.error('Failed to load config from database:', err);
      }
    }

    // 1. Initial fetch from database
    loadLatestConfig();

    // 2. Realtime listener for cross-device live synchronization (WebSocket + SSE + Polling)
    const unsubscribe = subscribeToDatabaseChanges(
      () => {
        loadLatestConfig();
      },
      (directConfig) => {
        if (!isCancelled && directConfig) {
          setConfig(directConfig);
        }
      }
    );

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, []);

  // Check active server session on page load
  useEffect(() => {
    async function checkServerSession() {
      try {
        const res = await fetch('/api/session', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAdmin(true);
          }
        }
      } catch {
        // Silent failure if offline or error
      }
    }
    checkServerSession();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Save changes to Supabase database via server-side protected API
  const handleSaveToDatabase = async (
    configToSave?: AppConfig,
    silent: boolean = false
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const targetConfig = configToSave || config;
    try {
      setIsSavingToDb(true);
      const res = await saveConfigToDatabase(targetConfig);
      if (res.success) {
        if (!silent) {
          showToast('Saxlanıldı və canlı saytda yeniləndi');
        }
      } else {
        showToast(res.error || 'Xəta: Bazaya saxlanıla bilmədi');
      }
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Server xətası baş verdi';
      showToast(`Xəta: ${msg}`);
      return { success: false, error: msg };
    } finally {
      setIsSavingToDb(false);
    }
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

  // --- Secret Double Click / Double Tap on Footer to Open Admin Login ---
  const lastFooterTapRef = React.useRef<number>(0);
  const handleFooterDoubleClick = () => {
    if (isAdmin) {
      setIsAdminPanelOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleFooterTouchEnd = () => {
    const now = Date.now();
    if (now - lastFooterTapRef.current < 450) {
      if (isAdmin) {
        setIsAdminPanelOpen(true);
      } else {
        setIsLoginModalOpen(true);
      }
    }
    lastFooterTapRef.current = now;
  };

  const handleAdminLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setIsAdmin(true);
    // Avtomatik birbaşa açılmır, istifadəçi istədiyi vaxt yuxarıdakı və ya loqodan aça bilər
    showToast('Admin girişi uğurludur');
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      try {
        sessionStorage.removeItem('admin_auth_active');
      } catch {}
    } catch {}
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

      {/* Top Floating Control Bar - Yalnız Admin daxil olduqda görünür */}
      {isAdmin && (
        <header className="sticky top-3 z-40 px-3 py-1 flex items-center justify-center w-full max-w-lg mx-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <nav
            aria-label="Admin idarəetmə menyusu"
            className="bg-black/85 border border-stone-800 backdrop-blur-md rounded-full px-3 py-1.5 shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center gap-2 text-xs text-white"
          >
            <button
              type="button"
              onClick={() => setIsAdminPanelOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold bg-[#52131b] hover:bg-[#681822] text-rose-200 border border-rose-500/40 shadow-sm transition-all"
              title="İdarəetmə Panelini Aç"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>İdarəetmə Paneli (Admin)</span>
            </button>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full font-medium text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Admin rejimindən çıxış"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıxış</span>
            </button>
          </nav>
        </header>
      )}

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



          {/* Minimalist Profile Footer - həmişə ən aşağıda yerləşir */}
          <footer className="mt-auto pt-10 pb-4 border-t border-white/10 w-full text-center">
            <p
              onDoubleClick={handleFooterDoubleClick}
              onTouchEnd={handleFooterTouchEnd}
              className="text-xs text-white/50 font-medium tracking-wide select-none cursor-pointer hover:text-white/80 active:text-rose-300 transition-colors inline-block px-3 py-1.5 rounded-lg"
              title="Admin girişi üçün iki dəfə klikləyin"
            >
              {config.profile.footerText || `${config.profile.name} · QisaGet Platforması`}
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
        onSaveToDatabase={handleSaveToDatabase}
        isSavingToDatabase={isSavingToDb}
        onLogout={handleAdminLogout}
        showToast={showToast}
      />

      {/* Admin Password Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
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
