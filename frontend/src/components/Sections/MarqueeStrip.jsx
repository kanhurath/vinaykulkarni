import './MarqueeStrip.css';

const STATIC_ITEMS = [
  'Dharma', 'Education', 'Indian Knowledge Systems', 'Vedanta',
  'Entrepreneurship', 'Psychology', 'Samskrita', 'Nation Building',
];

function MarqueeStrip({ items }) {
  const list    = items?.length ? items.map(i => i.item_text || i) : STATIC_ITEMS;
  const doubled = [...list, ...list];

  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-inner">
        {doubled.map((item, i) => (
          <span key={i}>
            <span className="marquee-item">{item}</span>
            <span className="marquee-dot">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default MarqueeStrip;
