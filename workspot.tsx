import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  User,
  Menu,
  X,
  Wifi,
  Coffee,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Info,
  MessageSquare,
  Send,
  LogOut,
  LogIn,
  UserPlus,
  ArrowRight,
  VolumeX,
  HelpCircle,
  Check,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Lock,
  Building2
} from 'lucide-react';

// ============================================================================
// УТИЛИТЫ ФОРМАТИРОВАНИЯ
// ============================================================================

/**
 * Форматирует числовое значение цены с пробелами-разделителями тысяч (например: 15 400)
 */
const formatPrice = (value) => {
  return Math.round(Number(value) || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

// ============================================================================
// ИСХОДНЫЕ ДАННЫЕ ПРОЕКТА WORKSPOT (ЦЕНЫ В ТЕНГЕ ₸)
// ============================================================================

const INITIAL_SPACES = [
  // Open Space (1 800 ₸/час и 2 200 ₸/час для мест Комфорт)
  {
    id: 'desk-12',
    shortLabel: 'Стол 12',
    name: 'Стол №12 (Open Space)',
    type: 'Рабочий стол',
    zone: 'Open Space',
    price: 1800,
    status: 'available',
    capacity: '1 место',
    amenities: ['Быстрый Wi-Fi', 'Розетки 220В', 'Чай/кофе включены'],
    description: 'Удобное рабочее место у панорамного окна в основной зоне Open Space.'
  },
  {
    id: 'desk-13',
    shortLabel: 'Стол 13',
    name: 'Стол №13 (Open Space)',
    type: 'Рабочий стол',
    zone: 'Open Space',
    price: 1800,
    status: 'available',
    capacity: '1 место',
    amenities: ['Быстрый Wi-Fi', 'Розетки 220В', 'Чай/кофе включены'],
    description: 'Эргономичное кресло и просторная столешница для продуктивной работы.'
  },
  {
    id: 'desk-14',
    shortLabel: 'Стол 14',
    name: 'Стол №14 (Комфорт)',
    type: 'Рабочий стол',
    zone: 'Open Space',
    price: 2200,
    status: 'available',
    capacity: '1 место',
    amenities: ['Быстрый Wi-Fi', 'Розетки 220В', 'Чай/кофе включены', 'Настольная лампа'],
    description: 'Быстрый Wi-Fi, розетки, чай/кофе включены. Оптимальное расположение в центре зала.'
  },
  {
    id: 'desk-15',
    shortLabel: 'Стол 15',
    name: 'Стол №15 (Комфорт)',
    type: 'Рабочий стол',
    zone: 'Open Space',
    price: 2200,
    status: 'available',
    capacity: '1 место',
    amenities: ['Быстрый Wi-Fi', 'Розетки 220В', 'Чай/кофе включены'],
    description: 'Светлое место повышенного комфорта рядом с кофе-поинтом и зоной отдыха.'
  },
  {
    id: 'desk-18',
    shortLabel: '18',
    name: 'Стол №18 (Open Space)',
    type: 'Рабочий стол',
    zone: 'Open Space',
    price: 1800,
    status: 'occupied',
    capacity: '1 место',
    amenities: ['Быстрый Wi-Fi', 'Розетки 220В', 'Чай/кофе включены'],
    description: 'Угловое место в северной части Open Space.'
  },
  {
    id: 'desk-1',
    shortLabel: 'Стол №1',
    name: 'Стол №1 (Командный)',
    type: 'Рабочий стол',
    zone: 'Open Space',
    price: 1800,
    status: 'occupied',
    capacity: '1 место',
    amenities: ['Быстрый Wi-Fi', 'Розетки 220В', 'Чай/кофе включены'],
    description: 'Место в мини-кластере для совместной работы.'
  },
  // Зона тишины (2 200 ₸/час)
  {
    id: 'quiet-9',
    shortLabel: '9',
    name: 'Место №9 (Зона тишины)',
    type: 'Рабочий стол',
    zone: 'Зона тишины',
    price: 2200,
    status: 'available',
    capacity: '1 место',
    amenities: ['Акустический комфорт', 'Гигабитный Wi-Fi', 'Розетки и USB-C', 'Чай/кофе включены'],
    description: 'Изолированная зона без телефонных звонков для глубокой концентрации.'
  },
  {
    id: 'quiet-10',
    shortLabel: '10',
    name: 'Место №10 (Зона тишины)',
    type: 'Рабочий стол',
    zone: 'Зона тишины',
    price: 2200,
    status: 'available',
    capacity: '1 место',
    amenities: ['Акустический комфорт', 'Гигабитный Wi-Fi', 'Розетки и USB-C', 'Чай/кофе включены'],
    description: 'Индивидуальная капсула тишины с мягким освещением.'
  },
  {
    id: 'quiet-12',
    shortLabel: '12',
    name: 'Место №12 (Зона тишины)',
    type: 'Рабочий стол',
    zone: 'Зона тишины',
    price: 2200,
    status: 'available',
    capacity: '1 место',
    amenities: ['Акустический комфорт', 'Гигабитный Wi-Fi', 'Розетки и USB-C', 'Чай/кофе включены'],
    description: 'Место с акустическими перегородками для сосредоточенной работы.'
  },
  {
    id: 'quiet-13',
    shortLabel: '13',
    name: 'Место №13 (Зона тишины)',
    type: 'Рабочий стол',
    zone: 'Зона тишины',
    price: 2200,
    status: 'occupied',
    capacity: '1 место',
    amenities: ['Акустический комфорт', 'Гигабитный Wi-Fi', 'Розетки и USB-C', 'Чай/кофе включены'],
    description: 'Тихое рабочее место в глубине акустического зала.'
  },
  // Переговорная (5 500 ₸/час) и Приватный кабинет (7 500 ₸/час)
  {
    id: 'meeting-1',
    shortLabel: 'Переговорная №1',
    name: 'Переговорная №1',
    type: 'Переговорная',
    zone: 'Переговорные комнаты',
    price: 5500,
    status: 'available',
    capacity: 'До 6 человек',
    amenities: ['4K ТВ-панель и HDMI', 'Маркерная доска', 'Шумоизоляция', 'Чай/кофе для гостей'],
    description: 'Стильная переговорная комната для встреч с клиентами, созвонов и брейнштормов.'
  },
  {
    id: 'office-2',
    shortLabel: 'Кабинет №2',
    name: 'Кабинет №2 (Приватный)',
    type: 'Кабинет',
    zone: 'Приватные кабинеты',
    price: 7500,
    status: 'available',
    capacity: 'До 4 человек',
    amenities: ['Отдельный вход по QR', '4 рабочих места', 'Персональный климат-контроль', 'Чай/кофе включены'],
    description: 'Закрытый полностью оборудованный офис для небольшой команды или важных переговоров.'
  }
];

const TARIFFS = [
  {
    id: 'tariff-desk',
    title: 'Рабочий стол (Open Space)',
    filterType: 'Рабочий стол',
    price: '1 800 ₸',
    unit: '/ час',
    badge: 'Популярный выбор',
    description: 'Свободная посадка или выбор конкретного стола на интерактивной карте.',
    features: ['Безлимитный Wi-Fi 1 Гбит/с', 'Свежесваренный кофе и чай', 'Доступ 24/7 по QR-коду', 'Принтер и сканер']
  },
  {
    id: 'tariff-quiet',
    title: 'Зона тишины / Комфорт',
    filterType: 'Рабочий стол',
    price: '2 200 ₸',
    unit: '/ час',
    badge: 'Для фокуса',
    description: 'Специальное пространство с запретом на громкие разговоры и звонки.',
    features: ['Акустические перегородки', 'Эргономичные кресла', 'Розетки 220В и USB-C', 'Чай и снеки на кухне']
  },
  {
    id: 'tariff-meeting',
    title: 'Переговорная комната',
    filterType: 'Переговорная',
    price: '5 500 ₸',
    unit: '/ час',
    badge: 'До 6 человек',
    description: 'Идеально для презентаций, интервью и командных планёрок.',
    features: ['Большой экран 65" и AirPlay', 'Магнитно-маркерная доска', 'Высокая звукоизоляция', 'Бесплатная отмена за 30 мин']
  },
  {
    id: 'tariff-office',
    title: 'Приватный кабинет',
    filterType: 'Кабинет',
    price: '7 500 ₸',
    unit: '/ час',
    badge: 'Приватность',
    description: 'Изолированный мини-офис с отдельным электронным замком для команды.',
    features: ['Вместимость до 4 человек', 'Индивидуальный климат', 'Запираемые локеры', 'Приоритетная поддержка 24/7']
  }
];

const RULES_DATA = [
  {
    id: 1,
    icon: QrCode,
    title: 'Режим работы 24/7 и пропускной режим',
    badge: 'Круглосуточно',
    points: [
      'Коворкинг WorkSpot открыт 24 часа в сутки, 7 дней в неделю, включая выходные и праздничные дни.',
      'Вход на территорию осуществляется по персональному динамическому QR-коду из Личного кабинета.',
      'Приглашение гостей в Open Space возможно по гостевому пропуску (до 30 минут бесплатно).'
    ]
  },
  {
    id: 2,
    icon: Calendar,
    title: 'Правила бронирования и бесплатной отмены',
    badge: 'Гибкие условия',
    points: [
      'Оформление брони занимает менее 15 секунд — место закрепляется за вами мгновенно.',
      'Вы можете бесплатно отменить или перенести бронирование не позднее чем за 30 минут до его начала.',
      'При опоздании более чем на 20 минут без предупреждения бронь сохраняется за вами на весь оплаченный период.'
    ]
  },
  {
    id: 3,
    icon: VolumeX,
    title: 'Этикет в Open Space и Зоне тишины',
    badge: 'Комфорт для всех',
    points: [
      'В Зоне тишины действует строгий режим беззвучных устройств и запрет на телефонные звонки.',
      'В Open Space просим использовать наушники при просмотре видео и участии в онлайн-встречах.',
      'Для продолжительных созвонов используйте акустические кабины или забронируйте Переговорную.'
    ]
  },
  {
    id: 4,
    icon: Coffee,
    title: 'Кухня, кофе-поинт и рабочее место',
    badge: 'Забота о пространстве',
    points: [
      'Зерновой кофе, листовой чай, фильтрованная вода и лёгкие снеки бесплатны для всех резидентов.',
      'Употребление горячих блюд разрешено только в оборудованной обеденной зоне.',
      'По завершении работы просим оставить стол чистым и забрать личные вещи.'
    ]
  },
  {
    id: 5,
    icon: ShieldCheck,
    title: 'Информационная безопасность и Wi-Fi',
    badge: 'Защита данных',
    points: [
      'В пространстве работает защищённая Wi-Fi сеть с изоляцией клиентских устройств (WPA3-Enterprise).',
      'Персональные данные пользователей и история платежей шифруются по стандарту TLS 1.3.',
      'Для хранения ценных вещей используйте индивидуальные кодовые локеры в коридоре.'
    ]
  }
];

const FAQ_DATA = [
  {
    question: 'Как быстро активируется доступ после бронирования?',
    answer: 'Мгновенно. Сразу после нажатия кнопки «Забронировать сейчас» в вашем Личном кабинете обновляется QR-пропуск, который открывает турникет и двери забронированной зоны.'
  },
  {
    question: 'Что делать, если мои планы изменились и нужно отменить бронь?',
    answer: 'Вы можете отменить бронирование в один клик на странице бронирования или в разделе «Личный кабинет → Мои бронирования». При отмене за 30 минут до старта средства в тенге возвращаются в полном объёме.'
  },
  {
    question: 'Можно ли продлить время работы, если я уже сижу за столом?',
    answer: 'Да! Если стол свободен на следующие часы, вы можете оформить дополнительную бронь через сайт или написать в чат техподдержки 24/7 — оператор продлит сессию за минуту.'
  },
  {
    question: 'Есть ли в коворкинге мониторы и зарядные устройства?',
    answer: 'На каждом рабочем месте установлены розетки 220В и порты быстрой зарядки. На стойке ресепшн и в локерах можно бесплатно взять кабели HDMI, Type-C и подставки для ноутбука.'
  }
];

const INITIAL_BOOKINGS = [
  {
    id: 'BK-2048',
    spotId: 'meeting-1',
    spotName: 'Переговорная №1',
    zone: 'Переговорные комнаты',
    date: '2026-11-18',
    startTime: '14:00',
    endTime: '16:00',
    hours: 2,
    totalPrice: 11000,
    status: 'confirmed'
  },
  {
    id: 'BK-1994',
    spotId: 'desk-12',
    spotName: 'Стол №12 (Open Space)',
    zone: 'Open Space',
    date: '2026-11-10',
    startTime: '10:00',
    endTime: '15:00',
    hours: 5,
    totalPrice: 9000,
    status: 'completed'
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 101,
    title: 'Бронь подтверждена',
    message: 'Переговорная №1 забронирована на 18.11.2026 с 14:00 до 16:00 (11 000 ₸).',
    time: '12 мин назад',
    unread: true,
    type: 'success'
  },
  {
    id: 102,
    title: 'QR-пропуск активен',
    message: 'Ваш доступ в коворкинг WorkSpot 24/7 готов к использованию.',
    time: '2 часа назад',
    unread: true,
    type: 'info'
  }
];

const INITIAL_CHAT_MESSAGES = [
  {
    id: 1,
    sender: 'support',
    author: 'Елена • Поддержка WorkSpot',
    text: 'Здравствуйте! Я на связи 24/7. Подскажите, нужна ли помощь с выбором места, QR-пропуском или продлением брони?',
    time: '16:30'
  }
];

// ============================================================================
// ФИРМЕННЫЙ SVG-ЛОГОТИП WORKSPOT (КАК НА ПЕРВОМ МАКЕТЕ)
// ============================================================================

const WorkSpotLogo = ({ onClick, size = 'md' }) => {
  const iconDimensions = size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textDimensions = size === 'lg' ? 'text-2xl' : 'text-xl';

  const logoMarkup = (
    <div className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 40 40"
        className={`${iconDimensions} shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Контурная трапеция в перспективе внизу (план/зона места) */}
        <path
          d="M11 26.5H29L33.5 34.5H6.5L11 26.5Z"
          fill="#E0F4FF"
          stroke="#0F2942"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Ярко-голубой гео-пин сверху по центру */}
        <path
          d="M20 4.5C14.753 4.5 10.5 8.753 10.5 14C10.5 20.6 20 30.2 20 30.2C20 30.2 29.5 20.6 29.5 14C29.5 8.753 25.247 4.5 20 4.5Z"
          fill="#19B5FE"
          stroke="#0F2942"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Белый кружок внутри гео-пина */}
        <circle
          cx="20"
          cy="14"
          r="3.8"
          fill="#FFFFFF"
          stroke="#0F2942"
          strokeWidth="1.8"
        />
      </svg>
      <span className={`font-extrabold ${textDimensions} tracking-tight text-[#0F2942]`}>
        WorkSpot
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center focus:outline-none hover:opacity-90 transition-opacity cursor-pointer"
      >
        {logoMarkup}
      </button>
    );
  }

  return logoMarkup;
};

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ UI-КОМПОНЕНТЫ
// ============================================================================

/**
 * Векторная иллюстрация рабочего места для карточки "Детали бронирования"
 */
const WorkspaceIllustration = ({ type }) => {
  return (
    <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-[#F0F7FF] via-[#E8F3FF] to-emerald-50/70 border border-sky-100 flex items-center justify-center">
      <svg viewBox="0 0 400 200" className="w-full h-full object-cover" fill="none">
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
};

// ============================================================================
// ИНТЕРАКТИВНАЯ КАРТА КОВОРКИНГА
// ============================================================================

const FloorPlanMap = ({
  spaces,
  selectedSpotId,
  activeTypeFilter,
  onSelectSpot,
  onOccupiedClick
}) => {
  const getSpot = (id) => spaces.find((s) => s.id === id);

  const renderInteractiveSeat = (id, customClasses = '', customLabel = null) => {
    const spot = getSpot(id);
    if (!spot) return null;

    const isAvailable = spot.status === 'available';
    const isSelected = selectedSpotId === id;
    const isDimmed =
      activeTypeFilter !== 'Все типы' && spot.type !== activeTypeFilter;

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

    if (isDimmed && !isSelected) {
      styleClasses += 'opacity-35 ';
    }

    return (
      <button
        type="button"
        onClick={() => {
          if (isAvailable) {
            onSelectSpot(spot.id);
          } else {
            onOccupiedClick(spot);
          }
        }}
        title={`${spot.name} — ${isAvailable ? `${formatPrice(spot.price)} ₸/час` : 'Занято'}`}
        className={`${styleClasses} ${customClasses}`}
      >
        <span className="truncate px-1">{customLabel || spot.shortLabel}</span>
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
};

// ============================================================================
// СТРАНИЦА 1: ГЛАВНАЯ ПРИВЕТСТВЕННАЯ СТРАНИЦА
// ============================================================================

const HomePage = ({ onNavigate, onBookingTrigger, onSelectTariff }) => {
  const advantages = [
    {
      icon: Clock,
      title: 'Доступ 24/7 без сбоев',
      description: 'Работайте по удобному графику днём или ночью. Автоматизированный вход работает круглосуточно.'
    },
    {
      icon: Zap,
      title: 'Мгновенная бронь и отмена',
      description: 'Выбор стола на интерактивной карте и оформление за пару кликов. Бесплатная отмена в личном кабинете.'
    },
    {
      icon: Wifi,
      title: 'Высокоскоростной Wi-Fi и кофе',
      description: 'Стабильный интернет 1 Гбит/с, резервный канал связи, зерновой кофе, чай и оборудованная кухня.'
    },
    {
      icon: ShieldCheck,
      title: 'Безопасность данных и доступ по QR',
      description: 'Защищённая сеть, локеры для личных вещей и персональный QR-код для входа в забронированные зоны.'
    }
  ];

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
                Современный коворкинг для продуктивной работы. Доступ 24/7.
                Быстро, просто и безопасно — выбирайте стол в Open Space, тихую капсулу или переговорную на интерактивной карте.
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
                    Свободно 9 мест
                  </span>
                </div>

                <WorkspaceIllustration type="Комфорт Open Space" />

                <div className="bg-white rounded-xl p-4 border border-sky-100 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-[#0F2942] text-sm">Стол №14 (Комфорт)</div>
                    <div className="text-xs text-slate-500 mt-0.5">Быстрый Wi-Fi, розетки, чай/кофе</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-[#19B5FE] text-base">2 200 ₸/час</div>
                    <button
                      type="button"
                      onClick={() => onBookingTrigger()}
                      className="text-xs font-semibold text-[#19B5FE] hover:underline mt-0.5 cursor-pointer"
                    >
                      Забронировать →
                    </button>
                  </div>
                </div>
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
            Мы объединили продуманную эргономику пространства и удобный цифровой сервис бронирования
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
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
                  {tariff.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-medium text-[#0F2942]">
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                      <span>{feat}</span>
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
};

// ============================================================================
// СТРАНИЦА 2: СТРАНИЦА БРОНИРОВАНИЯ
// ============================================================================

const BookingPage = ({
  user,
  spaces,
  selectedSpotId,
  setSelectedSpotId,
  filter,
  setFilter,
  bookings,
  onCreateBooking,
  onCancelSpotBooking,
  onRequireAuthForBooking,
  onShowToast
}) => {
  const selectedSpot = spaces.find((s) => s.id === selectedSpotId) || spaces[2];

  // Расчёт длительности в часах
  const calculateHours = (start, end) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = eh + em / 60 - (sh + sm / 60);
    return diff > 0 ? Math.round(diff * 10) / 10 : 0;
  };

  const hours = calculateHours(filter.startTime, filter.endTime);
  const totalCost = hours > 0 ? Math.round(selectedSpot.price * hours) : selectedSpot.price;

  // Проверяем, есть ли у авторизованного пользователя активная бронь на выбранное место
  const userActiveBookingForSpot = user
    ? bookings.find((b) => b.spotId === selectedSpot.id && b.status === 'confirmed')
    : null;

  const handleFindPlaces = (e) => {
    e.preventDefault();
    if (hours <= 0) {
      onShowToast({
        type: 'error',
        title: 'Некорректное время',
        message: 'Время окончания бронирования должно быть позже времени начала.'
      });
      return;
    }

    const availableMatching = spaces.filter(
      (s) =>
        s.status === 'available' &&
        (filter.type === 'Все типы' || s.type === filter.type)
    );

    if (availableMatching.length > 0) {
      if (!availableMatching.some((s) => s.id === selectedSpotId)) {
        setSelectedSpotId(availableMatching[0].id);
      }
      onShowToast({
        type: 'success',
        title: 'Места обновлены',
        message: `Доступно свободных вариантов (${filter.type}): ${availableMatching.length} шт.`
      });
    } else {
      onShowToast({
        type: 'error',
        title: 'Нет свободных мест',
        message: 'По выбранному типу мест сейчас всё занято. Попробуйте выбрать другой тип.'
      });
    }
  };

  const handleBookClick = () => {
    // Если гость не вошёл в аккаунт — перенаправляем на страницу регистрации/входа
    if (!user) {
      onRequireAuthForBooking();
      return;
    }

    if (hours <= 0) {
      onShowToast({
        type: 'error',
        title: 'Ошибка выбора времени',
        message: 'Укажите корректный интервал времени бронирования.'
      });
      return;
    }
    if (selectedSpot.status !== 'available') {
      onShowToast({
        type: 'error',
        title: 'Место занято',
        message: 'Это место уже занято на выбранное время. Выберите свободный зелёный стол.'
      });
      return;
    }
    onCreateBooking(selectedSpot, filter, hours, totalCost);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Заголовок страницы */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F2942] tracking-tight mb-3">
          Забронируйте рабочее место за пару кликов
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Современный коворкинг для продуктивной работы. Доступ 24/7.
          <br className="hidden sm:inline" /> Быстро, просто и безопасно.
        </p>
      </div>

      {/* Панель фильтров */}
      <form
        onSubmit={handleFindPlaces}
        className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-sky-100 mb-8 max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Дата */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-[#0F2942] mb-1.5">Дата</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={filter.date}
                onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-[#F2F7FC]/80 text-sm font-semibold text-[#0F2942] focus:outline-none focus:ring-2 focus:ring-[#19B5FE] focus:bg-white"
              />
            </div>
          </div>

          {/* Время */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-[#0F2942] mb-1.5">Время</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="time"
                  value={filter.startTime}
                  onChange={(e) => setFilter({ ...filter, startTime: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-[#F2F7FC]/80 text-sm font-semibold text-[#0F2942] focus:outline-none focus:ring-2 focus:ring-[#19B5FE] focus:bg-white"
                />
              </div>
              <span className="text-slate-400 font-bold">—</span>
              <div className="relative flex-1">
                <input
                  type="time"
                  value={filter.endTime}
                  onChange={(e) => setFilter({ ...filter, endTime: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-[#F2F7FC]/80 text-sm font-semibold text-[#0F2942] focus:outline-none focus:ring-2 focus:ring-[#19B5FE] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Тип места */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-[#0F2942] mb-1.5">Тип места</label>
            <div className="relative">
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 bg-[#F2F7FC]/80 text-sm font-semibold text-[#0F2942] appearance-none focus:outline-none focus:ring-2 focus:ring-[#19B5FE] focus:bg-white cursor-pointer"
              >
                <option value="Все типы">Все типы</option>
                <option value="Рабочий стол">Рабочий стол</option>
                <option value="Переговорная">Переговорная</option>
                <option value="Кабинет">Кабинет</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Кнопка поиска */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="w-full bg-[#19B5FE] hover:bg-[#0099E5] text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-sm shadow-sky-200 transition-all cursor-pointer"
            >
              Найти места
            </button>
          </div>
        </div>
      </form>

      {/* Основная рабочая область: Карта + Детали бронирования */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-8">
          <FloorPlanMap
            spaces={spaces}
            selectedSpotId={selectedSpotId}
            activeTypeFilter={filter.type}
            onSelectSpot={(id) => setSelectedSpotId(id)}
            onOccupiedClick={(spot) => {
              const ownBooking = user
                ? bookings.find((b) => b.spotId === spot.id && b.status === 'confirmed')
                : null;
              if (ownBooking) {
                setSelectedSpotId(spot.id);
                onShowToast({
                  type: 'info',
                  title: 'Ваша активная бронь',
                  message: `Вы уже забронировали «${spot.name}». При необходимости вы можете отменить бронь в панели справа.`
                });
              } else {
                onShowToast({
                  type: 'error',
                  title: 'Место занято',
                  message: 'Это место уже занято на выбранное время.'
                });
              }
            }}
          />
        </div>

        {/* Правая панель: Детали бронирования */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-sky-100 lg:sticky lg:top-24">
            <h3 className="text-xl font-extrabold text-[#0F2942] mb-4">
              Детали бронирования
            </h3>

            {/* Превью рабочего места */}
            <div className="mb-5">
              <WorkspaceIllustration type={selectedSpot.type} />
            </div>

            {/* Название и цена в тенге */}
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h4 className="text-lg font-extrabold text-[#0F2942] leading-snug">
                {selectedSpot.name}
              </h4>
              <span className="text-lg font-extrabold text-[#19B5FE] shrink-0">
                {formatPrice(selectedSpot.price)} ₸/час
              </span>
            </div>

            {/* Теги зоны и вместимости */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-[#19B5FE] bg-[#F2F7FC] border border-sky-100 px-2.5 py-0.5 rounded-md">
                {selectedSpot.zone}
              </span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                {selectedSpot.capacity}
              </span>
            </div>

            {/* Описание удобств */}
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {selectedSpot.description}
            </p>

            {/* Список включенных опций */}
            <div className="bg-[#F2F7FC] rounded-2xl p-3.5 border border-sky-100 mb-5 space-y-2">
              {selectedSpot.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center gap-2 text-xs font-semibold text-[#0F2942]">
                  <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>

            {/* Итоговый расчёт в тенге */}
            <div className="flex items-center justify-between text-sm py-3 px-4 rounded-xl bg-[#E8F3FF]/80 border border-sky-200/70 mb-5">
              <div>
                <span className="text-[#0F2942] font-bold block">
                  {filter.date} • {filter.startTime}–{filter.endTime}
                </span>
                <span className="block text-xs text-slate-600 mt-0.5">
                  {hours > 0
                    ? `${hours} ч. × ${formatPrice(selectedSpot.price)} ₸`
                    : 'Укажите интервал'}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 block">Итого</span>
                <span className="text-lg font-extrabold text-[#19B5FE]">
                  {formatPrice(totalCost)} ₸
                </span>
              </div>
            </div>

            {/* Кнопки действия */}
            <div className="space-y-2.5">
              {userActiveBookingForSpot ? (
                <div className="w-full py-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  Место забронировано вами
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBookClick}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#19B5FE] hover:bg-[#0099E5] text-white font-bold text-base shadow-md shadow-sky-200/80 transition-all cursor-pointer"
                >
                  Забронировать сейчас
                </button>
              )}

              {user && (
                <button
                  type="button"
                  onClick={() => onCancelSpotBooking(selectedSpot.id)}
                  className="w-full py-2 text-center text-sm font-medium text-slate-500 hover:text-red-600 underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Отменить бронирование
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// СТРАНИЦА 3: СТРАНИЦА ПРАВИЛ
// ============================================================================

const RulesPage = ({ onNavigate }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-12">
      {/* Заголовок */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-sky-200/80 text-[#0099E5] text-xs font-bold mb-4 shadow-2xs">
          <ShieldCheck className="w-4 h-4" />
          Комфорт и безопасность резидентов
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F233C] tracking-tight mb-3">
          Правила коворкинга WorkSpot
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Простые и понятные договорённости, которые помогают каждому резиденту работать в тишине, чистоте и безопасности 24/7.
        </p>
      </div>

      {/* Сетка карточек правил */}
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
                {rule.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0099E5] mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Интерактивный аккордеон FAQ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] text-[#0099E5] flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0F233C]">Частые вопросы</h2>
            <p className="text-xs text-slate-500">Ответы на популярные вопросы о работе системы WorkSpot</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {FAQ_DATA.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
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
};

// ============================================================================
// СТРАНИЦА 4: ЛИЧНЫЙ КАБИНЕТ (БРОНИ + ЧАТ С ТЕХПОДДЕРЖКОЙ)
// ============================================================================

const AccountPage = ({
  user,
  bookings,
  onCancelBooking,
  chatMessages,
  onSendMessage,
  onNavigate,
  onLogout,
  focusChatSignal
}) => {
  const [bookingTab, setBookingTab] = useState('active'); // 'active' | 'history'
  const [mobileSection, setMobileSection] = useState('bookings'); // 'bookings' | 'chat'
  const [chatInput, setChatInput] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Личный кабинет доступен только авторизованным пользователям
  useEffect(() => {
    if (!user) {
      onNavigate('auth');
    }
  }, [user, onNavigate]);

  useEffect(() => {
    if (focusChatSignal > 0) {
      setMobileSection('chat');
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 150);
    }
  }, [focusChatSignal]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!user) {
    return null;
  }

  const activeBookings = bookings.filter((b) => b.status === 'confirmed');
  const historyBookings = bookings.filter((b) => b.status !== 'confirmed');
  const totalHours = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((acc, b) => acc + (b.hours || 0), 0);

  const displayedBookings = bookingTab === 'active' ? activeBookings : historyBookings;

  const quickQuestions = [
    'Продлить текущую бронь',
    'Не срабатывает QR-код',
    'Пароль от Wi-Fi'
  ];

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Переключатель секций для мобильных устройств */}
      <div className="flex lg:hidden bg-white p-1.5 rounded-2xl border border-sky-100 mb-6 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileSection('bookings')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
            mobileSection === 'bookings'
              ? 'bg-[#19B5FE] text-white shadow-xs'
              : 'text-slate-600'
          }`}
        >
          Мои бронирования ({activeBookings.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileSection('chat')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileSection === 'chat'
              ? 'bg-[#19B5FE] text-white shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Техподдержка 24/7
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ЛЕВАЯ КОЛОНКА: ПРОФИЛЬ И МОИ БРОНИРОВАНИЯ */}
        <div
          className={`lg:col-span-7 space-y-6 ${
            mobileSection === 'chat' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Карточка профиля */}
          <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#19B5FE] to-[#0099E5] text-white font-extrabold text-xl flex items-center justify-center shadow-sm shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-extrabold text-[#0F2942]">{user.name}</h1>
                    <span className="text-xs font-bold text-[#19B5FE] bg-[#F2F7FC] border border-sky-200/70 px-2.5 py-0.5 rounded-full">
                      {user.role || 'Резидент WorkSpot'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(!showQrModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F2F7FC] hover:bg-[#E8F3FF] text-[#19B5FE] font-bold text-xs border border-sky-200/80 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  Мой QR-код
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200/80 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из аккаунта
                </button>
              </div>
            </div>

            {/* Раскрывающийся QR-пропуск */}
            {showQrModal && (
              <div className="my-5 p-4 rounded-2xl bg-[#F2F7FC] border border-sky-200/80 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 bg-white p-2 rounded-xl border border-sky-100 flex items-center justify-center shrink-0">
                  <QrCode className="w-16 h-16 text-[#0F2942]" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-sm font-extrabold text-[#0F2942]">
                    Персональный пропуск 24/7
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Поднесите этот QR-код к считывателю на входе в коворкинг или у двери переговорной. Код обновляется автоматически.
                  </p>
                  <span className="inline-block mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Статус: Активен
                  </span>
                </div>
              </div>
            )}

            {/* Мини-статистика */}
            <div className="grid grid-cols-3 gap-3 pt-5">
              <div className="bg-[#F2F7FC] rounded-2xl p-3.5 border border-sky-100">
                <span className="text-xs text-slate-500 block">Активных броней</span>
                <span className="text-xl font-extrabold text-[#0F2942] mt-0.5 block">
                  {activeBookings.length}
                </span>
              </div>
              <div className="bg-[#F2F7FC] rounded-2xl p-3.5 border border-sky-100">
                <span className="text-xs text-slate-500 block">Часов в коворкинге</span>
                <span className="text-xl font-extrabold text-[#19B5FE] mt-0.5 block">
                  {totalHours} ч.
                </span>
              </div>
              <div className="bg-[#F2F7FC] rounded-2xl p-3.5 border border-sky-100">
                <span className="text-xs text-slate-500 block">Доступ в зал</span>
                <span className="text-xl font-extrabold text-[#22C55E] mt-0.5 block">
                  24/7
                </span>
              </div>
            </div>
          </div>

          {/* Секция "Мои бронирования" */}
          <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#0F2942]">Мои бронирования</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Управляйте текущими записями или оформите новую бронь
                </p>
              </div>

              {/* Вкладки */}
              <div className="inline-flex bg-[#F2F7FC] p-1 rounded-xl self-start sm:self-auto border border-sky-100">
                <button
                  type="button"
                  onClick={() => setBookingTab('active')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    bookingTab === 'active'
                      ? 'bg-white text-[#0F2942] shadow-xs'
                      : 'text-slate-500 hover:text-[#0F2942]'
                  }`}
                >
                  Активные брони ({activeBookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingTab('history')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    bookingTab === 'history'
                      ? 'bg-white text-[#0F2942] shadow-xs'
                      : 'text-slate-500 hover:text-[#0F2942]'
                  }`}
                >
                  История ({historyBookings.length})
                </button>
              </div>
            </div>

            {displayedBookings.length === 0 ? (
              <div className="text-center py-10 px-4 bg-[#F2F7FC] rounded-2xl border border-dashed border-sky-200">
                <Calendar className="w-10 h-10 text-sky-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#0F2942] mb-1">
                  {bookingTab === 'active'
                    ? 'У вас пока нет активных бронирований'
                    : 'История бронирований пуста'}
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Выберите свободный стол или переговорную на интерактивной карте
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('booking')}
                  className="inline-flex items-center gap-1.5 bg-[#19B5FE] hover:bg-[#0099E5] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Перейти к карте мест
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 sm:p-5 rounded-2xl border border-sky-100 bg-[#F8FBFF] hover:border-sky-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#{booking.id}</span>
                        <h3 className="font-extrabold text-[#0F2942] text-base">
                          {booking.spotName}
                        </h3>
                        {booking.status === 'confirmed' && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            Подтверждено
                          </span>
                        )}
                        {booking.status === 'cancelled' && (
                          <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                            Отменено
                          </span>
                        )}
                        {booking.status === 'completed' && (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
                            Завершено
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#19B5FE]" />
                          {booking.zone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#19B5FE]" />
                          {booking.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#19B5FE]" />
                          {booking.startTime} – {booking.endTime} ({booking.hours} ч.)
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-sky-100 shrink-0">
                      <div className="text-base font-extrabold text-[#0F2942]">
                        {formatPrice(booking.totalPrice)} ₸
                      </div>

                      {booking.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => onCancelBooking(booking.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Отменить бронь
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ЧАТ С ТЕХПОДДЕРЖКОЙ (ОНЛАЙН 24/7) */}
        <div
          className={`lg:col-span-5 ${
            mobileSection === 'bookings' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden flex flex-col h-[580px] lg:sticky lg:top-24">
            {/* Шапка чата */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#19B5FE] to-[#0099E5] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white border border-white/30">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-[#19B5FE]" />
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base leading-tight">
                    Поддержка WorkSpot
                  </h2>
                  <p className="text-xs text-sky-100 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    Онлайн 24/7 • Отвечаем за 1 минуту
                  </p>
                </div>
              </div>
            </div>

            {/* История сообщений */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F2F7FC] custom-scrollbar">
              {chatMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    {!isUser && (
                      <span className="text-[11px] font-semibold text-slate-500 mb-1 ml-1">
                        {msg.author}
                      </span>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-[#19B5FE] text-white rounded-br-xs'
                          : 'bg-white text-[#0F2942] border border-sky-100 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Быстрые подсказки вопросов */}
            <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(q)}
                  className="shrink-0 text-xs font-semibold text-[#19B5FE] bg-[#F2F7FC] hover:bg-[#E8F3FF] border border-sky-200/70 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Поле ввода сообщения */}
            <form
              onSubmit={handleChatSubmit}
              className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Напишите ваш вопрос..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F2F7FC] border border-sky-100 text-sm text-[#0F2942] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#19B5FE] focus:bg-white"
              />
              <button
                type="submit"
                aria-label="Отправить сообщение"
                className="p-2.5 rounded-xl bg-[#19B5FE] hover:bg-[#0099E5] text-white shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// СТРАНИЦА 5: СТРАНИЦА РЕГИСТРАЦИИ И ВХОДА (ТОЛЬКО ДЛЯ ГОСТЕЙ)
// ============================================================================

const AuthPage = ({
  user,
  authBannerMessage,
  onAuthSuccess,
  onNavigate,
  onShowToast
}) => {
  const [mode, setMode] = useState('register'); // По умолчанию открывается Регистрация
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeRules: true
  });

  const [errors, setErrors] = useState({});

  // Если пользователь уже вошёл в аккаунт — перенаправляем в Личный кабинет
  useEffect(() => {
    if (user) {
      onNavigate('profile');
    }
  }, [user, onNavigate]);

  if (user) {
    return null;
  }

  const validate = () => {
    const newErrors = {};
    if (mode === 'register' && !formData.name.trim()) {
      newErrors.name = 'Введите ваше имя и фамилию';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      newErrors.email = 'Укажите корректный адрес электронной почты';
    }
    if (mode === 'register' && !formData.phone.trim()) {
      newErrors.phone = 'Введите контактный номер телефона';
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }
    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    if (mode === 'register' && !formData.agreeRules) {
      newErrors.agreeRules = 'Необходимо принять правила коворкинга WorkSpot';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      onShowToast({
        type: 'error',
        title: 'Проверьте форму',
        message: 'Пожалуйста, исправьте ошибки в заполнении полей.'
      });
      return;
    }

    const userName =
      mode === 'register'
        ? formData.name.trim()
        : formData.email.toLowerCase().startsWith('daniil')
        ? 'Даниил Бугаев'
        : formData.email.split('@')[0] || 'Даниил Бугаев';

    onAuthSuccess({
      name: userName,
      email: formData.email.trim(),
      phone: formData.phone.trim() || '+7 (701) 555-01-99',
      role: 'Резидент WorkSpot'
    });
  };

  const handleQuickDemoLogin = () => {
    onAuthSuccess({
      name: 'Даниил Бугаев',
      email: 'daniil.bugaev@workspot.kz',
      phone: '+7 (701) 555-01-99',
      role: 'Резидент WorkSpot'
    });
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="bg-white rounded-3xl p-6 sm:p-9 border border-sky-100 shadow-sm">
        {/* Фирменный логотип WorkSpot сверху формы */}
        <div className="flex justify-center mb-5">
          <WorkSpotLogo size="lg" onClick={() => onNavigate('home')} />
        </div>

        {/* Баннер-приглашение к регистрации / входу */}
        <div className="mb-6 p-3.5 rounded-2xl bg-[#F2F7FC] border border-sky-200/80 flex items-start gap-2.5 text-xs text-[#0F2942]">
          <Info className="w-4 h-4 text-[#19B5FE] shrink-0 mt-0.5" />
          <span className="font-semibold leading-relaxed">
            {authBannerMessage ||
              'Создайте аккаунт WorkSpot или войдите, чтобы управлять бронированиями'}
          </span>
        </div>

        {/* Переключатель Регистрация / Вход */}
        <div className="grid grid-cols-2 bg-[#F2F7FC] p-1.5 rounded-2xl mb-6 border border-sky-100">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrors({});
            }}
            className={`py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#19B5FE] shadow-xs'
                : 'text-slate-500 hover:text-[#0F2942]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Регистрация
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrors({});
            }}
            className={`py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#19B5FE] shadow-xs'
                : 'text-slate-500 hover:text-[#0F2942]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Вход в аккаунт
          </button>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-[#0F2942]">
            {mode === 'register' ? 'Регистрация в WorkSpot' : 'Вход в аккаунт WorkSpot'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            {mode === 'register'
              ? 'Заполните данные, чтобы получить персональный QR-пропуск и оформлять брони'
              : 'Введите данные учётной записи или воспользуйтесь быстрым демо-входом'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#0F2942] mb-1.5">
                Имя и фамилия
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Даниил Бугаев"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#0F2942] bg-[#F2F7FC]/80 focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-slate-200 focus:ring-[#19B5FE]'
                  }`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0F2942] mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="daniil@workspot.kz"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#0F2942] bg-[#F2F7FC]/80 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-[#19B5FE]'
                }`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#0F2942] mb-1.5">
                Номер телефона
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (701) 555-01-99"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#0F2942] bg-[#F2F7FC]/80 focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-slate-200 focus:ring-[#19B5FE]'
                  }`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0F2942] mb-1.5">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Минимум 6 символов"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-[#0F2942] bg-[#F2F7FC]/80 focus:bg-white focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-red-400 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-[#19B5FE]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#0F2942] mb-1.5">
                  Подтверждение пароля
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="Повторите пароль"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#0F2942] bg-[#F2F7FC]/80 focus:bg-white focus:outline-none focus:ring-2 ${
                      errors.confirmPassword
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-slate-200 focus:ring-[#19B5FE]'
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.agreeRules}
                    onChange={(e) =>
                      setFormData({ ...formData, agreeRules: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded-sm border-slate-300 text-[#19B5FE] focus:ring-[#19B5FE]"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Я принимаю{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('rules')}
                      className="text-[#19B5FE] font-bold hover:underline cursor-pointer"
                    >
                      правила коворкинга WorkSpot
                    </button>{' '}
                    и соглашаюсь на обработку персональных данных.
                  </span>
                </label>
                {errors.agreeRules && (
                  <p className="text-xs text-red-600 mt-1">{errors.agreeRules}</p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#19B5FE] hover:bg-[#0099E5] text-white font-bold text-sm shadow-md shadow-sky-200/80 transition-all cursor-pointer"
          >
            {mode === 'register' ? 'Зарегистрироваться и продолжить' : 'Войти в аккаунт'}
          </button>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-[#F2F7FC] hover:bg-[#E8F3FF] text-[#0F2942] font-semibold text-xs border border-sky-200/80 transition-colors cursor-pointer"
          >
            Быстрый демо-вход (Даниил Бугаев)
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ WORKSPOT
// ============================================================================

export default function App() {
  // Навигация по 5 страницам: 'home' | 'booking' | 'rules' | 'profile' | 'auth'
  const [activePage, setActivePage] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // По умолчанию пользователь не авторизован (гость)
  const [user, setUser] = useState(null);

  // Целевая страница после успешной авторизации ('profile' при клике на "Войти", 'booking' при клике на кнопки бронирования)
  const [pendingRedirect, setPendingRedirect] = useState('profile');
  const [authBannerMessage, setAuthBannerMessage] = useState(
    'Создайте аккаунт WorkSpot или войдите, чтобы управлять бронированиями'
  );

  // Состояние мест и фильтров бронирования
  const [spaces, setSpaces] = useState(INITIAL_SPACES);
  const [selectedSpotId, setSelectedSpotId] = useState('desk-14');
  const [bookingFilter, setBookingFilter] = useState({
    date: '2026-11-16',
    startTime: '09:00',
    endTime: '16:00',
    type: 'Все типы'
  });

  // Бронирования пользователя
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);

  // Своевременные уведомления (колокольчик в шапке)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);

  // Чат с техподдержкой 24/7
  const [chatMessages, setChatMessages] = useState(INITIAL_CHAT_MESSAGES);
  const [focusChatSignal, setFocusChatSignal] = useState(0);

  // Всплывающие уведомления (Toasts)
  const [toasts, setToasts] = useState([]);

  // Защита маршрутов по статусу авторизации
  useEffect(() => {
    if (activePage === 'profile' && !user) {
      setActivePage('auth');
    } else if (activePage === 'auth' && user) {
      setActivePage('profile');
    }
  }, [activePage, user]);

  const addToast = ({ type = 'info', title, message, actionLabel, onAction }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message, actionLabel, onAction }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addSystemNotification = (title, message, type = 'info') => {
    setNotifications((prev) => [
      {
        id: Date.now() + Math.random(),
        title,
        message,
        time: 'Только что',
        unread: true,
        type
      },
      ...prev
    ]);
  };

  const navigateTo = (page) => {
    if (page === 'profile' && !user) {
      setPendingRedirect('profile');
      setAuthBannerMessage(
        'Создайте аккаунт WorkSpot или войдите, чтобы управлять бронированиями'
      );
      setActivePage('auth');
    } else if (page === 'auth' && user) {
      setActivePage('profile');
    } else {
      setActivePage(page);
    }
    setMobileMenuOpen(false);
    setNotifOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Открытие окна регистрации/входа по кнопке "Войти" в шапке
  const handleOpenAuthFromHeader = () => {
    setPendingRedirect('profile');
    setAuthBannerMessage(
      'Создайте аккаунт WorkSpot или войдите, чтобы управлять бронированиями'
    );
    navigateTo('auth');
  };

  // Переход к регистрации/входу при нажатии на любую кнопку, связанную с бронированием
  const handleRequireAuthForBooking = (
    customMessage = 'Зарегистрируйтесь или войдите в аккаунт, чтобы завершить бронирование выбранного места'
  ) => {
    setPendingRedirect('booking');
    setAuthBannerMessage(customMessage);
    addToast({
      type: 'info',
      title: 'Требуется аккаунт WorkSpot',
      message: customMessage
    });
    navigateTo('auth');
  };

  // Кнопка "Забронировать место" в Hero-секции главной страницы
  const handleHeroBookingTrigger = () => {
    if (!user) {
      handleRequireAuthForBooking(
        'Зарегистрируйтесь или войдите в аккаунт, чтобы забронировать рабочее место'
      );
      return;
    }
    navigateTo('booking');
  };

  // Выбор тарифа с главной страницы -> если не авторизован, открывает регистрацию; если авторизован — карту
  const handleSelectTariffFromHome = (filterType) => {
    setBookingFilter((prev) => ({ ...prev, type: filterType }));
    const matchingSpot = spaces.find(
      (s) => s.status === 'available' && s.type === filterType
    );
    if (matchingSpot) {
      setSelectedSpotId(matchingSpot.id);
    }

    if (!user) {
      handleRequireAuthForBooking(
        `Зарегистрируйтесь или войдите в аккаунт, чтобы забронировать пространство категории «${filterType}»`
      );
      return;
    }

    navigateTo('booking');
  };

  // Оформление новой брони
  const handleCreateBooking = (spot, filter, hours, totalPrice) => {
    const newBooking = {
      id: `BK-${Math.floor(2100 + Math.random() * 899)}`,
      spotId: spot.id,
      spotName: spot.name,
      zone: spot.zone,
      date: filter.date,
      startTime: filter.startTime,
      endTime: filter.endTime,
      hours,
      totalPrice,
      status: 'confirmed'
    };

    setBookings((prev) => [newBooking, ...prev]);
    setSpaces((prev) =>
      prev.map((s) => (s.id === spot.id ? { ...s, status: 'occupied' } : s))
    );

    addSystemNotification(
      'Новое бронирование оформлено',
      `${spot.name} забронирован на ${filter.date} (${filter.startTime}–${filter.endTime}) — ${formatPrice(totalPrice)} ₸.`,
      'success'
    );

    addToast({
      type: 'success',
      title: 'Место успешно забронировано!',
      message: `${spot.name} закреплён за вами на ${filter.date} (${formatPrice(totalPrice)} ₸).`,
      actionLabel: 'Открыть в кабинете',
      onAction: () => navigateTo('profile')
    });
  };

  // Отмена брони по ID брони (из Личного кабинета)
  const handleCancelBookingById = (bookingId) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    );

    setSpaces((prev) =>
      prev.map((s) => (s.id === target.spotId ? { ...s, status: 'available' } : s))
    );

    addSystemNotification(
      'Бронирование отменено',
      `Бронь #${target.id} (${target.spotName}) отменена. Сумма ${formatPrice(target.totalPrice)} ₸ возвращена.`,
      'info'
    );

    addToast({
      type: 'info',
      title: 'Бронь отменена',
      message: `Бронирование «${target.spotName}» отменено без штрафа.`
    });
  };

  // Отмена брони со страницы бронирования
  const handleCancelSpotBooking = (spotId) => {
    if (!user) {
      handleRequireAuthForBooking();
      return;
    }
    const activeBooking = bookings.find(
      (b) => b.spotId === spotId && b.status === 'confirmed'
    );
    if (activeBooking) {
      handleCancelBookingById(activeBooking.id);
    } else {
      addToast({
        type: 'info',
        title: 'Нет активной брони',
        message: 'Для выбранного места у вас сейчас нет оформленной брони.'
      });
    }
  };

  // Отправка сообщения в чат техподдержки + автоответ оператора
  const handleSendSupportMessage = (text) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      author: user ? user.name : 'Гость',
      text,
      time: timeStr
    };

    setChatMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      let replyText =
        'Спасибо за обращение! Оператор уже проверяет информацию по вашему аккаунту и поможет в течение минуты.';

      const lower = text.toLowerCase();
      if (lower.includes('продл')) {
        replyText =
          'Вы можете продлить бронь на любое свободное время на вкладке «Бронирование» или напишите, до какого часа продлить текущее место — я оформлю всё вручную.';
      } else if (lower.includes('qr') || lower.includes('код') || lower.includes('вход')) {
        replyText =
          'Я обновил ваш динамический QR-пропуск. Нажмите «Мой QR-код» в карточке профиля сверху — доступ на турникете активен.';
      } else if (lower.includes('wi-fi') || lower.includes('вай') || lower.includes('парол')) {
        replyText =
          'Сеть для резидентов: WorkSpot_5G_Resident. Пароль: WS2026_FastWork. Приятной работы!';
      }

      const replyTime = new Date();
      const replyTimeStr = `${String(replyTime.getHours()).padStart(2, '0')}:${String(
        replyTime.getMinutes()
      ).padStart(2, '0')}`;

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'support',
          author: 'Елена • Поддержка WorkSpot',
          text: replyText,
          time: replyTimeStr
        }
      ]);
    }, 600);
  };

  // Успешная регистрация или вход -> редирект на целевую страницу (profile или booking)
  const handleAuthSuccess = (newUser) => {
    setUser(newUser);
    addSystemNotification(
      'Добро пожаловать в WorkSpot!',
      `Аккаунт ${newUser.name} успешно активирован. Доступ 24/7 открыт.`,
      'success'
    );
    addToast({
      type: 'success',
      title: 'Вы вошли в систему',
      message: `Добро пожаловать, ${newUser.name}!`
    });
    const target = pendingRedirect || 'profile';
    setPendingRedirect('profile');
    setActivePage(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Выход из аккаунта -> сброс user в null и переход на главную
  const handleLogout = () => {
    setUser(null);
    setNotifOpen(false);
    addToast({
      type: 'info',
      title: 'Вы вышли из аккаунта',
      message: 'Вы вернулись на главную страницу в режиме гостя.'
    });
    navigateTo('home');
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // На панели навигации ТОЛЬКО 3 ссылки: Главная, Бронирование, Правила
  const navItems = [
    { id: 'home', label: 'Главная' },
    { id: 'booking', label: 'Бронирование' },
    { id: 'rules', label: 'Правила' }
  ];

  // Инициалы пользователя для аватарки в шапке
  const userInitials = user
    ? user.name
        .trim()
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F7FC] text-[#0F2942] font-sans">
      {/* ================================================================== */}
      {/* ВЕРХНЯЯ НАВИГАЦИОННАЯ ПАНЕЛЬ                                       */}
      {/* ================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[70px]">
            {/* Фирменный логотип WorkSpot */}
            <WorkSpotLogo onClick={() => navigateTo('home')} />

            {/* Центральное меню (ТОЛЬКО 3 ссылки: Главная, Бронирование, Правила) */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
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

            {/* Правый блок: для гостя кнопка "Войти", для авторизованного — колокольчик и кнопка с именем */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {user ? (
                <>
                  {/* Колокольчик уведомлений */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setNotifOpen(!notifOpen)}
                      aria-label="Уведомления"
                      className="p-2.5 rounded-xl bg-white hover:bg-[#F2F7FC] border border-sky-100 text-[#0F2942] transition-colors relative cursor-pointer"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Выпадающий список уведомлений */}
                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-sky-100 z-50 overflow-hidden">
                        <div className="px-4 py-3 bg-[#F2F7FC] border-b border-sky-100 flex items-center justify-between">
                          <span className="font-bold text-sm text-[#0F2942]">
                            Уведомления ({unreadCount})
                          </span>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setNotifications((prev) =>
                                  prev.map((n) => ({ ...n, unread: false }))
                                )
                              }
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
                                  <span className="font-bold text-[#0F2942]">{notif.title}</span>
                                  <span className="text-[10px] text-slate-400">{notif.time}</span>
                                </div>
                                <p className="text-slate-600 leading-relaxed">{notif.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Кнопка с именем пользователя — единственный способ открыть Личный кабинет */}
                  <button
                    type="button"
                    onClick={() => navigateTo('profile')}
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
                    <span className="max-w-[140px] sm:max-w-[190px] truncate">{user.name}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenAuthFromHeader}
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-[#19B5FE] hover:bg-[#0099E5] text-white font-bold text-sm shadow-xs shadow-sky-200/80 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Войти</span>
                </button>
              )}

              {/* Кнопка мобильного меню */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Открыть меню"
                className="md:hidden p-2.5 rounded-xl bg-white border border-sky-100 text-[#0F2942] hover:bg-[#F2F7FC]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Выпадающее меню для мобильных устройств (только 3 ссылки + действие входа/профиля) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-sky-100 shadow-lg px-4 pt-3 pb-5 space-y-1.5">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
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
                  onClick={() => navigateTo('profile')}
                  className="w-full py-3 px-4 rounded-xl bg-[#19B5FE] text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {user.name}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenAuthFromHeader}
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

      {/* ================================================================== */}
      {/* КОНТЕНТ АКТИВНОЙ СТРАНИЦЫ                                          */}
      {/* ================================================================== */}
      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            onNavigate={navigateTo}
            onBookingTrigger={handleHeroBookingTrigger}
            onSelectTariff={handleSelectTariffFromHome}
          />
        )}

        {activePage === 'booking' && (
          <BookingPage
            user={user}
            spaces={spaces}
            selectedSpotId={selectedSpotId}
            setSelectedSpotId={setSelectedSpotId}
            filter={bookingFilter}
            setFilter={setBookingFilter}
            bookings={bookings}
            onCreateBooking={handleCreateBooking}
            onCancelSpotBooking={handleCancelSpotBooking}
            onRequireAuthForBooking={handleRequireAuthForBooking}
            onShowToast={addToast}
          />
        )}

        {activePage === 'rules' && <RulesPage onNavigate={navigateTo} />}

        {activePage === 'profile' && (
          <AccountPage
            user={user}
            bookings={bookings}
            onCancelBooking={handleCancelBookingById}
            chatMessages={chatMessages}
            onSendMessage={handleSendSupportMessage}
            onNavigate={navigateTo}
            onLogout={handleLogout}
            focusChatSignal={focusChatSignal}
          />
        )}

        {activePage === 'auth' && (
          <AuthPage
            user={user}
            authBannerMessage={authBannerMessage}
            onAuthSuccess={handleAuthSuccess}
            onNavigate={navigateTo}
            onShowToast={addToast}
          />
        )}
      </main>

      {/* ================================================================== */}
      {/* ПЛАВАЮЩИЙ ВИДЖЕТ "ОНЛАЙН 24/7"                                     */}
      {/* ================================================================== */}
      <button
        type="button"
        onClick={() => {
          if (!user) {
            setPendingRedirect('profile');
            setAuthBannerMessage(
              'Войдите или зарегистрируйтесь, чтобы открыть чат с техподдержкой 24/7'
            );
            navigateTo('auth');
            return;
          }
          navigateTo('profile');
          setFocusChatSignal((n) => n + 1);
        }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 bg-white pl-4 pr-2 py-2 rounded-2xl shadow-lg border border-sky-100 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group"
      >
        <span className="text-xs sm:text-sm font-bold text-[#0F2942]">Онлайн 24/7</span>
        <span className="relative w-10 h-10 rounded-xl bg-[#19B5FE] group-hover:bg-[#0099E5] text-white flex items-center justify-center transition-colors">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
        </span>
      </button>

      {/* ================================================================== */}
      {/* СИСТЕМА ВСПЛЫВАЮЩИХ УВЕДОМЛЕНИЙ (TOASTS)                           */}
      {/* ================================================================== */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl p-4 shadow-lg border backdrop-blur-md transition-all flex items-start gap-3 ${
                isError
                  ? 'bg-red-50/95 border-red-200 text-red-900'
                  : isSuccess
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950'
                  : 'bg-white/95 border-sky-200 text-[#0F2942]'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-[#19B5FE] shrink-0 mt-0.5" />
              )}

              <div className="flex-1 text-xs">
                <div className="font-extrabold text-sm mb-0.5">{toast.title}</div>
                <p className="opacity-90 leading-relaxed">{toast.message}</p>
                {toast.actionLabel && toast.onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.onAction();
                      removeToast(toast.id);
                    }}
                    className="mt-2 inline-block font-extrabold text-[#19B5FE] hover:underline cursor-pointer"
                  >
                    {toast.actionLabel} →
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* ФУТЕР                                                              */}
      {/* ================================================================== */}
      <footer className="bg-white border-t border-sky-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WorkSpotLogo onClick={() => navigateTo('home')} />
            <span className="text-xs text-slate-400 hidden md:inline">
              • Система онлайн-бронирования коворкинга 24/7
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-slate-500">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className="hover:text-[#19B5FE] transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            © 2026 WorkSpot. Все права защищены.
          </div>
        </div>
      </footer>

      {/* Пользовательские стили скроллбаров */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scrollbar::-webkit-scrollbar {
              height: 8px;
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #E2E8F0;
              border-radius: 9999px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #94A3B8;
              border-radius: 9999px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #64748B;
            }
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `
        }}
      />
    </div>
  );
}