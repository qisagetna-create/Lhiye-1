import React, { useState, useEffect } from 'react';
import { LinkItem, IconType } from '../types';
import { AVAILABLE_ICONS, BrandIcon } from './icons';
import { X } from 'lucide-react';

interface EditLinkModalProps {
  isOpen: boolean;
  link: LinkItem | null;
  sectionTitle?: string;
  onClose: () => void;
  onSave: (updatedLink: LinkItem) => void;
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({
  isOpen,
  link,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState<IconType>('instagram');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (link) {
      setTitle(link.title || '');
      setSubtitle(link.subtitle || '');
      setUrl(link.url || '');
      setIcon(link.icon || 'instagram');
      setVisible(link.visible !== false);
    } else {
      setTitle('');
      setSubtitle('');
      setUrl('https://');
      setIcon('instagram');
      setVisible(true);
    }
  }, [link, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updated: LinkItem = {
      id: link ? link.id : `link-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      url: url.trim(),
      icon,
      visible,
      order: link ? link.order : 999,
      clicks: link?.clicks || 0,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#18181c] border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden text-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-lg font-bold tracking-tight text-white">
            {link ? 'Linki Redaktə Et' : 'Yeni Link Əlavə Et'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Başlıq */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1.5">
              Əsas Başlıq
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Məs: WhatsApp Əlaqə"
              required
              className="w-full px-4 py-2.5 bg-[#121215] border border-stone-800 focus:border-stone-500 rounded-2xl text-white placeholder-stone-600 focus:outline-none text-sm font-medium transition-colors"
            />
          </div>

          {/* Alt Mətn (Açıqlama) */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center justify-between">
              <span>Alt Mətn (Açıqlama / Könüllü)</span>
              <span className="text-[10px] text-stone-500">Məs: "Mehsullar"</span>
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Məs: Mehsullar və ya Sifariş üçün"
              className="w-full px-4 py-2.5 bg-[#121215] border border-stone-800 focus:border-stone-500 rounded-2xl text-white placeholder-stone-600 focus:outline-none text-sm font-medium transition-colors"
            />
          </div>

          {/* URL Keçid */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1.5">
              URL Keçid
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com"
              className="w-full px-4 py-2.5 bg-[#121215] border border-stone-800 focus:border-stone-500 rounded-2xl text-white placeholder-stone-600 focus:outline-none text-sm font-medium transition-colors"
            />
          </div>

          {/* İkon */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1.5">
              İkon
            </label>
            <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-2 bg-[#121215] rounded-2xl border border-stone-800">
              {AVAILABLE_ICONS.map((item) => {
                const isSelected = icon === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setIcon(item.type)}
                    className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-white text-black shadow-md'
                        : 'text-stone-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <BrandIcon
                      name={item.type}
                      className={`w-5 h-5 mb-1 ${isSelected ? 'text-black' : 'text-stone-300'}`}
                    />
                    <span
                      className={`text-[10px] font-medium truncate max-w-full text-center ${
                        isSelected ? 'font-bold text-black' : 'text-stone-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white transition-colors"
            >
              Ləğv et
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-stone-200 font-bold text-xs transition-all shadow-md active:scale-95"
            >
              Yadda saxla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
