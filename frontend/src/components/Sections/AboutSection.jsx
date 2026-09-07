import { useState } from 'react';
import aboutPhoto from '../../assets/Images/vinay-kulkarni-original.jpg';
import JourneyModal from '../UI/JourneyModal';
import { uploadUrl } from '../../services/apiUtils';
import './AboutSection.css';

const STATIC = {
  heading1:   'Thinker.',
  heading_em: 'Teacher.',
  heading2:   'Entrepreneur.',
  bio:  'Vinay Kulkarni brings over 25 years of global experience in business management and wellness as an entrepreneur, advisor, educator, and marketer. His focus spans business transformation and the meaningful integration of Dharmic principles into organizational practice. He created the Dharmic Enterprise Framework, a model that helps organizations align profit with purpose and evolve as Dharmic enterprises. In Bengaluru, he established a cultural center housing The Upadesha Academy (IKS based workshops & retreats), Darshana Books & Gifts (Indic), and Samvada Bistro—where he explores his passion for fusion cuisine blending traditional Indian and international flavors— alongside ventures including ALCHMI, Sanskritishaala (cultural workshops for children & youth), and Sanathani.com (Indic merchandise). Through this ecosystem, he works to embed Dharmic principles across business, education, and governance.',
  quote: 'Education is not merely the transfer of knowledge or acquisition of skills; it is a transformative process that aligns with one\'s Svabhava and Svadharma.',
  tags:  ['Dharmic Innovation', 'IKS', 'Vedanta', 'E-commerce Strategy', 'Meditation', 'Philosophy', 'Nation Building', 'Psychology'],
};

function AboutSection({ about }) {
  const [showModal, setShowModal] = useState(false);
  const d    = about || STATIC;
  const tags = d.tags || STATIC.tags;

  const photoSrc = d.media_url ? uploadUrl(d.media_url) : aboutPhoto;

  return (
    <section className="about" id="about">
      <div className="about-media reveal">
        <img src={photoSrc} alt="Vinay Kulkarni" className="about-photo" />
        <div className="about-photo-frame" />
        <div className="about-badge">
          <span className="devanagari">वि</span>
          <span>Vinay Ji</span>
        </div>
        <button className="about-journey-btn" onClick={() => setShowModal(true)}>
          {d.journey_btn_text || "Explore Vinay's Journey"}
        </button>
      </div>

      {showModal && (
        <JourneyModal
          pdfUrl={d.journey_pdf_url ? uploadUrl(d.journey_pdf_url) : '/leadership.pdf'}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="about-content">
        <div className="section-label reveal" style={{ color: '#de7336' }}>About</div>
        <h2 className="section-title reveal reveal-delay-1" style={{ color: '#8b2e33' }}>
          {d.heading1 || STATIC.heading1}{' '}
          <em style={{ color: '#de7336' }}>{d.heading_em || STATIC.heading_em}</em>
          <br />{d.heading2 || STATIC.heading2}
        </h2>

        <p className="about-bio reveal reveal-delay-2">{d.bio || STATIC.bio}</p>

        <blockquote className="about-quote reveal reveal-delay-3">
          "{d.quote || STATIC.quote}"
        </blockquote>

        <div className="about-tags reveal">
          {tags.map((tag) => {
            const text = tag.tag_text || tag;
            return (
              <span key={text} className="tag tag-accent">{text}</span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
