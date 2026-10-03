import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPassword?: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPassword = 'fres123',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === currentPassword) {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#141418] border border-stone-800 rounded-3xl p-6 shadow-2xl text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-3 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Admin Girişi</h2>
          <p className="text-xs text-stone-400 mt-1">
            İdarəetmə panelinə daxil olmaq üçün şifrəni daxil edin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
              Admin Şifrəsi
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                autoFocus
                placeholder="Şifrəni daxil edin..."
                className="w-full bg-[#101012] border border-stone-700 focus:border-white rounded-xl px-3.5 py-3 pr-11 text-sm text-white focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-rose-400 mt-1.5 font-medium">
                Daxil edilən şifrə yanlışdır. Yenidən cəhd edin.
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Daxil Ol</span>
            </button>
          </div>
        </form>

        <div className="mt-5 p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-center">
          <p className="text-xs text-stone-400">
            🔑 Cari Giriş Şifrəsi: <span className="font-mono font-bold text-amber-300 text-sm">{currentPassword}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setPassword(currentPassword);
              setError(false);
            }}
            className="mt-2 text-[11px] text-rose-300 hover:text-rose-200 underline underline-offset-2 transition-colors"
          >
            Şifrəni avtomatik xanaya yaz
          </button>
        </div>
      </div>
    </div>
  );
};
