import { useEffect, useRef } from 'react';
import { Bell, LogIn, Menu, User, X } from 'lucide-react';
import WorkSpotLogo from '../brand/WorkSpotLogo.jsx';
import NotificationsDropdown from './NotificationsDropdown.jsx';
import { NAV_ITEMS } from '../../constants/navigation.js';
import { getUserInitials } from '../../utils/format.js';

/** Верхняя навигация: логотип, 3 ссылки, уведомления, вход/профиль, мобильное меню. */
export default function Header({
  activePage,
  user,
  notifications,
  unreadCount,
  notificationsOpen,
  mobileMenuOpen,
  onNavigate,
  onOpenAuth,
  onToggleNotifications,
  onCloseNotifications,
  onMarkAllRead,
  onToggleMobileMenu,
}) {
  const userInitials = getUserInitials(user?.name);
  const notificationsRef = useRef(null);

  // Закрываем уведомления по клику вне меню и по Escape.
  useEffect(() => {
    if (!notificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!notificationsRef.current?.contains(event.target)) onCloseNotifications();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseNotifications();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen, onCloseNotifications]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[70px]">
          <WorkSpotLogo onClick={() => onNavigate('home')} />

          <nav className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#19B5FE] bg-[#F2F7FC] font-bold'
                      : 'text-[#0F2942]/80 hover:text-[#0F2942] hover:bg-[#F2F7FC]/70'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {user ? (
              <>
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={onToggleNotifications}
                    aria-label="Уведомления"
                    aria-expanded={notificationsOpen}
                    className="p-2.5 rounded-xl bg-white hover:bg-[#F2F7FC] border border-sky-100 text-[#0F2942] transition-colors relative cursor-pointer"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <NotificationsDropdown
                      notifications={notifications}
                      unreadCount={unreadCount}
                      onMarkAllRead={onMarkAllRead}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  aria-label={`Личный кабинет: ${user.name}`}
                  className={`inline-flex items-center gap-2.5 py-2 px-3.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                    activePage === 'profile'
                      ? 'bg-[#19B5FE] border-[#19B5FE] text-white shadow-xs'
                      : 'bg-white hover:bg-[#F2F7FC] border-sky-200/80 text-[#0F2942]'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full font-extrabold text-xs flex items-center justify-center ${
                      activePage === 'profile'
                        ? 'bg-white text-[#19B5FE]'
                        : 'bg-[#E8F3FF] text-[#19B5FE]'
                    }`}
                  >
                    {userInitials}
                  </span>
                  <span className="hidden sm:inline max-w-[140px] lg:max-w-[190px] truncate">
                    {user.name}
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#19B5FE] hover:bg-[#0099E5] text-white font-bold text-sm shadow-xs shadow-sky-200/80 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Войти</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleMobileMenu}
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              className="md:hidden p-2.5 rounded-xl bg-white border border-sky-100 text-[#0F2942] hover:bg-[#F2F7FC]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-sky-100 shadow-lg px-4 pt-3 pb-5 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-[#F2F7FC] text-[#19B5FE]'
                    : 'text-[#0F2942] hover:bg-[#F2F7FC]/70'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="pt-3 mt-2 border-t border-slate-100">
            {user ? (
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="w-full py-3 px-4 rounded-xl bg-[#19B5FE] text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                {user.name}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full py-3 px-4 rounded-xl bg-[#19B5FE] text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Войти
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
