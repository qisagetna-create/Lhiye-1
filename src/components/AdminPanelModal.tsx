import React, { useState, useRef, useEffect } from 'react';
import {
  AppConfig,
  ProfileData,
  ThemeConfig,
  SectionItem,
  LinkItem,
  IconType,
} from '../types';
import { THEME_PRESETS, defaultAppConfig } from '../data/defaultConfig';
import { BrandIcon, AVAILABLE_ICONS } from './icons';
import { AvatarFineTuneModal } from './AvatarFineTuneModal';
import { AutoFitMonogram } from './AutoFitMonogram';
import { VerifiedBadge } from './VerifiedBadge';
import {
  ListFilter,
  User,
  Palette,
  RotateCcw,
  LogOut,
  X,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Eye,
  EyeOff,
  Move,
  Lock,
  Upload,
  Sparkles,
  Loader2,
  Cloud,
  Save,
} from 'lucide-react';
import { compressAvatarImage } from '../utils/imageCompressor';
import {
  uploadAvatarToSupabase,
  removeAvatarFromSupabase,
  isSupabaseConfigured,
} from '../lib/supabase';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onSaveToDatabase?: (configToSave?: AppConfig) => Promise<{ success: boolean; message?: string; error?: string }>;
  isSavingToDatabase?: boolean;
  onLogout: () => void;
  showToast: (msg: string) => void;
}

