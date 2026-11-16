import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, X, ShieldCheck } from 'lucide-react';

export interface FarmerAccount {
  name: string;
  isConfigured: boolean;
}

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: FarmerAccount;
  onSaveAccount: (updated: FarmerAccount) => void;
  lang: 'es' | 'en';
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onSaveAccount,
  lang
}) => {
  const [name, setName] = useState<string>(account.name);

  useEffect(() => {
    if (isOpen) {
      setName(account.name);
    }
  }, [isOpen, account]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveAccount({
      name: name.trim(),
      isConfigured: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
        className="w-full max-w-lg bg-[#0D1B13] border border-[#2B543D] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 my-auto"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#1E382A] pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#4ADE80] font-semibold">
              <User className="w-4 h-4 text-[#4ADE80]" />
              <span>{lang === 'es' ? 'CUENTA PERSONAL Y PRIVACIDAD' : 'PERSONAL ACCOUNT & PRIVACY'}</span>
            </div>
            <h3 id="account-modal-title" className="font-display text-xl sm:text-2xl font-bold text-[#F4F3EE]">
              {lang === 'es' ? 'Tu Cuenta en ROTA-AGRO' : 'Your ROTA-AGRO Account'}
            </h3>
            <p className="text-xs text-[#A7B8AD]">
              {lang === 'es'
                ? 'Tus datos son totalmente privados y se guardan solo en tu dispositivo.'
                : 'Your data is private and stored only on your device.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
            className="p-1.5 rounded-lg bg-[#12231A] border border-[#243E2F] text-[#8FA898] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#F4F3EE] font-semibold mb-1.5 text-sm">
              {lang === 'es' ? '¿Cómo quieres que te llamen?' : 'How would you like to be called?'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === 'es' ? 'Ej. Juan, Carmen, Luis, Luisa...' : 'e.g. John, Maria...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#08120D] border border-[#213F2F] text-[#F4F3EE] focus:border-[#4ADE80] outline-none text-sm font-semibold"
            />
            <p className="text-[11px] text-[#8FA898] mt-1.5">
              {lang === 'es'
                ? 'La voz de la app te saludará con este nombre en cada alerta y recomendación.'
                : 'The app voice will greet you by this name in alerts and recommendations.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#12261C] border border-[#264E38] flex items-start gap-2.5 text-[#D1FAE5]">
            <ShieldCheck className="w-4 h-4 text-[#4ADE80] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                {lang === 'es' ? 'Privacidad garantizada' : 'Privacy Protected'}
              </div>
              <div className="text-[11px] text-[#A7B8AD] mt-0.5">
                {lang === 'es'
                  ? 'Tus datos están seguros en este equipo. Nadie más tiene acceso a tu parcela ni a tu cuenta personal.'
                  : 'Your data remains strictly on your device.'}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#12231A] text-[#8FA898] hover:text-white border border-[#213F2F] font-mono-tabular cursor-pointer"
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#4ADE80] hover:bg-[#3bca70] text-[#07130B] font-bold font-mono-tabular transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'es' ? 'Guardar Cuenta' : 'Save Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
