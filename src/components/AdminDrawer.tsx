import React, { useState } from 'react';
import { AppConfig, ThemeConfig, ProfileData, SectionItem } from '../types';
import { THEME_PRESETS } from '../data/defaultConfig';
import { VerifiedBadge } from './VerifiedBadge';
import {
  X,
  Palette,
  User,
  Layers,
  Settings,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Download,
  Upload,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

interface AdminDrawerProps {
  isOpen: boolean;
  config: AppConfig;
  onClose: () => void;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onResetDefault: () => void;
  onOpenAddLink: (sectionId: string) => void;
}

export const AdminDrawer: React.FC<AdminDrawerProps> = ({
  isOpen,
  config,
  onClose,
  onUpdateConfig,
  onResetDefault,
  onOpenAddLink,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'sections' | 'data'>('profile');
  const [newSectionTitle, setNewSectionTitle] = useState('');

  if (!isOpen) return null;

  const updateProfile = (field: keyof ProfileData, value: any) => {
    onUpdateConfig({
      ...config,
      profile: {
        ...config.profile,
        [field]: value,
      },
    });
  };

  const updateTheme = (field: keyof ThemeConfig, value: any) => {
    onUpdateConfig({
      ...config,
      theme: {
        ...config.theme,
        [field]: value,
      },
    });
  };

  const applyThemePreset = (preset: typeof THEME_PRESETS[0]) => {
    onUpdateConfig({
      ...config,
      theme: {
        ...config.theme,
        ...preset.theme,
      },
    });
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    const newSection: SectionItem = {
      id: `section-${Date.now()}`,
      title: newSectionTitle.trim(),
      order: config.sections.length + 1,
      links: [],
    };

    onUpdateConfig({
      ...config,
      sections: [...config.sections, newSection],
    });
    setNewSectionTitle('');
  };

  const handleDeleteSection = (sectionId: string) => {
    if (config.sections.length <= 1) {
      alert('Ən azı 1 bölmə saxlanılmalıdır.');
      return;
    }
    if (confirm('Bu bölməni və daxilindəki bütün linkləri silmək istədiyinizə əminsiniz?')) {
      onUpdateConfig({
        ...config,
        sections: config.sections.filter((s) => s.id !== sectionId),
      });
    }
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...config.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // reindex order
    newSections.forEach((s, idx) => {
      s.order = idx + 1;
    });

    onUpdateConfig({
      ...config,
      sections: newSections,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'bg') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'avatar') {
          updateProfile('avatarUrl', reader.result as string);
        } else {
          updateTheme('bgImageUrl', reader.result as string);
          updateTheme('bgType', 'image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `linkflow-config-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.profile && parsed.theme && parsed.sections) {
            onUpdateConfig(parsed);
            alert('Konfiqurasiya uğurla yükləndi!');
          } else {
            alert('Yanlış fayl formatı.');
          }
        } catch (err) {
          alert('JSON faylını oxuyarkən xəta baş verdi.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className="w-screen max-w-md bg-[#16161b] border-l-2 border-black shadow-2xl flex flex-col text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#121216]">
            <div>
              <h2 className="text-lg font-bold">Profil İdarəetmə Paneli</h2>
              <p className="text-xs text-stone-400">Canlı redaktə və fərdiləşdirmə</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-[#141418] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === 'profile'
                  ? 'border-white text-white bg-white/5'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profil</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === 'theme'
                  ? 'border-white text-white bg-white/5'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Dizayn</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === 'sections'
                  ? 'border-white text-white bg-white/5'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Bölmələr</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === 'data'
                  ? 'border-white text-white bg-white/5'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Tənzimləmə</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
                    Profil Şəkli / Loqo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-black/60 border-2 border-white/20 flex items-center justify-center shrink-0">
                      {config.profile.avatarUrl ? (
                        <img
                          src={config.profile.avatarUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-extrabold text-xl">
                          {config.profile.name.replace('@', '').charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block">
                        <span className="sr-only">Şəkil seçin</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'avatar')}
                          className="block w-full text-xs text-stone-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                        />
                      </label>
                      {config.profile.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => updateProfile('avatarUrl', '')}
                          className="text-xs text-rose-400 hover:underline"
                        >
                          Şəkli sil (Monogram emblemə qayıt)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                    İstifadəçi Adı (Username)
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
                        updateProfile('name', cleanVal ? `@${cleanVal}` : '@');
                      }}
                      placeholder="username"
                      className="w-full pl-8 pr-4 py-2.5 bg-[#202028] border-2 border-black rounded-xl text-white focus:outline-none focus:border-white/50 text-base font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                    Qısa Təsvir (Bio)
                  </label>
                  <textarea
                    rows={2}
                    value={config.profile.description}
                    onChange={(e) => updateProfile('description', e.target.value)}
                    placeholder="Qısa təsvir"
                    className="w-full px-4 py-2.5 bg-[#202028] border-2 border-black rounded-xl text-white focus:outline-none focus:border-white/50 text-sm font-medium resize-none"
                  />
                </div>

                <div className="p-3.5 bg-[#202028] border-2 border-black rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Təsdiq nişanı (Verified Badge)</p>
                      <p className="text-xs text-stone-400">Adın yanında rəsmi təsdiq nişanını göstər</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateProfile('verified', !config.profile.verified)}
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
                    <div className="pt-2 border-t border-white/10 flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateProfile('verifiedBadgeType', 'blue')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                          (config.profile.verifiedBadgeType || 'blue') === 'blue'
                            ? 'bg-sky-500/20 border-sky-400 text-white'
                            : 'bg-black/20 border-white/10 text-stone-400'
                        }`}
                      >
                        <VerifiedBadge type="blue" className="w-4 h-4 shrink-0" />
                        <span>Mavi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProfile('verifiedBadgeType', 'gold')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                          config.profile.verifiedBadgeType === 'gold'
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-black/20 border-white/10 text-stone-400'
                        }`}
                      >
                        <VerifiedBadge type="gold" className="w-4 h-4 shrink-0" />
                        <span>Qızıl</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateProfile('verifiedBadgeType', 'white')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border ${
                          config.profile.verifiedBadgeType === 'white'
                            ? 'bg-white/20 border-white text-white'
                            : 'bg-black/20 border-white/10 text-stone-400'
                        }`}
                      >
                        <VerifiedBadge type="white" className="w-4 h-4 shrink-0" />
                        <span>Ağ</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. THEME TAB */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                {/* Presets */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
                    Lüks Mövzu Şablonları
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_PRESETS.map((p) => {
                      const isActive = config.theme.presetName === p.name;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => applyThemePreset(p)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-white/20 border-white text-white font-bold'
                              : 'bg-[#202028] border-white/10 text-stone-300 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="w-4 h-4 rounded-full border border-black"
                              style={{ backgroundColor: p.theme.bgColor }}
                            />
                            <span className="truncate">{p.name}</span>
                          </div>
                          <div className="text-[10px] text-stone-400 truncate">
                            {p.theme.cardBg}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Background Styling */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Arxa Fon Tənzimləməsi (Background)
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-stone-400 block mb-1">Qradiyent Başlanğıc</span>
                      <div className="flex items-center gap-2 bg-[#202028] p-1.5 rounded-xl border border-black">
                        <input
                          type="color"
                          value={config.theme.gradientStart}
                          onChange={(e) => {
                            updateTheme('gradientStart', e.target.value);
                            updateTheme('bgType', 'gradient');
                          }}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono">{config.theme.gradientStart}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-stone-400 block mb-1">Qradiyent Sonu</span>
                      <div className="flex items-center gap-2 bg-[#202028] p-1.5 rounded-xl border border-black">
                        <input
                          type="color"
                          value={config.theme.gradientEnd}
                          onChange={(e) => {
                            updateTheme('gradientEnd', e.target.value);
                            updateTheme('bgType', 'gradient');
                          }}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono">{config.theme.gradientEnd}</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom Background Image */}
                  <div className="pt-2">
                    <span className="text-xs text-stone-400 block mb-1">Xüsusi Arxa Fon Şəkli</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'bg')}
                      className="block w-full text-xs text-stone-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer mb-2"
                    />
                    {config.theme.bgImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          updateTheme('bgImageUrl', '');
                          updateTheme('bgType', 'gradient');
                        }}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Arxa fon şəklini ləğv et
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Styling */}
                <div className="space-y-4 pt-3 border-t border-white/10">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Link Kartlarının Parametrləri
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-stone-400 block mb-1">Kart Rəngi</span>
                      <div className="flex items-center gap-2 bg-[#202028] p-1.5 rounded-xl border border-black">
                        <input
                          type="color"
                          value={config.theme.cardBg}
                          onChange={(e) => updateTheme('cardBg', e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono">{config.theme.cardBg}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-stone-400 block mb-1">Çərçivə Rəngi</span>
                      <div className="flex items-center gap-2 bg-[#202028] p-1.5 rounded-xl border border-black">
                        <input
                          type="color"
                          value={config.theme.cardBorderColor}
                          onChange={(e) => updateTheme('cardBorderColor', e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono">{config.theme.cardBorderColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Border width slider */}
                  <div>
                    <div className="flex justify-between text-xs text-stone-300 mb-1">
                      <span>Çərçivə Qalınlığı (Border Width)</span>
                      <span className="font-mono">{config.theme.cardBorderWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="1"
                      value={config.theme.cardBorderWidth}
                      onChange={(e) => updateTheme('cardBorderWidth', Number(e.target.value))}
                      className="w-full accent-white cursor-pointer"
                    />
                  </div>

                  {/* Border radius slider */}
                  <div>
                    <div className="flex justify-between text-xs text-stone-300 mb-1">
                      <span>Künc Radius (Border Radius)</span>
                      <span className="font-mono">{config.theme.cardRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      step="2"
                      value={config.theme.cardRadius}
                      onChange={(e) => updateTheme('cardRadius', Number(e.target.value))}
                      className="w-full accent-white cursor-pointer"
                    />
                  </div>

                  {/* Text and Icon Color */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-stone-400 block mb-1">Mətn Rəngi</span>
                      <div className="flex items-center gap-2 bg-[#202028] p-1.5 rounded-xl border border-black">
                        <input
                          type="color"
                          value={config.theme.textColor}
                          onChange={(e) => updateTheme('textColor', e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono">{config.theme.textColor}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-stone-400 block mb-1">İkon Rəngi</span>
                      <div className="flex items-center gap-2 bg-[#202028] p-1.5 rounded-xl border border-black">
                        <input
                          type="color"
                          value={config.theme.iconColor}
                          onChange={(e) => updateTheme('iconColor', e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-xs font-mono">{config.theme.iconColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SECTIONS TAB */}
            {activeTab === 'sections' && (
              <div className="space-y-5">
                {/* Add new Section */}
                <form onSubmit={handleAddSection} className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Yeni Bölmə Yarat (Limitsiz)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="məs. Sosial Şəbəkələr və ya Bölmə 3"
                      className="flex-1 px-3 py-2 bg-[#202028] border-2 border-black rounded-xl text-white text-sm focus:outline-none focus:border-white/50 font-medium"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-stone-200 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Əlavə et</span>
                    </button>
                  </div>
                </form>

                {/* Existing Sections List */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-300 block">
                    Mövcud Bölmələr ({config.sections.length})
                  </span>

                  {config.sections.map((section, idx) => (
                    <div
                      key={section.id}
                      className="p-3 bg-[#202028] border-2 border-black rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-white">{section.title}</p>
                        <p className="text-xs text-stone-400">
                          {section.links.length} link mövcuddur
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenAddLink(section.id)}
                          className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold"
                          title="Bu bölməyə link əlavə et"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, 'up')}
                          className="p-1.5 text-stone-400 hover:text-white disabled:opacity-20"
                          title="Yuxarı daşı"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === config.sections.length - 1}
                          onClick={() => handleMoveSection(idx, 'down')}
                          className="p-1.5 text-stone-400 hover:text-white disabled:opacity-20"
                          title="Aşağı daşı"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                          title="Bölməni sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. DATA & SYSTEM TAB */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#202028] border-2 border-black rounded-2xl space-y-3">
                  <h4 className="text-sm font-bold text-white">Məlumatların Yedəklənməsi (JSON)</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Bütün konfiqurasiyanı (profil, rənglər, bölmələr, linklər) JSON formatında kompüterinizə endirə və ya sonradan bərpa edə bilərsiniz.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Eksport (JSON)</span>
                    </button>
                    <label className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>İmport (JSON)</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJson}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl space-y-2">
                  <h4 className="text-sm font-bold text-rose-400">İlkin Vəziyyətə Qaytar</h4>
                  <p className="text-xs text-rose-300/80 leading-relaxed">
                    Bütün dəyişiklikləri ləğv edərək referans şablonun ilkin dizayn və linklərinə qayıtmaq.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bütün parametrlər ilkin vəziyyətinə sıfırlansın?')) {
                        onResetDefault();
                        onClose();
                      }
                    }}
                    className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 mt-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Şablonu Sıfırla (Reset)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
