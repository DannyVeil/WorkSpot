import { Bell } from 'lucide-react';
import { formatRelativeTime } from '../../utils/format.js';

/** Выпадающий список уведомлений в шапке. */
export default function NotificationsDropdown({
  notifications,
  unreadCount,
  onMarkAllRead,
}) {
  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-sky-100 z-50 overflow-hidden">
      <div className="px-4 py-3 bg-[#F2F7FC] border-b border-sky-100 flex items-center justify-between">
        <span className="font-bold text-sm text-[#0F2942]">Уведомления ({unreadCount})</span>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-bold text-[#19B5FE] hover:underline cursor-pointer"
          >
            Отметить все прочитанными
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Новых уведомлений нет
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 text-xs transition-colors ${
                notif.unread ? 'bg-[#F2F7FC]/70' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-[#0F2942] flex items-center gap-1.5">
                  {notif.type === 'success' && <Bell className="w-3 h-3 text-[#22C55E]" />}
                  {notif.title}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {notif.time || formatRelativeTime(notif.createdAt)}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">{notif.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
