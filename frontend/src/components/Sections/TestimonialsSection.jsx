import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCards } from '../../services/testimonialsApi';
import './TestimonialsSection.css';

const HOME_COUNT  = 4;
const AUTOPLAY_MS = 5500;

// Static fallback — first 4 cards from seed data
const STATIC_ITEMS = [
  { id: 1, avatar: 'C', text: "Vinay is an energetic and dynamic Executive with a high sense of urgency. He is meticulous as he uncovers the issues and moves just as thoroughly in developing an action plan, making sure to collaborate with those involved. A quality leader!", author: 'Christine Helin', role: 'Vice-President · Lovitt & Touché, a Marsh & McLennan Agency LLC Company', program: '' },
  { id: 2, avatar: 'J', text: "I had the good fortune of reporting to Vinay in his role as Chief Operating Officer for Horizon Moving Systems. In addition to being a brilliant person, Vinay leads selflessly and with unmatched dedication. He truly embodies our core values of Respect, Integrity, Compassion, Honesty, and Efficiency.", author: 'James Pedicone', role: 'Partner and ex-CoS · Design Pickle', program: 'Corporate Workshop' },
  { id: 3, avatar: 'T', text: "The excellent feedback from Swedish customers referred to Horizon Moving Systems provided a very good reason to meet Mr. Kulkarni. His valuable perspective and input for improvements to the executive strategy for SACCarizona.org has proven valuable for our continued expansion.", author: 'Tobias Lofstrand', role: 'Global Envoy Sweden at GPEC, Board Member SACC Arizona', program: 'Upadesha Academy' },
  { id: 4, avatar: 'J', text: "I have had the privilege of working with Vinay in our BCA organization in developing relationships with like titled business leaders and through that experience came to know of Vinay's vast experience in leadership and his uncanny ability to create a bottom-up and collaborative business culture.", author: 'Jim Perrine', role: 'CEO/President · Business Clubs America', program: '' },
];

function TestimonialsSection() {
  const [items, setItems] = useState(STATIC_ITEMS);
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef  = useRef(null);
  const pausedRef = useRef(false);

  // Fetch CMS cards; show only first HOME_COUNT
  useEffect(() => {
    getCards()
      .then(rows => { if (Array.isArray(rows) && rows.length) setItems(rows.slice(0, HOME_COUNT)); })
      .catch(() => {});
  }, []);

  // Reset carousel index when items change
  useEffect(() => { setCurrent(0); }, [items]);

  const goTo = useCallback((index) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => { setCurrent(index); setTransitioning(false); }, 320);
  }, [transitioning]);

  const next = useCallback(() => goTo((current + 1) % items.length), [current, goTo, items.length]);
  const prev = useCallback(() => goTo((current - 1 + items.length) % items.length), [current, goTo, items.length]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setCurrent(c => (c + 1) % items.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  const pause  = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  const item = items[current] || items[0];
  if (!item) return null;

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="testimonials-header reveal">
        <div className="section-label">Recommendation</div>
        <h2 className="section-title">Professional <em>Recommendations</em></h2>
      </div>

      <div className="testimonials-carousel"
        onMouseEnter={pause} onMouseLeave={resume}
        onTouchStart={pause} onTouchEnd={resume}>
        <button className="carousel-arrow carousel-prev" onClick={prev} aria-label="Previous testimonial">&#8592;</button>

        <div className={`testimonial-card${transitioning ? ' fading' : ''}`}>
          <div className="testimonial-quote-mark" aria-hidden="true">"</div>
          <blockquote className="testimonial-text">{item.text}</blockquote>
          <div className="testimonial-author">
            <div className="author-initial">{item.avatar}</div>
            <div className="author-info">
              <div className="author-name">{item.author}</div>
              <div className="author-role">{item.role}</div>
            </div>
          </div>
          <div className="testimonial-category">{item.program}</div>
        </div>

        <button className="carousel-arrow carousel-next" onClick={next} aria-label="Next testimonial">&#8594;</button>
      </div>

      <div className="carousel-dots" role="tablist" aria-label="Testimonial navigation">
        {items.map((_, i) => (
          <button key={i} role="tab" aria-selected={i === current}
            aria-label={`Testimonial ${i + 1}`}
            className={`carousel-dot${i === current ? ' active' : ''}`}
            onClick={() => goTo(i)} />
        ))}
      </div>

      <div className="testimonials-cta reveal">
        <Link to="/testimonials" className="testimonials-view-all">View All Recommendations</Link>
      </div>
    </section>
  );
}

export default TestimonialsSection;
