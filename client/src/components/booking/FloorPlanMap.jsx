import { ArrowRight, VolumeX } from 'lucide-react';
import { formatPrice } from '../../utils/format.js';

/** Интерактивная карта коворкинга из дизайн-макета. */
export default function FloorPlanMap({
  spaces,
  selectedSpotId,
  activeTypeFilter,
  onSelectSpot,
  onOccupiedClick,
}) {
  const getSpot = (id) => spaces.find((space) => space.id === id);

  const renderInteractiveSeat = (id, customClasses = '', customLabel = null) => {
    const spot = getSpot(id);
    if (!spot) return null;

    const isAvailable = spot.status === 'available';
    const isSelected = selectedSpotId === id;
    const isDimmed = activeTypeFilter !== 'Все типы' && spot.type !== activeTypeFilter;

    let styleClasses =
      'relative flex items-center justify-center rounded-md border font-semibold transition-all duration-200 select-none ';

    if (isSelected) {
      styleClasses +=
        'bg-[#22C55E] border-[#0F2942] text-white ring-4 ring-[#19B5FE]/50 shadow-md z-20 scale-[1.03] cursor-pointer ';
    } else if (isAvailable) {
      styleClasses +=
        'bg-[#22C55E] hover:bg-[#16A34A] border-emerald-700/60 text-white shadow-2xs hover:shadow-md cursor-pointer ';
    } else {
      styleClasses +=
        'bg-slate-300/90 border-slate-400/70 text-slate-600 cursor-not-allowed ';
    }

    if (isDimmed && !isSelected) styleClasses += 'opacity-35 ';

    const titleStatus = !isAvailable
      ? 'Занято'
      : spot.heldByMe
        ? 'Удерживается вами'
        : `${formatPrice(spot.price)} ₸/час`;

    return (
      <button
        key={spot.id}
        type="button"
        onClick={() => {
          if (isAvailable) onSelectSpot(spot.id);
          else onOccupiedClick(spot);
        }}
        title={`${spot.name} — ${titleStatus}`}
        className={`${styleClasses} ${customClasses}`}
      >
        <span className="truncate px-1">{customLabel || spot.shortLabel}</span>
        {spot.heldByMe && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#19B5FE] border border-white" />
        )}
      </button>
    );
  };

  const ChairRow = ({ count = 3, position = 'top' }) => (
    <div className="flex justify-around px-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`w-6 h-2.5 bg-slate-300/90 border border-slate-400/60 ${
            position === 'top' ? 'rounded-t-md -mb-0.5' : 'rounded-b-md -mt-0.5'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-sky-100 flex flex-col">
      {/* Заголовок карты и легенда */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-lg text-[#0F2942]">Интерактивная карта пространства</h2>
          <p className="text-xs text-slate-500">Нажмите на свободный зелёный стол или комнату для выбора</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-[#0F2942] bg-[#F2F7FC] px-3 py-2 rounded-xl border border-sky-100">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#22C55E] border border-emerald-700/60 inline-block" />
            Свободно
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#22C55E] ring-2 ring-[#19B5FE] inline-block" />
            Выбрано
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-300 border border-slate-400 inline-block" />
            Занято
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-200 border border-slate-300 inline-block" />
            Служебные зоны
          </span>
        </div>
      </div>

      {/* Подсказка прокрутки на мобильных экранах */}
      <div className="md:hidden text-[11px] text-[#19B5FE] bg-[#F2F7FC] border border-sky-100 rounded-lg px-3 py-1.5 mb-3 flex items-center justify-between">
        <span>Проведите пальцем по схеме влево или вправо</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>

      {/* Контейнер архитектурного плана */}
      <div className="w-full overflow-x-auto rounded-2xl border-2 border-slate-300/90 bg-[#E8F3FF] p-3 sm:p-5 custom-scrollbar">
        <div className="min-w-[740px] h-[490px] relative bg-[#F5FAFF] border-[3px] border-[#0F2942]/80 rounded-xl shadow-inner select-none">
          {/* Левая сервисная полоса (лаунж-кресла и вход) */}
          <div className="absolute left-0 top-0 bottom-0 w-14 border-r border-slate-300/80 bg-slate-100/70 flex flex-col items-center justify-between py-4">
            <div className="w-7 h-7 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold text-slate-600">
              С
            </div>

            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="w-7 h-7 rounded-md bg-slate-200 border border-slate-300 flex items-center justify-center"
                  title="Зона ожидания"
                >
                  <div className="w-4 h-4 border-l-2 border-t-2 border-b-2 border-slate-400 rounded-l-xs" />
                </div>
              ))}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 -rotate-90 mb-3">
              Вход
            </div>
          </div>

          {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ: OPEN SPACE И ЗОНА ТИШИНЫ */}
          <div className="absolute left-14 top-0 bottom-0 right-[230px] p-4 flex flex-col justify-between">
            {/* Верхний ряд столов Open Space */}
            <div className="grid grid-cols-3 gap-5 pt-1">
              <div>
                <ChairRow count={2} position="top" />
                <div className="h-14 rounded-md bg-slate-200/90 border border-slate-300 grid grid-cols-2 divide-x divide-slate-300">
                  <div />
                  <div />
                </div>
                <ChairRow count={2} position="bottom" />
              </div>

              <div>
                <ChairRow count={2} position="top" />
                <div className="h-14 rounded-md bg-slate-200/90 border border-slate-300 grid grid-cols-2 divide-x divide-slate-300 p-0.5 gap-0.5">
                  {renderInteractiveSeat('desk-18', 'h-full text-xs')}
                  <div className="bg-slate-200 rounded-xs" />
                </div>
                <ChairRow count={2} position="bottom" />
              </div>

              <div>
                <ChairRow count={2} position="top" />
                <div className="h-14 rounded-md bg-slate-200/90 border border-slate-300 grid grid-cols-2 divide-x divide-slate-300">
                  <div />
                  <div />
                </div>
                <ChairRow count={2} position="bottom" />
              </div>
            </div>

            {/* Подпись зоны Open Space */}
            <div className="text-center my-1">
              <span className="text-xs font-bold tracking-wide text-[#0F2942] bg-white/90 px-3 py-1 rounded-full border border-sky-100">
                Open Space
              </span>
            </div>

            {/* Средний ряд столов: Стол 12, Стол 13, Стол 14, Стол 15 */}
            <div className="grid grid-cols-3 gap-5 items-center">
              <div>
                <ChairRow count={2} position="top" />
                <div className="h-14 rounded-md bg-slate-200/80 border border-slate-300 p-0.5 flex flex-col gap-0.5">
                  <div className="h-1/2 bg-slate-200 rounded-xs" />
                  {renderInteractiveSeat('desk-12', 'h-1/2 text-[11px]')}
                </div>
                <ChairRow count={2} position="bottom" />
              </div>

              <div>
                <ChairRow count={2} position="top" />
                <div className="h-14 rounded-md bg-slate-200/80 border border-slate-300 p-0.5 flex flex-col gap-0.5">
                  {renderInteractiveSeat('desk-13', 'h-1/2 text-[11px]')}
                  <div className="h-1/2 grid grid-cols-2 gap-0.5">
                    <div className="bg-slate-200 rounded-xs" />
                    <div className="bg-emerald-200/70 border border-emerald-400/50 rounded-xs flex items-center justify-center text-[9px] text-[#0F2942]">
                      Резерв
                    </div>
                  </div>
                </div>
                <ChairRow count={2} position="bottom" />
              </div>

              <div>
                <ChairRow count={2} position="top" />
                <div className="h-14 rounded-md bg-slate-200/80 border border-slate-300 p-0.5 flex flex-col gap-0.5">
                  {renderInteractiveSeat('desk-14', 'h-1/2 text-[11px]')}
                  {renderInteractiveSeat('desk-15', 'h-1/2 text-[11px]')}
                </div>
                <ChairRow count={2} position="bottom" />
              </div>
            </div>

            {/* Нижний блок: Зона тишины (9, 10, 12, 13) */}
            <div className="mt-2 ml-auto w-[285px] bg-white/95 border-2 border-[#0F2942]/80 rounded-xl p-3 shadow-2xs">
              <div className="grid grid-cols-4 gap-2">
                {renderInteractiveSeat('quiet-12', 'h-11 text-xs')}
                {renderInteractiveSeat('quiet-9', 'h-11 text-xs')}
                {renderInteractiveSeat('quiet-10', 'h-11 text-xs')}
                {renderInteractiveSeat('quiet-13', 'h-11 text-xs')}
              </div>
              <div className="text-center mt-2 text-xs font-bold text-[#0F2942] flex items-center justify-center gap-1.5">
                <VolumeX className="w-3.5 h-3.5 text-[#19B5FE]" />
                Зона тишины
              </div>
            </div>
          </div>

          {/* ПРАВОЕ КРЫЛО: СТОЛ №1, ПЕРЕГОВОРНАЯ №1 И КАБИНЕТ №2 */}
          <div className="absolute right-0 top-0 bottom-0 w-[230px] border-l-[3px] border-[#0F2942]/80 flex flex-col divide-y-[3px] divide-[#0F2942]/80 bg-white/70">
            <div className="flex-1 p-3 flex flex-col justify-center">
              <ChairRow count={3} position="top" />
              {renderInteractiveSeat('desk-1', 'h-12 w-full text-xs')}
              <ChairRow count={3} position="bottom" />
            </div>

            <div className="flex-1 p-3 flex flex-col justify-center">
              <ChairRow count={3} position="top" />
              {renderInteractiveSeat('meeting-1', 'h-14 w-full text-xs')}
              <ChairRow count={3} position="bottom" />
            </div>

            <div className="flex-1 p-3 flex flex-col justify-center">
              <ChairRow count={2} position="top" />
              {renderInteractiveSeat('office-2', 'h-14 w-full text-xs')}
              <ChairRow count={2} position="bottom" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