type TabType = 'sections' | 'profile' | 'design' | 'reset';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onSaveToDatabase,
  isSavingToDatabase = false,
  onLogout,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('sections');

  // Tab 1: New section input
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Editing existing section title inline
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');

  // Quick Add Link to a Section inline state
  const [addingToSectionId, setAddingToSectionId] = useState<string | null>(null);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkIcon, setNewLinkIcon] = useState<IconType>('instagram');

  // Editing an existing link inline / modal state
  const [editingLinkData, setEditingLinkData] = useState<{
    sectionId: string;
    link: LinkItem;
  } | null>(null);

  // Tab 2: Profile photo fine-tune dragging state
  const [isFineTuneOpen, setIsFineTuneOpen] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Tab 4: Secure Password Change
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [generatedHashToCopy, setGeneratedHashToCopy] = useState<string | null>(null);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // --- Handlers: Sections ---
  const handleAddSection = () => {
    const title = newSectionTitle.trim();
    if (!title) return;
    const newSec: SectionItem = {
      id: `section-${Date.now()}`,
      title,
      order: config.sections.length + 1,
      links: [],
    };
    onUpdateConfig({
      ...config,
      sections: [...config.sections, newSec],
    });
    setNewSectionTitle('');
    showToast('Yeni bölmə əlavə edildi');
  };

  const handleDeleteSection = (sectionId: string) => {
    if (config.sections.length <= 1) {
      showToast('Ən azı 1 bölmə qalmalıdır');
      return;
    }
    onUpdateConfig({
      ...config,
      sections: config.sections.filter((s) => s.id !== sectionId),
    });
    showToast('Bölmə və daxili linklər silindi');
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= config.sections.length) return;
    const updated = [...config.sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    onUpdateConfig({ ...config, sections: updated });
  };

  const handleSaveSectionTitle = async (sectionId: string) => {
    if (!editingSectionTitle.trim()) return;
    const updatedConfig = {
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, title: editingSectionTitle.trim() } : s
      ),
    };
    onUpdateConfig(updatedConfig);
    setEditingSectionId(null);
    if (onSaveToDatabase) {
      await onSaveToDatabase(updatedConfig);
    } else {
      showToast('Bölmə adı yeniləndi');
    }
  };

  // --- Handlers: Links in Section ---
  const handleAddLinkToSection = async (sectionId: string) => {
    if (!newLinkTitle.trim()) {
      showToast('Kartın adını qeyd edin');
      return;
    }
    const newLink: LinkItem = {
      id: `link-${Date.now()}`,
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim() || '#',
      icon: newLinkIcon,
      visible: true,
      order: 999,
      clicks: 0,
    };
    const updatedConfig = {
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, links: [...s.links, newLink] } : s
      ),
    };
    onUpdateConfig(updatedConfig);
    setAddingToSectionId(null);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setNewLinkIcon('instagram');
    if (onSaveToDatabase) {
      await onSaveToDatabase(updatedConfig);
    } else {
      showToast('Link əlavə edildi');
    }
  };

  const handleToggleLinkVisibility = (sectionId: string, linkId: string) => {
    const updatedConfig = {
      ...config,
      sections: config.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              links: sec.links.map((l) =>
                l.id === linkId ? { ...l, visible: !l.visible } : l
              ),
            }
          : sec
      ),
    };
    onUpdateConfig(updatedConfig);
    if (onSaveToDatabase) {
      onSaveToDatabase(updatedConfig);
    }
  };

  const handleDeleteLink = (sectionId: string, linkId: string) => {
    const updatedConfig = {
      ...config,
      sections: config.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              links: sec.links.filter((l) => l.id !== linkId),
            }
          : sec
      ),
    };
    onUpdateConfig(updatedConfig);
    if (onSaveToDatabase) {
      onSaveToDatabase(updatedConfig);
    }
    showToast('Link silindi');
  };

  const handleMoveLink = (sectionId: string, index: number, direction: 'up' | 'down') => {
    const sec = config.sections.find((s) => s.id === sectionId);
    if (!sec) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sec.links.length) return;

    const newLinks = [...sec.links];
    const temp = newLinks[index];
    newLinks[index] = newLinks[newIndex];
    newLinks[newIndex] = temp;

    const updatedConfig = {
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId ? { ...s, links: newLinks } : s
      ),
    };
    onUpdateConfig(updatedConfig);
    if (onSaveToDatabase) {
      onSaveToDatabase(updatedConfig);
    }
  };

  const handleSaveEditedLink = async () => {
    if (!editingLinkData) return;
    const { sectionId, link } = editingLinkData;
    const updatedConfig = {
      ...config,
      sections: config.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              links: s.links.map((l) => (l.id === link.id ? link : l)),
            }
          : s
      ),
    };
    onUpdateConfig(updatedConfig);
    setEditingLinkData(null);
    if (onSaveToDatabase) {
      await onSaveToDatabase(updatedConfig);
    } else {
      showToast('Link yeniləndi');
    }
  };

  // --- Handlers: Profile Updates ---
  const handleProfileChange = (key: keyof ProfileData, val: any) => {
    onUpdateConfig({
      ...config,
      profile: {
        ...config.profile,
        [key]: val,
      },
    });
  };

  // Image Upload handler with 512x512 compression & Supabase Cloud Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      setUploadProgressText('Şəkil 512x512 ölçüyə və 300KB-dan aza sıxılır...');

      // 1. Compress image to max 512x512 and <= 300KB
      const compressed = await compressAvatarImage(file, 512, 300 * 1024);

      if (isSupabaseConfigured()) {
        setUploadProgressText(`Supabase Storage-ə yüklənir (${compressed.sizeKb} KB)...`);
        const res = await uploadAvatarToSupabase(compressed.file);

        if (res.success && res.url) {
          handleProfileChange('avatarUrl', res.url);
          handleProfileChange('logoMode', 'image');
          showToast(`Foto Supabase-ə yükləndi (${compressed.sizeKb} KB) - Bütün cihazlarda aktivdir`);
        } else {
          showToast(res.error || 'Supabase yükləmə xətası baş verdi');
          // Temporary preview fallback
          handleProfileChange('avatarUrl', compressed.previewUrl);
        }
      } else {
        // Warning when Supabase credentials have not been configured in Vercel yet
        handleProfileChange('avatarUrl', compressed.previewUrl);
        handleProfileChange('logoMode', 'image');
        showToast('Supabase açarları tapılmadı! Vercel-də VITE_SUPABASE_URL və VITE_SUPABASE_ANON_KEY təyin edin.');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      showToast('Şəkil xətası: ' + (err?.message || 'Xəta baş verdi'));
    } finally {
      setIsUploadingImage(false);
      setUploadProgressText('');
      e.target.value = '';
    }
  };

  // Remove avatar handler: clears from Supabase database and restores NMEXMAN fallback
  const handleRemoveImage = async () => {
    try {
      if (isSupabaseConfigured()) {
        await removeAvatarFromSupabase();
      }
    } catch (err) {
      console.error('Failed to remove avatar from Supabase:', err);
    }
    handleProfileChange('avatarUrl', '');
    handleProfileChange('logoMode', 'text');
    handleProfileChange('monogramText', 'NMEXMAN');
    showToast('Şəkil silindi, NMEXMAN fallback aktiv edildi');
  };

  // Dragging logic for fine tuning avatar position
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: config.profile.avatarPosX || 0,
      initialY: config.profile.avatarPosY || 0,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    // convert pixel offset to percentage
    const newX = Math.max(-100, Math.min(100, dragStartPos.current.initialX + Math.round(dx * 0.4)));
    const newY = Math.max(-100, Math.min(100, dragStartPos.current.initialY + Math.round(dy * 0.4)));
    handleProfileChange('avatarPosX', newX);
    handleProfileChange('avatarPosY', newY);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // --- Handlers: Theme Updates ---
  const handleThemeChange = (key: keyof ThemeConfig, val: any) => {
    onUpdateConfig({
      ...config,
      theme: {
        ...config.theme,
        [key]: val,
      },
    });
  };

  const applyPreset = (presetTheme: Partial<ThemeConfig>) => {
    onUpdateConfig({
      ...config,
      theme: {
        ...config.theme,
        ...presetTheme,
      },
    });
    showToast('Mövzu tətbiq edildi');
  };

  // --- Handlers: Password & Reset ---
  const handleResetToDefault = () => {
    if (window.confirm('Bütün dəyişiklikləri silərək ilkin dizayn vəziyyətinə qaytarmaq istədiyinizə əminsiniz?')) {
      onUpdateConfig({
        ...defaultAppConfig,
      });
      showToast('Səhifə ilkin vəziyyətinə qaytarıldı');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setGeneratedHashToCopy(null);

    if (!oldPasswordInput.trim()) {
      setPasswordChangeError('Cari (köhnə) şifrəni daxil edin');
      return;
    }

    if (newPasswordInput.length < 10) {
      setPasswordChangeError('Yeni şifrə ən azı 10 simvol olmalıdır');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPasswordInput);
    const hasNumber = /[0-9]/.test(newPasswordInput);
    if (!hasLetter || !hasNumber) {
      setPasswordChangeError('Yeni şifrədə həm hərf, həm də rəqəm olmalıdır');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('Yeni şifrə ilə təkrarı uyğun gəlmir');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          oldPassword: oldPasswordInput,
          newPassword: newPasswordInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Admin şifrəsi uğurla dəyişdirildi!');
        setOldPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        if (data.newHash) {
          setGeneratedHashToCopy(data.newHash);
        }
      } else {
        setPasswordChangeError(data.error || 'Şifrə dəyişdirilə bilmədi');
      }
    } catch {
      setPasswordChangeError('Serverlə əlaqə qurula bilmədi');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-[92vh] sm:max-w-2xl bg-[#121215] border-0 sm:border sm:border-stone-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans">
        
        {/* TOP HEADER: EXACT MATCH TO USER MOCKUP */}
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#121215]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>İdarəetmə Paneli</span>
                <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-stone-200 border border-white/20">
                  Admin
                </span>
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Profil, bölmələr və linkləri tənzimləyin
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Yadda Saxla Button (Direct Save to Supabase) */}
            <button
              type="button"
              disabled={isSavingToDatabase}
              onClick={async () => {
                if (onSaveToDatabase) {
                  const res = await onSaveToDatabase(config);
                  if (res?.success) {
                    showToast('Saxlanıldı');
                  } else {
                    showToast(res?.error || 'Xəta: Bazaya saxlanıla bilmədi');
                  }
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Dəyişiklikləri Supabase bazasında saxla"
            >
              {isSavingToDatabase ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saxlanılır...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Yadda saxla</span>
                </>
              )}
            </button>

            {/* Çıxış Button */}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs font-semibold transition-colors"
              title="Admin sessiyasından çıxış et"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıxış</span>
            </button>

            {/* Close Button (✕) */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Paneli bağla"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS HEADER: 4 TABS AS IN MOCKUP */}
        <div className="flex items-center border-b border-white/10 px-2 sm:px-4 shrink-0 bg-[#16161a] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`flex items-center gap-1.5 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'sections'
                ? 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Bölmələr</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('design')}
            className={`flex items-center gap-1.5 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'design'
                ? 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Palette className="w-4 h-4 text-stone-300" />
            <span>Dizayn</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`flex items-center gap-1.5 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reset'
                ? 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Sıfırla</span>
          </button>
        </div>

        {/* TAB CONTENTS (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ============================================================== */}
          {/* TAB 1: BÖLMƏLƏR (Exact card layouts and buttons from mockup)  */}
          {/* ============================================================== */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              {/* YENİ BÖLMƏ ƏLAVƏ ET Container */}
              <div className="bg-[#18181d] border border-white/5 rounded-2xl p-3 sm:p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-300 mb-2.5">
                  YENİ BÖLMƏ ƏLAVƏ ET
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="Məs: Bölmə 3 və ya Filial..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                    className="flex-1 bg-[#111114] border border-stone-800 focus:border-stone-600 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-stone-200 font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Əlavə et</span>
                  </button>
                </div>
              </div>

              {/* MÖVCUD BÖLMƏLƏR VƏ ONLARIN KARTLARI */}
              <div className="space-y-4">
                {config.sections.map((section, sIndex) => (
                  <div
                    key={section.id}
                    className="bg-[#18181d] border border-white/5 rounded-2xl p-3 sm:p-4 space-y-3"
                  >
                    {/* Section Header Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        {editingSectionId === section.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingSectionTitle}
                              onChange={(e) => setEditingSectionTitle(e.target.value)}
                              className="bg-[#111114] border border-amber-400 rounded-lg px-2 py-1 text-xs text-white focus:outline-none w-full max-w-xs"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveSectionTitle(section.id)}
                              className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSectionId(null)}
                              className="p-1 rounded-lg bg-stone-700 text-stone-300 hover:bg-stone-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 bg-[#101013] border border-stone-800 rounded-xl px-2.5 py-1 text-stone-200 font-semibold text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSectionId(section.id);
                                setEditingSectionTitle(section.title);
                              }}
                              className="text-stone-400 hover:text-white"
                              title="Bölmə adını redaktə et"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-white select-none">{section.title}</span>
                          </div>
                        )}
                      </div>

                      {/* Section Ordering & Delete controls */}
                      <div className="flex items-center gap-0.5 shrink-0 text-stone-400">
                        <button
                          type="button"
                          disabled={sIndex === 0}
                          onClick={() => handleMoveSection(sIndex, 'up')}
                          className="p-1 rounded-lg text-stone-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none hover:bg-white/5 transition-colors"
                          title="Yuxarı apar"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={sIndex === config.sections.length - 1}
                          onClick={() => handleMoveSection(sIndex, 'down')}
                          className="p-1 rounded-lg text-stone-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none hover:bg-white/5 transition-colors"
                          title="Aşağı apar"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 ml-0.5 transition-colors"
                          title="Bölməni sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Links List Inside This Section (Matches mockup card aesthetic: slightly smaller, sleek) */}
                    <div className="space-y-2">
                      {section.links.map((link, lIndex) => (
                        <div
                          key={link.id}
                          className={`flex items-center justify-between py-2 px-2.5 sm:px-3 rounded-xl bg-[#202026] border border-stone-800/80 shadow-xs transition-opacity ${
                            !link.visible ? 'opacity-50' : ''
                          }`}
                        >
                          {/* Left: Square Icon + Title + URL */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-[#282830] flex items-center justify-center shrink-0 text-white border border-white/5">
                              <BrandIcon name={link.icon} className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1 pr-1.5">
                              <p className="text-xs font-bold text-white truncate leading-tight">
                                {link.title}
                              </p>
                              <p className="text-[10px] text-stone-400 truncate mt-0.5 font-mono">
                                {link.url}
                              </p>
                            </div>
                          </div>

                          {/* Right: Actions (Arrows, Eye, Pencil, Trash) */}
                          <div className="flex items-center gap-1 shrink-0 text-stone-400">
                            {/* Up / Down reorder within section */}
                            <button
                              type="button"
                              disabled={lIndex === 0}
                              onClick={() => handleMoveLink(section.id, lIndex, 'up')}
                              className="p-1 hover:text-white disabled:opacity-20 hover:bg-white/5 rounded-md transition-colors"
                              title="Yuxarı"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={lIndex === section.links.length - 1}
                              onClick={() => handleMoveLink(section.id, lIndex, 'down')}
                              className="p-1 hover:text-white disabled:opacity-20 hover:bg-white/5 rounded-md transition-colors"
                              title="Aşağı"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>

                            {/* Visibility Eye */}
                            <button
                              type="button"
                              onClick={() => handleToggleLinkVisibility(section.id, link.id)}
                              className="p-1 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                              title={link.visible ? 'Gizlət' : 'Göstər'}
                            >
                              {link.visible ? (
                                <Eye className="w-3.5 h-3.5 text-stone-300" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                              )}
                            </button>

                            {/* Edit Pencil */}
                            <button
                              type="button"
                              onClick={() =>
                                setEditingLinkData({
                                  sectionId: section.id,
                                  link: { ...link },
                                })
                              }
                              className="p-1 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                              title="Redaktə et"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Trash Icon */}
                            <button
                              type="button"
                              onClick={() => handleDeleteLink(section.id, link.id)}
                              className="p-1 text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                              title="Linki sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Inline Quick Link Add Drawer */}
                    {addingToSectionId === section.id ? (
                      <div className="p-3 bg-[#141417] border border-white/10 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-bold uppercase text-stone-300">
                            Yeni Keçid Əlavə Et
                          </h4>
                          <button
                            type="button"
                            onClick={() => setAddingToSectionId(null)}
                            className="text-stone-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">
                            Kartın Adı (məs: TikTok Kanalımız)
                          </label>
                          <input
                            type="text"
                            value={newLinkTitle}
                            onChange={(e) => setNewLinkTitle(e.target.value)}
                            placeholder="Məs: WhatsApp Əlaqə"
                            className="w-full bg-[#1e1e24] border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">
                            URL Keçidi (məs: https://...)
                          </label>
                          <input
                            type="url"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-[#1e1e24] border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">
                            İkon Seçimi
                          </label>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 bg-[#1e1e24] rounded-lg border border-stone-800">
                            {AVAILABLE_ICONS.map((ic) => (
                              <button
                                key={ic.type}
                                type="button"
                                onClick={() => setNewLinkIcon(ic.type)}
                                className={`flex flex-col items-center justify-center p-1.5 rounded-md text-[10px] gap-1 transition-colors ${
                                  newLinkIcon === ic.type
                                    ? 'bg-white text-black font-bold'
                                    : 'text-stone-300 hover:bg-white/10'
                                }`}
                              >
                                <BrandIcon name={ic.type} className="w-4 h-4" />
                                <span className="text-[9px] truncate max-w-full">{ic.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setAddingToSectionId(null)}
                            className="px-3 py-1 text-xs text-stone-400 hover:text-white rounded-md"
                          >
                            Ləğv et
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddLinkToSection(section.id)}
                            className="px-3.5 py-1 text-xs bg-white text-black font-bold rounded-lg hover:bg-stone-200 transition-colors"
                          >
                            Əlavə et
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* "+ Bu bölməyə link əlavə et" Dashed Button */
                      <button
                        type="button"
                        onClick={() => {
                          setAddingToSectionId(section.id);
                          setNewLinkTitle('');
                          setNewLinkUrl('');
                          setNewLinkIcon('instagram');
                        }}
                        className="w-full py-2 px-3 border border-dashed border-stone-700/80 hover:border-stone-500 rounded-xl flex items-center justify-center gap-1.5 text-stone-300 hover:text-white text-xs font-medium transition-colors bg-[#18181d]/40 hover:bg-[#18181d]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Bu bölməyə link əlavə et</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Tab 1 Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isSavingToDatabase}
                  onClick={async () => {
                    if (onSaveToDatabase) {
                      const res = await onSaveToDatabase(config);
                      if (res?.success) {
                        showToast('Saxlanıldı');
                      } else {
                        showToast(res?.error || 'Xəta: Bazaya saxlanıla bilmədi');
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingToDatabase ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saxlanılır...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Dəyişiklikləri Yadda Saxla</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: PROFİL (Şəxsiyyət və Şəkil Tənzimləmələri)               */}
          {/* ============================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* PROFİL ŞƏKLİ / LOQO SECTION */}
              <div className="bg-[#18181c] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                {/* 1. Blokun Başlığı */}
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                  PROFİL ŞƏKLİ / LOQO
                </h3>

                {/* 2 & 3: Sol Tərəf Canlı Dairəvi Önizləmə + Sağ Tərəf İdarəetmə Düymələri və Xanalar */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
                  
                  {/* Sol Tərəf - Canlı Dairəvi Önizləmə (Canlı Avatar - 84x84px) */}
                  <div className="flex flex-col items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (config.profile.logoMode !== 'text') {
                          setIsFineTuneOpen(true);
                        }
                      }}
                      className={`group relative w-[84px] h-[84px] rounded-full bg-black border-2 border-stone-600 ring-2 ring-white/10 shadow-lg overflow-hidden flex items-center justify-center transition-all ${
                        config.profile.logoMode !== 'text' ? 'cursor-pointer hover:border-white' : 'cursor-default'
                      }`}
                      title={config.profile.logoMode !== 'text' ? "Şəkil mövqeyini və miqyasını tənzimləmək üçün klikləyin" : "Yazılı loqo avtomatik uyğunlaşır"}
                    >
                      {/* Canlı şəklin əsas səhifə ilə 100% eyni sinxron renderi (Zero-Crop qaydası) */}
                      {config.profile.logoMode !== 'text' && config.profile.avatarUrl ? (
                        <img
                          src={config.profile.avatarUrl}
                          alt="Canlı Avatar"
                          className="max-w-full max-h-full w-full h-full select-none pointer-events-none transition-transform duration-75"
                          style={{
                            objectFit: 'contain',
                            transform: `scale(${((config.profile.avatarZoom || 100) / 100)}) translate(${config.profile.avatarPosX || 0}%, ${config.profile.avatarPosY || 0}%)`,
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-1 text-center bg-black">
                          <AutoFitMonogram text={config.profile.monogramText || 'username'} />
                        </div>
                      )}

                      {/* Hover Overlay: Tənzimlə İkonu (Yalnız foto olduqda göstərilir) */}
                      {config.profile.logoMode !== 'text' && (
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold gap-0.5 backdrop-blur-xs">
                          <Move className="w-4 h-4" />
                          <span>Tənzimlə</span>
                        </div>
                      )}
                    </button>
                    <span className="text-[10px] text-stone-400 font-medium mt-1.5 tracking-tight">
                      Canlı Önizləmə
                    </span>
                  </div>

                  {/* Sağ Tərəf - İdarəetmə Düymələri və Xanalar */}
                  <div className="flex-1 w-full space-y-3">
                    
                    {/* 1-ci sətir (Rejim Seçimi - İki həbli düymə) */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-[#121215] border border-stone-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleProfileChange('logoMode', 'text')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          config.profile.logoMode === 'text'
                            ? 'bg-white text-black shadow-md'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                        }`}
                      >
                        Yazılı Loqo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProfileChange('logoMode', 'image')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          config.profile.logoMode !== 'text'
                            ? 'bg-white text-black shadow-md'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                        }`}
                      >
                        Şəkil / Fayl
                      </button>
                    </div>

                    {/* Əgər Yazılı Loqo rejimi seçilibsə: Monogram Mətni Xanası */}
                    {config.profile.logoMode === 'text' && (
                      <div className="space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-semibold text-stone-300 uppercase">
                            Yazılı Loqo Mətni (Auto-Fit Scale)
                          </label>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {(config.profile.monogramText || 'username').trim().length} hərf
                          </span>
                        </div>
                        <input
                          type="text"
                          value={config.profile.monogramText || ''}
                          onChange={(e) => handleProfileChange('monogramText', e.target.value)}
                          placeholder="Məs: username, AZERBAIJAN, MYBRAND..."
                          className="w-full bg-[#111114] border border-stone-700 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white uppercase tracking-wider font-bold focus:outline-none transition-colors"
                        />
                        <p className="text-[10px] text-stone-400 leading-normal">
                          Daxil edilən söz dairənin kənarlarına dəymədən avtomatik kiçilir və kəsilmir. Çoxsözlü olduqda avtomatik alt-alta mərkəzləşdirilir.
                        </p>
                      </div>
                    )}

                    {/* Əgər Şəkil / Fayl rejimi seçilibsə: Şəkil Linki Xanası */}
                    {config.profile.logoMode !== 'text' && (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-stone-300 uppercase">
                          Şəkil Linki (URL)
                        </label>
                        <input
                          type="url"
                          value={config.profile.avatarUrl || ''}
                          onChange={(e) => handleProfileChange('avatarUrl', e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-[#111114] border border-stone-700 focus:border-white rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-600 focus:outline-none transition-colors"
                        />
                      </div>
                    )}

                    {/* 3-cü sətir (Fayl Yükləmə Düyməsi) - Yalnız Şəkil rejimində */}
                    {config.profile.logoMode !== 'text' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 ${
                              isUploadingImage
                                ? 'bg-stone-800 opacity-80 cursor-wait'
                                : 'bg-[#24242c] hover:bg-[#2c2c36] cursor-pointer'
                            } text-stone-200 border border-stone-700 hover:border-stone-600 rounded-xl text-xs font-semibold transition-colors`}
                          >
                            {isUploadingImage ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 text-stone-300 animate-spin" />
                                <span className="truncate">{uploadProgressText || 'Yüklənir...'}</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 text-stone-300" />
                                <span>Şəkil faylı yüklə (512x512, Cloud)</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingImage}
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          {config.profile.avatarUrl && (
                            <button
                              type="button"
                              disabled={isUploadingImage}
                              onClick={handleRemoveImage}
                              className="py-2 px-3 text-xs text-stone-400 hover:text-white border border-stone-700 hover:bg-stone-800 rounded-xl transition-colors font-medium disabled:opacity-40"
                              title="Şəkli sil və NMEXMAN fallback mətni göstər"
                            >
                              Sil
                            </button>
                          )}
                        </div>

                        {/* Supabase Bulud Vəziyyəti Göstəricisi */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/5 text-[10px]">
                          <span className="text-stone-400 flex items-center gap-1.5">
                            <Cloud className="w-3 h-3 text-stone-400" />
                            <span>Supabase Bulud Baza & Storage:</span>
                          </span>
                          <span
                            className={`font-semibold flex items-center gap-1 ${
                              isSupabaseConfigured() ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSupabaseConfigured()
                                  ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                                  : 'bg-amber-400'
                              }`}
                            />
                            {isSupabaseConfigured()
                              ? 'Aktiv (Hamı eyni şəkli görür)'
                              : 'Quraşdırılmayıb (Vercel .env əlavə edin)'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 4-cü sətir: Tənzimləmə Düyməsi - YALNIZ Şəkil rejimində aktivdir, Yazılı loqoda gizlədilir */}
                    {config.profile.logoMode !== 'text' && (
                      <button
                        type="button"
                        onClick={() => setIsFineTuneOpen(true)}
                        className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 hover:border-stone-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                      >
                        <Move className="w-4 h-4 text-stone-300 shrink-0" />
                        <span>[ ↗ Ölçü və Mövqeyi Tənzimlə ]</span>
                      </button>
                    )}

                  </div>
                </div>
              </div>

              {/* İSTİFADƏÇİ ADI VƏ HAQQINDA MƏTNİ */}
              <div className="bg-[#1b1b20] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                {/* İstifadəçi adı xanası - @ simvolu daxildə sabit qalır */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    İstifadəçi adı (Username)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-base font-bold text-stone-400 select-none pointer-events-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={(config.profile.name || '').replace(/^@+/, '')}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/^@+/, '');
                        handleProfileChange('name', cleanVal ? `@${cleanVal}` : '@');
                      }}
                      placeholder="username"
                      className="w-full bg-[#111114] border border-stone-700 focus:border-white rounded-xl pl-8 pr-3.5 py-2 text-sm text-white font-bold focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Qısa təsvir (Bio) */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-stone-300">
                    Qısa təsvir (Bio)
                  </label>
                  <textarea
                    rows={3}
                    value={config.profile.description}
                    onChange={(e) => handleProfileChange('description', e.target.value)}
                    placeholder="Qısa təsvir..."
                    className="w-full bg-[#111114] border border-stone-700 focus:border-white rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none resize-none transition-colors"
                  />
                </div>
              </div>

              {/* TƏSDİQ NİŞANI (VERIFIED BADGE) SEÇİMİ */}
              <div className="bg-[#1b1b20] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>Təsdiq Nişanı (Verified Tik)</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      İstifadəçi adının yanında rəsmi təsdiq nişanını göstər
                    </p>
                  </div>
                  {/* Switch Button */}
                  <button
                    type="button"
                    onClick={() => handleProfileChange('verified', !config.profile.verified)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.profile.verified ? 'bg-sky-500' : 'bg-stone-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.profile.verified ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {config.profile.verified && (
                  <div className="pt-3 border-t border-white/5 space-y-2.5">
                    <label className="block text-xs font-semibold text-stone-300">
                      Təsdiq nişanının üslubunu seçin:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* 1. Mavi Tik (Instagram / Twitter) */}
                      <button
                        type="button"
                        onClick={() => handleProfileChange('verifiedBadgeType', 'blue')}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          (config.profile.verifiedBadgeType || 'blue') === 'blue'
                            ? 'bg-sky-500/20 border-sky-400 text-white ring-1 ring-sky-400/40 shadow-[0_0_15px_rgba(0,149,246,0.2)]'
                            : 'bg-[#141418] border-white/10 text-stone-400 hover:border-white/20 hover:text-stone-200'
                        }`}
                      >
                        <VerifiedBadge type="blue" className="w-6 h-6 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">Mavi Tik</div>
                          <div className="text-[10px] text-stone-400">Instagram stili</div>
                        </div>
                      </button>

                      {/* 2. Qızıl Tik (Gold / VIP) */}
                      <button
                        type="button"
                        onClick={() => handleProfileChange('verifiedBadgeType', 'gold')}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          config.profile.verifiedBadgeType === 'gold'
                            ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-[#141418] border-white/10 text-stone-400 hover:border-white/20 hover:text-stone-200'
                        }`}
                      >
                        <VerifiedBadge type="gold" className="w-6 h-6 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">Qızıl Tik</div>
                          <div className="text-[10px] text-stone-400">VIP / Gold ulduz</div>
                        </div>
                      </button>

                      {/* 3. Ağ Tik (Minimalist) */}
                      <button
                        type="button"
                        onClick={() => handleProfileChange('verifiedBadgeType', 'white')}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          config.profile.verifiedBadgeType === 'white'
                            ? 'bg-white/20 border-white text-white ring-1 ring-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                            : 'bg-[#141418] border-white/10 text-stone-400 hover:border-white/20 hover:text-stone-200'
                        }`}
                      >
                        <VerifiedBadge type="white" className="w-6 h-6 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-white">Ağ Tik</div>
                          <div className="text-[10px] text-stone-400">Klassik dairəvi</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER MƏTNİ */}
              <div className="bg-[#1b1b20] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-2">
                <label className="block text-xs font-semibold text-stone-300">
                  Aşağı Səhifə (Footer) Mətni
                </label>
                <input
                  type="text"
                  value={config.profile.footerText || `${config.profile.name} · QisaGet Platforması`}
                  onChange={(e) => handleProfileChange('footerText', e.target.value)}
                  placeholder="Məs: nmexman · QisaGet Platforması"
                  className="w-full bg-[#111114] border border-stone-700 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                />
              </div>

              {/* Tab 2 Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isSavingToDatabase}
                  onClick={async () => {
                    if (onSaveToDatabase) {
                      const res = await onSaveToDatabase(config);
                      if (res?.success) {
                        showToast('Saxlanıldı');
                      } else {
                        showToast(res?.error || 'Xəta: Bazaya saxlanıla bilmədi');
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingToDatabase ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saxlanılır...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Profili Yadda Saxla</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: DİZAYN (Rənglər və Vizual Görünüş)                      */}
          {/* ============================================================== */}
          {activeTab === 'design' && (
            <div className="space-y-6">
              {/* 1. RƏNG ŞABLONLARI KARTI (PRESETS GRID) */}
              <div className="bg-[#141416] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-300">
                    RƏNG ŞABLONLARI (QARANLIQ / ŞƏRAB QIRMIZISI)
                  </h3>
                  <span className="text-[10px] text-stone-500 font-medium">1 toxunuşla tətbiq et</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {THEME_PRESETS.map((preset) => {
                    const isActive = config.theme.presetName === preset.theme.presetName;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.theme)}
                        className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border text-center transition-all relative cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-[#220a10] border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.35)] ring-1 ring-rose-500/50'
                            : 'bg-[#18181c] border-stone-800 hover:border-stone-700 hover:bg-[#202026]'
                        }`}
                      >
                        {/* Dot indicator */}
                        <div
                          className="w-4 h-4 rounded-full mb-2 border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.dotColor }}
                        />
                        <span className={`text-xs font-bold ${isActive ? 'text-rose-200' : 'text-white'}`}>
                          {preset.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] text-rose-400 font-medium mt-0.5">
                            ✓ Aktiv
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. FƏRDİ RƏNG SEÇİCİLƏRİ (REAL-TIME COLOR PICKERS SİYAHISI) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-300">
                    FƏRDİ RƏNG SEÇİCİLƏRİ (REAL-TIME)
                  </h3>
                  <span className="text-[10px] text-stone-400">Canlı və gecikməsiz</span>
                </div>

                {/* Siyahı: 7 Fərdi Rəng Kartı */}
                {[
                  {
                    id: 'gradientStart',
                    label: 'Arxa Fon Yuxarı Rəngi',
                    desc: 'Səhifənin yuxarı başlanğıc gradient rəngi',
                    value: config.theme.gradientStart || '#4a0a14',
                    fallback: '#4a0a14',
                    onChange: (val: string) => {
                      onUpdateConfig({
                        ...config,
                        theme: {
                          ...config.theme,
                          bgType: 'gradient',
                          gradientStart: val,
                        },
                      });
                    },
                  },
                  {
                    id: 'gradientMid',
                    label: 'Arxa Fon Orta (Parıltı) Rəngi',
                    desc: 'Mərkəzi dərinlik və parıltı effekti',
                    value: config.theme.gradientMid || '#240409',
                    fallback: '#240409',
                    onChange: (val: string) => {
                      onUpdateConfig({
                        ...config,
                        theme: {
                          ...config.theme,
                          bgType: 'gradient',
                          gradientMid: val,
                        },
                      });
                    },
                  },
                  {
                    id: 'gradientEnd',
                    label: 'Arxa Fon Aşağı Rəngi',
                    desc: 'Səhifənin ən altındakı son gradient rəngi',
                    value: config.theme.gradientEnd || '#0d0103',
                    fallback: '#0d0103',
                    onChange: (val: string) => {
                      onUpdateConfig({
                        ...config,
                        theme: {
                          ...config.theme,
                          bgType: 'gradient',
                          gradientEnd: val,
                          bgColor: val,
                        },
                      });
                    },
                  },
                  {
                    id: 'cardBg',
                    label: 'Link Kartlarının Fon Rəngi',
                    desc: 'Bütün link bloklarının daxili arxa planı',
                    value: config.theme.cardBg || '#2a0a12',
                    fallback: '#2a0a12',
                    onChange: (val: string) => handleThemeChange('cardBg', val),
                  },
                  {
                    id: 'cardBorderColor',
                    label: 'Kart Haşiyə Rəngi (Border)',
                    desc: 'Kartların ətrafındakı haşiyə konturu',
                    value: config.theme.cardBorderColor || '#120205',
                    fallback: '#120205',
                    onChange: (val: string) => handleThemeChange('cardBorderColor', val),
                  },
                  {
                    id: 'textColor',
                    label: 'Kart Mətn Rəngi',
                    desc: 'Link başlığının oxunaqlı şrift rəngi',
                    value: config.theme.textColor || '#ffffff',
                    fallback: '#ffffff',
                    onChange: (val: string) => handleThemeChange('textColor', val),
                  },
                  {
                    id: 'iconColor',
                    label: 'İkon Rəngi',
                    desc: 'Kartın sol tərəfindəki brend loqolarının rəngi',
                    value: config.theme.iconColor || '#ffffff',
                    fallback: '#ffffff',
                    onChange: (val: string) => handleThemeChange('iconColor', val),
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 bg-[#141416] border border-white/10 rounded-2xl shadow-sm hover:border-white/20 transition-colors"
                  >
                    <div className="flex-1 pr-3">
                      <div className="text-xs font-bold text-white tracking-tight">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-stone-400 leading-snug">
                        {item.desc}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Hex Text badge */}
                      <span className="font-mono text-xs text-stone-300 font-semibold px-2 py-1 bg-black/40 rounded-lg border border-white/10 uppercase">
                        {item.value || item.fallback}
                      </span>

                      {/* 32x32 Color Swatch with native color picker & onInput for ultra-fast reaction */}
                      <label className="relative w-8 h-8 rounded-xl border border-white/30 cursor-pointer overflow-hidden shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                        <span
                          className="w-full h-full block"
                          style={{ backgroundColor: item.value || item.fallback }}
                        />
                        <input
                          type="color"
                          value={item.value || item.fallback}
                          onInput={(e) => item.onChange((e.target as HTMLInputElement).value)}
                          onChange={(e) => item.onChange((e.target as HTMLInputElement).value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          title="Rəngi seçin"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* 3. ARXA FON ŞƏKLİ SEÇİMİ (KÖNÜLLÜ) */}
              <div className="bg-[#141416] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-300">
                    ARXA FON ŞƏKLİ (KÖNÜLLÜ URL)
                  </h3>
                  {config.theme.bgImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateConfig({
                          ...config,
                          theme: {
                            ...config.theme,
                            bgImageUrl: '',
                            bgType: 'gradient',
                          },
                        });
                      }}
                      className="text-[10px] text-rose-400 hover:underline font-semibold"
                    >
                      Şəkli təmizlə
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <input
                    type="url"
                    value={config.theme.bgImageUrl || ''}
                    placeholder="https://images.unsplash.com/..."
                    onInput={(e) => {
                      const val = (e.target as HTMLInputElement).value;
                      onUpdateConfig({
                        ...config,
                        theme: {
                          ...config.theme,
                          bgImageUrl: val,
                          bgType: val ? 'image' : 'gradient',
                        },
                      });
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateConfig({
                        ...config,
                        theme: {
                          ...config.theme,
                          bgImageUrl: val,
                          bgType: val ? 'image' : 'gradient',
                        },
                      });
                    }}
                    className="w-full bg-[#101012] border border-stone-700 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-stone-500">
                    Şəkil təyin edildikdə gradient arxa fonda qorunur və üzərinə zərif qaranlıq filtr tətbiq olunur.
                  </p>
                </div>
              </div>

              {/* Tab 3 Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isSavingToDatabase}
                  onClick={async () => {
                    if (onSaveToDatabase) {
                      const res = await onSaveToDatabase(config);
                      if (res?.success) {
                        showToast('Saxlanıldı');
                      } else {
                        showToast(res?.error || 'Xəta: Bazaya saxlanıla bilmədi');
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingToDatabase ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saxlanılır...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Dizaynı Yadda Saxla</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: SIFIRLA (Təhlükəsizlik və İlkin Vəziyyət)                */}
          {/* ============================================================== */}
          {activeTab === 'reset' && (
            <div className="space-y-4">
              {/* ADMİN GİRİŞ ŞİFRƏSİNİ DƏYİŞDİR */}
              <div className="bg-[#1b1b20] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>ADMİN GİRİŞ ŞİFRƏSİNİ DƏYİŞDİR</span>
                  </h3>
                  <span className="text-[10px] text-stone-400 uppercase font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                    Bcrypt Hash
                  </span>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3.5">
                  {/* Köhnə Şifrə */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 uppercase mb-1">
                      Cari (Köhnə) Şifrə
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPass ? 'text' : 'password'}
                        value={oldPasswordInput}
                        onChange={(e) => {
                          setOldPasswordInput(e.target.value);
                          setPasswordChangeError(null);
                        }}
                        placeholder="Hazırkı şifrənizi daxil edin..."
                        className="w-full bg-[#111114] border border-stone-700 focus:border-white rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1"
                      >
                        {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Yeni Şifrə */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 uppercase mb-1">
                      Yeni Şifrə (Minimum 10 simvol, hərf və rəqəm)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPasswordInput}
                        onChange={(e) => {
                          setNewPasswordInput(e.target.value);
                          setPasswordChangeError(null);
                        }}
                        placeholder="Yeni güclü şifrə..."
                        className="w-full bg-[#111114] border border-stone-700 focus:border-white rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white focus:outline-none transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1"
                      >
                        {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Yeni Şifrənin Təkrarı */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 uppercase mb-1">
                      Yeni Şifrənin Təkrarı
                    </label>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={(e) => {
                        setConfirmPasswordInput(e.target.value);
                        setPasswordChangeError(null);
                      }}
                      placeholder="Yeni şifrəni təkrar daxil edin..."
                      className="w-full bg-[#111114] border border-stone-700 focus:border-white rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
                    />
                  </div>

                  {/* Təhlükəsizlik Tələbləri İndikatoru */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-stone-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${newPasswordInput.length >= 10 ? 'bg-emerald-400' : 'bg-stone-600'}`} />
                      <span>Minimum 10 simvol ({newPasswordInput.length}/10)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${/[a-zA-Z]/.test(newPasswordInput) && /[0-9]/.test(newPasswordInput) ? 'bg-emerald-400' : 'bg-stone-600'}`} />
                      <span>Həm hərf, həm də ən azı 1 rəqəm daxil edilməlidir</span>
                    </div>
                  </div>

                  {passwordChangeError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                      {passwordChangeError}
                    </div>
                  )}

                  {generatedHashToCopy && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                      <p className="font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Şifrə uğurla dəyişdirildi!</span>
                      </p>
                      <p className="text-[11px] text-stone-300">
                        Vercel-də <code className="text-amber-300 font-mono">ADMIN_PASSWORD_HASH</code> dəyişənini yeniləmək üçün yeni hash:
                      </p>
                      <div className="p-2 bg-black/60 rounded-lg border border-white/10 font-mono text-[10px] break-all select-all text-stone-200">
                        {generatedHashToCopy}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Yoxlanılır və yenilənir...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Şifrəni Yenilə</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* İlkin Vəziyyətə Qaytar (Aşağıya salındı və ölçüsü kompaktlaşdırıldı) */}
              <div className="bg-[#18181c] border border-rose-500/20 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>İlkin Vəziyyətə Qaytar</span>
                  </h3>
                  <p className="text-[11px] text-stone-400 max-w-md">
                    Səhifəni referans ilkin dizaynına qaytarır (bölmələr və rənglər sıfırlanacaq).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition-all shrink-0 self-start sm:self-auto"
                >
                  Bütün Dəyişiklikləri Sıfırla
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM FOOTER: EXACT MATCH TO USER MOCKUP */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-white/10 flex items-center justify-between shrink-0 bg-[#16161a]">
          <span className="text-xs sm:text-sm text-stone-400">
            Dəyişikliklər anında yadda saxlanılır
          </span>

          {/* [ ✓ Tamamla ] Düyməsi (White pill button as in mockup) */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 bg-white text-black hover:bg-stone-200 font-bold rounded-full text-xs sm:text-sm shadow-md transition-colors"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Tamamla</span>
          </button>
        </div>

        {/* MODAL FOR EDITING A SINGLE LINK */}
        {editingLinkData && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#18181d] border border-white/10 rounded-2xl p-5 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">Linki Redaktə Et</h4>
                <button
                  type="button"
                  onClick={() => setEditingLinkData(null)}
                  className="text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">Başlıq</label>
                <input
                  type="text"
                  value={editingLinkData.link.title}
                  onChange={(e) =>
                    setEditingLinkData({
                      ...editingLinkData,
                      link: { ...editingLinkData.link, title: e.target.value },
                    })
                  }
                  className="w-full bg-[#111114] border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">URL Keçid</label>
                <input
                  type="text"
                  value={editingLinkData.link.url}
                  onChange={(e) =>
                    setEditingLinkData({
                      ...editingLinkData,
                      link: { ...editingLinkData.link, url: e.target.value },
                    })
                  }
                  className="w-full bg-[#111114] border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">İkon</label>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-[#111114] rounded-xl border border-stone-800">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic.type}
                      type="button"
                      onClick={() =>
                        setEditingLinkData({
                          ...editingLinkData,
                          link: { ...editingLinkData.link, icon: ic.type },
                        })
                      }
                      className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs gap-1 transition-colors ${
                        editingLinkData.link.icon === ic.type
                          ? 'bg-white text-black font-bold'
                          : 'text-stone-300 hover:bg-white/10'
                      }`}
                    >
                      <BrandIcon name={ic.type} className="w-5 h-5" />
                      <span className="text-[10px] truncate max-w-full">{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLinkData(null)}
                  className="px-4 py-2 text-xs text-stone-400 hover:text-white"
                >
                  Ləğv et
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedLink}
                  className="px-5 py-2 text-xs bg-white text-black font-bold rounded-xl hover:bg-stone-200"
                >
                  Yadda saxla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Ölçü və Mövqeyi Tənzimlə (Avatar Fine Tune Modal) */}
        <AvatarFineTuneModal
          isOpen={isFineTuneOpen}
          profile={config.profile}
          onClose={() => setIsFineTuneOpen(false)}
          onUpdate={handleProfileChange}
        />

      </div>
    </div>
  );
};
