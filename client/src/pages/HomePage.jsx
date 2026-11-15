import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Wifi,
  Zap,
} from 'lucide-react';
import WorkspaceIllustration from '../components/brand/WorkspaceIllustration.jsx';
import { TARIFFS } from '../data/catalog.js';
import { formatPrice } from '../utils/format.js';

/** Главная страница: hero, преимущества, тарифы. */
export default function HomePage({ spaces, onNavigate, onBookingTrigger, onSelectTariff }) {
  const advantages = [
    {
      icon: Clock,
      title: 'Доступ 24/7 без сбоев',
      description:
        'Работайте по удобному графику днём или ночью. Автоматизированный вход работает круглосуточно.',
    },
    {
      icon: Zap,
      title: 'Мгновенная бронь и отмена',
      description:
        'Выбор стола на интерактивной карте и оформление за пару кликов. Бесплатная отмена в личном кабинете.',
    },
    {
      icon: Wifi,
      title: 'Высокоскоростной Wi-Fi и кофе',
      description:
        'Стабильный интернет 1 Гбит/с, резервный канал связи, зерновой кофе, чай и оборудованная кухня.',
    },
    {
      icon: ShieldCheck,
      title: 'Безопасность данных и доступ по QR',
      description:
        'Защищённая сеть, локеры для личных вещей и персональный QR-код для входа в забронированные зоны.',
    },
  ];

  const availableCount = spaces.filter((space) => space.status === 'available').length;
  const previewSpot =
    spaces.find((space) => space.id === 'desk-14') ||
    spaces.find((space) => space.status === 'available') ||
    spaces[0];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero-секция */}
      <section className="pt-8 md:pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative overflow-hidden">
            {/* Мягкие фоновые акценты */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#E8F3FF] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-50/80 rounded-full blur-3xl pointer-events-none" />

            <div className="lg:col-span-7 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F2F7FC] border border-sky-200/80 text-[#19B5FE] text-xs font-bold mb-6">
                <span className="w-2 h-2 rounded-full bg-[#19B5FE] animate-pulse" />
                Современный коворкинг • Доступ 24/7
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F2942] tracking-tight leading-[1.15] mb-5">
                Забронируйте рабочее место за пару кликов
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl">
                Современный коворкинг для продуктивной работы. Доступ 24/7. Быстро, просто и
                безопасно — выбирайте стол в Open Space, тихую капсулу или переговорную на
                интерактивной карте.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  type="button"
                  onClick={() => onBookingTrigger()}
                  className="inline-flex items-center justify-center gap-2.5 bg-[#19B5FE] hover:bg-[#0099E5] text-white font-bold px-7 py-4 rounded-2xl shadow-md shadow-sky-200/80 transition-all cursor-pointer"
                >
                  Забронировать место
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('rules')}
                  className="inline-flex items-center justify-center gap-2 bg-[#F2F7FC] hover:bg-[#E8F3FF] text-[#0F2942] font-semibold px-7 py-4 rounded-2xl border border-sky-200/80 transition-all cursor-pointer"
                >
                  Узнать правила
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <div className="text-2xl font-extrabold text-[#0F2942]">24/7</div>
                  <div className="text-xs text-slate-500">График работы</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#19B5FE]">1 Гбит/с</div>
                  <div className="text-xs text-slate-500">Скорость Wi-Fi</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#22C55E]">от 1 800 ₸</div>
                  <div className="text-xs text-slate-500">Аренда в час</div>
                </div>
              </div>
            </div>

            {/* Правая визуальная карточка-превью */}
            <div className="lg:col-span-5 relative z-10">
              <div className="bg-[#F2F7FC] rounded-2xl p-5 border border-sky-100 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Живой статус зала
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    Свободно {availableCount} мест
                  </span>
                </div>

                <WorkspaceIllustration type="Комфорт Open Space" />

                {previewSpot && (
                  <div className="bg-white rounded-xl p-4 border border-sky-100 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-[#0F2942] text-sm">{previewSpot.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {previewSpot.amenities?.slice(0, 3).join(', ')}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-[#19B5FE] text-base">
                        {formatPrice(previewSpot.price)} ₸/час
                      </div>
                      <button
                        type="button"
                        onClick={() => onBookingTrigger()}
                        className="text-xs font-semibold text-[#19B5FE] hover:underline mt-0.5 cursor-pointer"
                      >
                        Забронировать →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ключевые преимущества */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2942] tracking-tight">
            Почему выбирают WorkSpot
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Мы объединили продуманную эргономику пространства и удобный цифровой сервис
            бронирования
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 border border-sky-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F2F7FC] border border-sky-100 text-[#19B5FE] flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#0F2942] text-base mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Наши пространства и тарифы */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F2942] tracking-tight">
              Наши пространства и тарифы
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Гибкая почасовая оплата без скрытых платежей — платите только за время работы
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('booking')}
            className="text-sm font-bold text-[#19B5FE] hover:text-[#0099E5] inline-flex items-center gap-1.5 cursor-pointer"
          >
            Открыть всю карту мест <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TARIFFS.map((tariff) => (
            <div
              key={tariff.id}
              className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <span className="inline-block text-xs font-bold text-[#19B5FE] bg-[#F2F7FC] border border-sky-100 px-3 py-1 rounded-full mb-4">
                  {tariff.badge}
                </span>
                <h3 className="text-lg font-bold text-[#0F2942] mb-2">{tariff.title}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold text-[#0F2942]">{tariff.price}</span>
                  <span className="text-sm font-medium text-slate-500">{tariff.unit}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">{tariff.description}</p>

                <ul className="space-y-2.5 mb-6 border-t border-slate-100 pt-4">
                  {tariff.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs font-medium text-[#0F2942]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectTariff(tariff.filterType)}
                className="w-full py-3 px-4 rounded-xl bg-[#F2F7FC] hover:bg-[#19B5FE] text-[#19B5FE] hover:text-white font-bold text-sm border border-sky-200 hover:border-[#19B5FE] transition-all cursor-pointer"
              >
                Забронировать
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
