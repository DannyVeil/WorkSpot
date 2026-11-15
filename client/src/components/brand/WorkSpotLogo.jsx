/** Фирменный SVG-логотип WorkSpot из дизайн-макета. */
export default function WorkSpotLogo({ onClick, size = 'md' }) {
  const iconDimensions = size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textDimensions = size === 'lg' ? 'text-2xl' : 'text-xl';

  const logoMarkup = (
    <div className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 40 40"
        className={`${iconDimensions} shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
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
        <circle cx="20" cy="14" r="3.8" fill="#FFFFFF" stroke="#0F2942" strokeWidth="1.8" />
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
        aria-label="WorkSpot — на главную"
      >
        {logoMarkup}
      </button>
    );
  }

  return logoMarkup;
}
