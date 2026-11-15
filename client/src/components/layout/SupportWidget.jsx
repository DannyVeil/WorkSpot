import { MessageSquare } from 'lucide-react';

/** Плавающая кнопка «Онлайн 24/7» → чат техподдержки. */
export default function SupportWidget({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 bg-white pl-4 pr-2 py-2 rounded-2xl shadow-lg border border-sky-100 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group"
      aria-label="Открыть чат техподдержки"
    >
      <span className="text-xs sm:text-sm font-bold text-[#0F2942]">Онлайн 24/7</span>
      <span className="relative w-10 h-10 rounded-xl bg-[#19B5FE] group-hover:bg-[#0099E5] text-white flex items-center justify-center transition-colors">
        <MessageSquare className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
      </span>
    </button>
  );
}
