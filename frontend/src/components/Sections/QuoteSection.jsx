import './QuoteSection.css';

const STATIC = {
  quote_text:     'Om, may the teacher and student move together in learning, relish the process, perform with vigor and focus, attain brilliance in understanding without hostility, and be surrounded by peace, peace, peace.',
  quote_attr:     'Taittirīya Upaniṣad · Śānti Pāṭha',
  quote_mark_url: 'https://alchmi.com/wp-content/uploads/2026/06/Taittiriya-Upani%E1%B9%A3ad-Quote-Top-01_VK-2.png',
  ornament_url:   'https://alchmi.com/wp-content/uploads/2026/06/Taittiriya-Upani%E1%B9%A3ad-Divider-Bottom-01_VK-2.png',
};

function QuoteSection({ quote }) {
  const d = quote || STATIC;
  return (
    <section className="quote-section">
      <div className="quote-bg-text" aria-hidden="true">ॐ</div>
      <div className="quote-inner reveal">
        {(d.quote_mark_url || STATIC.quote_mark_url) && (
          <div className="quote-mark">
            <img src={d.quote_mark_url || STATIC.quote_mark_url} alt="Quote mark" className="quote-mark-img" />
          </div>
        )}
        <p className="quote-text">{d.quote_text || STATIC.quote_text}</p>
        {(d.ornament_url || STATIC.ornament_url) && (
          <div className="ornament">
            <img src={d.ornament_url || STATIC.ornament_url} alt="Ornament divider" className="ornament-img" />
          </div>
        )}
        <div className="quote-attr">{d.quote_attr || STATIC.quote_attr}</div>
      </div>
    </section>
  );
}

export default QuoteSection;
