import WorkSpotLogo from '../brand/WorkSpotLogo.jsx';
import { NAV_ITEMS } from '../../constants/navigation.js';

/** Подвал сайта. */
export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-white border-t border-sky-100 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <WorkSpotLogo onClick={() => onNavigate('home')} />
          <span className="text-xs text-slate-400 hidden md:inline">
            • Система онлайн-бронирования коворкинга 24/7
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-slate-500">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="hover:text-[#19B5FE] transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400">© 2026 WorkSpot. Все права защищены.</div>
      </div>
    </footer>
  );
}
