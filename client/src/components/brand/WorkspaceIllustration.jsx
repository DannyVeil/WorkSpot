/** Векторная иллюстрация рабочего места для карточки «Детали бронирования». */
export default function WorkspaceIllustration({ type }) {
  return (
    <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-[#F0F7FF] via-[#E8F3FF] to-emerald-50/70 border border-sky-100 flex items-center justify-center">
      <svg viewBox="0 0 400 200" className="w-full h-full object-cover" fill="none" aria-hidden="true">
        {/* Окно */}
        <rect x="24" y="18" width="145" height="105" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        <line x1="96" y1="18" x2="96" y2="123" stroke="#E2E8F0" strokeWidth="2" />
        <line x1="24" y1="70" x2="169" y2="70" stroke="#E2E8F0" strokeWidth="2" />
        <circle cx="136" cy="44" r="12" fill="#BAE6FD" opacity="0.6" />

        {/* Декоративная полка и растение */}
        <rect x="245" y="34" width="115" height="6" rx="3" fill="#CBD5E1" />
        <rect x="262" y="16" width="18" height="18" rx="4" fill="#7AE5A3" opacity="0.8" />
        <rect x="286" y="12" width="14" height="22" rx="3" fill="#38BDF8" opacity="0.7" />
        <path d="M335 34C335 22 345 16 345 16C345 16 352 24 348 34H335Z" fill="#34D399" />

        {/* Столешница */}
        <rect x="52" y="138" width="296" height="11" rx="5.5" fill="#D99B66" />
        <rect x="74" y="149" width="10" height="42" rx="3" fill="#64748B" />
        <rect x="316" y="149" width="10" height="42" rx="3" fill="#64748B" />

        {type === 'Переговорная' || type === 'Кабинет' ? (
          <>
            {/* Экран для переговоров */}
            <rect x="145" y="72" width="110" height="58" rx="8" fill="#0F233C" stroke="#475569" strokeWidth="3" />
            <rect x="153" y="80" width="94" height="42" rx="4" fill="#0099E5" opacity="0.25" />
            <path d="M168 108L186 94L202 103L226 86" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="193" y="130" width="14" height="8" fill="#475569" />
          </>
        ) : (
          <>
            {/* Ноутбук и настольная лампа */}
            <path d="M158 134L168 96H228L218 134H158Z" fill="#0F233C" />
            <path d="M164 130L172 100H222L214 130H164Z" fill="#E0F2FE" />
            <rect x="146" y="134" width="84" height="4" rx="2" fill="#94A3B8" />
            {/* Кружка кофе */}
            <rect x="256" y="121" width="16" height="17" rx="4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
            <path d="M272 125H276C278 125 279 127 279 129.5C279 132 278 134 276 134H272" stroke="#94A3B8" strokeWidth="2" />
            {/* Лампа */}
            <path d="M108 138L116 95L136 86" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <path d="M128 82L148 92L134 98L128 82Z" fill="#0099E5" />
          </>
        )}

        {/* Эргономичное кресло */}
        <rect x="172" y="114" width="56" height="44" rx="14" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
        <rect x="166" y="154" width="68" height="12" rx="6" fill="#94A3B8" />
        <rect x="196" y="166" width="8" height="22" fill="#64748B" />
        <path d="M176 190H224" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      </svg>

      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-[#0F233C] border border-sky-100 shadow-2xs">
        {type}
      </div>
      <div className="absolute top-3 right-3 bg-emerald-50/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Доступ 24/7
      </div>
    </div>
  );
}
