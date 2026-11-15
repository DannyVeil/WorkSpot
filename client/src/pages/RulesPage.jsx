import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ShieldCheck } from 'lucide-react';
import { FAQ_DATA, RULES_DATA } from '../data/catalog.js';

/** Страница правил и FAQ. */
export default function RulesPage({ onNavigate }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-sky-200/80 text-[#0099E5] text-xs font-bold mb-4 shadow-2xs">
          <ShieldCheck className="w-4 h-4" />
          Комфорт и безопасность резидентов
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F233C] tracking-tight mb-3">
          Правила коворкинга WorkSpot
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Простые и понятные договорённости, которые помогают каждому резиденту работать в тишине,
          чистоте и безопасности 24/7.
        </p>
      </div>

      <div className="space-y-5">
        {RULES_DATA.map((rule) => {
          const IconComponent = rule.icon;
          return (
            <div
              key={rule.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-sky-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#F0F7FF] border border-sky-100 text-[#0099E5] flex items-center justify-center shrink-0">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F233C]">
                    {rule.id}. {rule.title}
                  </h2>
                </div>
                <span className="self-start sm:self-auto text-xs font-bold text-[#0099E5] bg-[#F0F7FF] px-3 py-1 rounded-full">
                  {rule.badge}
                </span>
              </div>

              <ul className="space-y-2.5 pl-0 sm:pl-14">
                {rule.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0099E5] mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] text-[#0099E5] flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0F233C]">Частые вопросы</h2>
            <p className="text-xs text-slate-500">
              Ответы на популярные вопросы о работе системы WorkSpot
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {FAQ_DATA.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left font-bold text-[#0F233C] hover:text-[#0099E5] transition-colors py-1 cursor-pointer"
                >
                  <span className="text-sm sm:text-base">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#0099E5] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed bg-[#F0F7FF] p-4 rounded-2xl border border-sky-100">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600 font-medium">
            Ознакомились с правилами? Выберите удобное место на карте.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('booking')}
            className="w-full sm:w-auto bg-[#0099E5] hover:bg-[#00A8E8] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Перейти к бронированию
          </button>
        </div>
      </div>
    </div>
  );
}
