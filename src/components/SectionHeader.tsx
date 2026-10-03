import React, { useState } from 'react';
import { SectionItem, ThemeConfig } from '../types';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, Check } from 'lucide-react';

interface SectionHeaderProps {
  section: SectionItem;
  theme: ThemeConfig;
  isAdmin: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpdateTitle: (newTitle: string) => void;
  onAddLink: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDeleteSection: () => void;
}

/**
 * SectionHeader:
 * 1. Mətn: "Elaqe ve Melumat" (və ya dinamik bölmə adı).
 * 2. Mövqe: Mərkəzdə (text-center), kartların üstündən dəqiq 14px yuxarıda (pb-[14px]).
 * 3. Şrift: 15px, Bold (font-bold text-[15px]), təmiz ağ rəng (text-white).
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  section,
  theme,
  isAdmin,
  canMoveUp,
  canMoveDown,
  onUpdateTitle,
  onAddLink,
  onMoveUp,
  onMoveDown,
  onDeleteSection,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(section.title);

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onUpdateTitle(editedTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center pt-6 sm:pt-8 pb-[14px]">
      {isEditing ? (
        <div className="flex items-center gap-2 max-w-sm w-full px-4">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            autoFocus
            className="flex-1 bg-black/70 border border-white/30 rounded-xl px-3 py-1.5 text-white text-center font-bold text-[15px] focus:outline-none focus:border-white"
          />
          <button
            type="button"
            onClick={handleSaveTitle}
            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
            title="Saxla"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative group flex items-center justify-center">
          <h2
            className="font-bold text-[15px] text-center text-white tracking-normal select-text transition-colors"
            style={{
              color: theme.sectionTitleColor || '#ffffff',
              textShadow: '0 1px 4px rgba(0,0,0,0.7)',
            }}
          >
            {section.title || 'Elaqe ve Melumat'}
          </h2>

          {isAdmin && (
            <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 rounded-lg p-1 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1 text-stone-300 hover:text-white"
                title="Bölmə adını dəyiş"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              {canMoveUp && (
                <button
                  type="button"
                  onClick={onMoveUp}
                  className="p-1 text-stone-300 hover:text-white"
                  title="Yuxarı daşı"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
              {canMoveDown && (
                <button
                  type="button"
                  onClick={onMoveDown}
                  className="p-1 text-stone-300 hover:text-white"
                  title="Aşağı daşı"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onDeleteSection}
                className="p-1 text-rose-400 hover:text-rose-300"
                title="Bölməni sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Admin Action: Add link specifically to this section */}
      {isAdmin && (
        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            onClick={onAddLink}
            className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/90 text-[11px] font-semibold rounded-full border border-white/15 transition-all shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>Link əlavə et</span>
          </button>
        </div>
      )}
    </div>
  );
};
