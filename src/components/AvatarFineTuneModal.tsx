import React, { useRef, useEffect } from 'react';
import { ProfileData } from '../types';
import {
  X,
  Search,
  RotateCcw,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Plus,
} from 'lucide-react';

interface AvatarFineTuneModalProps {
  isOpen: boolean;
  profile: ProfileData;
  onClose: () => void;
  onUpdate: (field: keyof ProfileData, value: any) => void;
}

export const AvatarFineTuneModal: React.FC<AvatarFineTuneModalProps> = ({
  isOpen,
  profile,
  onClose,
  onUpdate,
}) => {
  // Stored original values on modal open to enable clean "Ləğv et"
  const initialValuesRef = useRef({
    zoom: profile.avatarZoom || 100,
    posX: profile.avatarPosX || 0,
    posY: profile.avatarPosY || 0,
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPosX: 0, startPosY: 0 });

  // For touch pinch-to-zoom
  const initialTouchDistRef = useRef<number | null>(null);
  const initialTouchZoomRef = useRef<number>(100);

  // Keep track of initial values on open
  useEffect(() => {
    if (isOpen) {
      initialValuesRef.current = {
        zoom: profile.avatarZoom || 100,
        posX: profile.avatarPosX || 0,
        posY: profile.avatarPosY || 0,
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentZoom = profile.avatarZoom || 100;
  const posX = profile.avatarPosX || 0;
  const posY = profile.avatarPosY || 0;

  // --- Drag & Drop Pan Logic ---
  const startDrag = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      startPosX: posX,
      startPosY: posY,
    };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    // Map mouse / touch movement to coordinate percentage
    const newX = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.startPosX + deltaX * 0.45)));
    const newY = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.startPosY + deltaY * 0.45)));
    onUpdate('avatarPosX', newX);
    onUpdate('avatarPosY', newY);
  };

  const stopDrag = () => {
    isDraggingRef.current = false;
    initialTouchDistRef.current = null;
  };

  // --- Wheel Zoom Handler ---
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    const newZoom = Math.max(30, Math.min(250, currentZoom + delta));
    onUpdate('avatarZoom', newZoom);
  };

  // --- Touch Pinch-to-Zoom & Pan Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialTouchDistRef.current = dist;
      initialTouchZoomRef.current = currentZoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && initialTouchDistRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / initialTouchDistRef.current;
      const newZoom = Math.max(30, Math.min(250, Math.round(initialTouchZoomRef.current * ratio)));
      onUpdate('avatarZoom', newZoom);
    }
  };

  // D-Pad Steppers (step by 5%)
  const handleStep = (dir: 'up' | 'down' | 'left' | 'right', amount = 5) => {
    if (dir === 'up') onUpdate('avatarPosY', Math.max(-100, posY - amount));
    if (dir === 'down') onUpdate('avatarPosY', Math.min(100, posY + amount));
    if (dir === 'left') onUpdate('avatarPosX', Math.max(-100, posX - amount));
    if (dir === 'right') onUpdate('avatarPosX', Math.min(100, posX + amount));
  };

  // Cancel handler: restores initial state
  const handleCancel = () => {
    onUpdate('avatarZoom', initialValuesRef.current.zoom);
    onUpdate('avatarPosX', initialValuesRef.current.posX);
    onUpdate('avatarPosY', initialValuesRef.current.posY);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-md bg-[#121215] border-0 sm:border sm:border-stone-800 sm:rounded-3xl p-5 shadow-2xl text-white space-y-4 overflow-y-auto flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">Foto Tənzimləyici</h3>
              <p className="text-[11px] text-stone-400">Şəkli basıb saxlayaraq sürükləyin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Circular Drag Canvas */}
        <div className="flex flex-col items-center justify-center py-2 shrink-0">
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              startDrag(e.clientX, e.clientY);
            }}
            onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={stopDrag}
            onWheel={handleWheel}
            className="w-52 h-52 sm:w-60 sm:h-60 rounded-full border-2 border-stone-600 ring-4 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,0.9)] bg-black overflow-hidden relative cursor-grab active:cursor-grabbing select-none flex items-center justify-center touch-none"
            title="Şəkli basıb saxlayaraq sürükləyin"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="max-w-full max-h-full w-full h-full pointer-events-none select-none transition-transform duration-75"
                style={{
                  objectFit: 'contain',
                  transform: `scale(${currentZoom / 100}) translate(${posX}%, ${posY}%)`,
                }}
              />
            ) : (
              <div className="text-xs text-stone-400 font-medium">Şəkil seçilməyib</div>
            )}

            {/* Helper Overlay Grid Crosshairs */}
            <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-full flex items-center justify-center">
              <div className="w-full h-[1px] bg-white/10" />
              <div className="h-full w-[1px] bg-white/10 absolute" />
            </div>

            {/* Position coordinate badge */}
            <div className="absolute bottom-2 px-2.5 py-0.5 rounded-full bg-black/80 border border-white/20 text-[10px] font-mono text-white pointer-events-none backdrop-blur-xs">
              X: {posX}% | Y: {posY}%
            </div>
          </div>
        </div>

        {/* 1. ÖLÇÜ KARTI */}
        <div className="bg-[#18181c] border border-white/10 rounded-2xl p-3.5 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5 uppercase tracking-wide">
              <Search className="w-3.5 h-3.5 text-white" />
              <span>ÖLÇÜ (ZOOM): {currentZoom}%</span>
            </span>
            <button
              type="button"
              onClick={() => onUpdate('avatarZoom', 100)}
              className="text-xs font-bold text-white hover:underline transition-colors"
            >
              100%-ə Qaytar
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onUpdate('avatarZoom', Math.max(30, currentZoom - 5))}
              className="w-8 h-8 rounded-xl bg-[#282830] hover:bg-[#33333d] text-white flex items-center justify-center transition-colors shrink-0"
              title="Kiçilt"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="30"
                max="250"
                value={currentZoom}
                onChange={(e) => onUpdate('avatarZoom', Number(e.target.value))}
                className="w-full accent-white cursor-pointer h-1.5 bg-stone-700 rounded-lg appearance-none"
              />
            </div>

            <button
              type="button"
              onClick={() => onUpdate('avatarZoom', Math.min(250, currentZoom + 5))}
              className="w-8 h-8 rounded-xl bg-[#282830] hover:bg-[#33333d] text-white flex items-center justify-center transition-colors shrink-0"
              title="Böyüt"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. MÖVQE VƏ İSTİQAMƏT KARTI */}
        <div className="bg-[#18181c] border border-white/10 rounded-2xl p-3.5 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5 uppercase tracking-wide">
              <Move className="w-3.5 h-3.5 text-white" />
              <span>MÖVQE (X: {posX}% | Y: {posY}%)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onUpdate('avatarPosX', 0);
                onUpdate('avatarPosY', 0);
              }}
              className="text-xs font-semibold text-stone-400 hover:text-white transition-colors"
            >
              Mərkəzə
            </button>
          </div>

          {/* D-Pad Layout */}
          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
            <button
              type="button"
              onClick={() => handleStep('up')}
              className="px-4 py-1.5 bg-[#282830] hover:bg-[#353540] text-stone-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/5 active:scale-95"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Yuxarı</span>
            </button>

            <div className="flex items-center justify-center gap-4 w-full">
              <button
                type="button"
                onClick={() => handleStep('left')}
                className="px-4 py-1.5 bg-[#282830] hover:bg-[#353540] text-stone-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/5 active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sola</span>
              </button>

              <button
                type="button"
                onClick={() => handleStep('right')}
                className="px-4 py-1.5 bg-[#282830] hover:bg-[#353540] text-stone-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/5 active:scale-95"
              >
                <span>Sağa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleStep('down')}
              className="px-4 py-1.5 bg-[#282830] hover:bg-[#353540] text-stone-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/5 active:scale-95"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Aşağı</span>
            </button>
          </div>
        </div>

        {/* 3. Orijinal Vəziyyətə Qaytar (100% Kəsilmədən) button */}
        <button
          type="button"
          onClick={() => {
            onUpdate('avatarPosX', 0);
            onUpdate('avatarPosY', 0);
            onUpdate('avatarZoom', 100);
          }}
          className="w-full py-2.5 px-4 bg-[#202026] hover:bg-[#282830] border border-stone-700 rounded-2xl text-xs font-semibold text-stone-200 hover:text-white flex items-center justify-center gap-2 transition-colors active:scale-[0.99] shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
          <span>Orijinal Vəziyyətə Qaytar (100% Kəsilmədən)</span>
        </button>

        {/* 4. Bottom Action Buttons: Ləğv et + ✓ Tətbiq Et */}
        <div className="flex items-center justify-between pt-2 shrink-0 border-t border-white/10">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-xs font-bold text-stone-300 hover:text-white transition-colors"
          >
            Ləğv et
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white hover:bg-stone-200 text-black font-extrabold rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Tətbiq Et</span>
          </button>
        </div>

      </div>
    </div>
  );
};
