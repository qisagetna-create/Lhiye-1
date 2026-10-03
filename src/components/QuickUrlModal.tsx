import React, { useState, useEffect } from 'react';
import { LinkItem } from '../types';
import { X, Check, Link } from 'lucide-react';

interface QuickUrlModalProps {
  isOpen: boolean;
  link: LinkItem | null;
  onClose: () => void;
  onSaveUrl: (linkId: string, newUrl: string) => void;
}

export const QuickUrlModal: React.FC<QuickUrlModalProps> = ({
  isOpen,
  link,
  onClose,
  onSaveUrl,
}) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (link) {
      setUrl(link.url || '');
    }
  }, [link, isOpen]);

  if (!isOpen || !link) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUrl(link.id, url.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#18181f] border-2 border-black rounded-3xl shadow-2xl p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Linki Dəyiş</h3>
            <p className="text-xs text-stone-400 mt-0.5">{link.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
              Yeni Keçid Ünvanı (URL)
            </label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
                placeholder="https://example.com"
                className="w-full pl-10 pr-4 py-3 bg-[#24242d] border-2 border-black rounded-2xl text-white placeholder-stone-500 focus:outline-none focus:border-white/70 text-sm font-medium font-mono"
              />
              <Link className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 font-semibold text-sm"
            >
              Ləğv et
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white text-black hover:bg-stone-200 font-bold text-sm shadow flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Yenilə</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
