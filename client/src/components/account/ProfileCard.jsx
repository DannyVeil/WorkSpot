import { useState } from 'react';
import { LogOut, QrCode } from 'lucide-react';

/** Карточка профиля: аватар, роль, QR-пропуск, мини-статистика. */
export default function ProfileCard({ user, activeBookingsCount, totalHours, onLogout }) {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#19B5FE] to-[#0099E5] text-white font-extrabold text-xl flex items-center justify-center shadow-sm shrink-0">
            {user.name?.charAt(0).toUpperCase() || 'W'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#0F2942]">{user.name}</h1>
              <span className="text-xs font-bold text-[#19B5FE] bg-[#F2F7FC] border border-sky-200/70 px-2.5 py-0.5 rounded-full">
                {user.role || 'Резидент WorkSpot'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
            {user.phone && <p className="text-xs text-slate-400 mt-0.5">{user.phone}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQrModal((value) => !value)}
            aria-expanded={showQrModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F2F7FC] hover:bg-[#E8F3FF] text-[#19B5FE] font-bold text-xs border border-sky-200/80 transition-colors cursor-pointer whitespace-nowrap"
          >
            <QrCode className="w-4 h-4" />
            Мой QR-код
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200/80 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            Выйти из аккаунта
          </button>
        </div>
      </div>

      {showQrModal && (
        <div className="my-5 p-4 rounded-2xl bg-[#F2F7FC] border border-sky-200/80 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-24 h-24 bg-white p-2 rounded-xl border border-sky-100 flex items-center justify-center shrink-0">
            <QrCode className="w-16 h-16 text-[#0F2942]" />
          </div>
          <div className="text-center sm:text-left">
            <div className="text-sm font-extrabold text-[#0F2942]">Персональный пропуск 24/7</div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Поднесите этот QR-код к считывателю на входе в коворкинг или у двери переговорной.
              Код обновляется автоматически.
            </p>
            <span className="inline-block mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Статус: Активен
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 pt-5">
        <div className="bg-[#F2F7FC] rounded-2xl p-3.5 border border-sky-100">
          <span className="text-xs text-slate-500 block">Активных броней</span>
          <span className="text-xl font-extrabold text-[#0F2942] mt-0.5 block">
            {activeBookingsCount}
          </span>
        </div>
        <div className="bg-[#F2F7FC] rounded-2xl p-3.5 border border-sky-100">
          <span className="text-xs text-slate-500 block">Часов в коворкинге</span>
          <span className="text-xl font-extrabold text-[#19B5FE] mt-0.5 block">{totalHours} ч.</span>
        </div>
        <div className="bg-[#F2F7FC] rounded-2xl p-3.5 border border-sky-100">
          <span className="text-xs text-slate-500 block">Доступ в зал</span>
          <span className="text-xl font-extrabold text-[#22C55E] mt-0.5 block">24/7</span>
        </div>
      </div>
    </div>
  );
}
