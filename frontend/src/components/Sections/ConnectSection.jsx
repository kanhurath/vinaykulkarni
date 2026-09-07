import { useBookingModal } from '../../context/BookingModalContext';
import ContactForm from '../UI/ContactForm';
import './ConnectSection.css';

const STATIC_DESC  = 'Whether you seek to collaborate, explore ideas, or embark on a learning journey — Vinay welcomes thoughtful dialogue rooted in genuine inquiry.';
const STATIC_LINKS = [
  { id: 1, href: 'https://www.linkedin.com/in/vinkulkarni/', icon: 'in', label: 'LinkedIn' },
  { id: 2, href: 'https://x.com/aatmavalokana',             icon: '𝕏', label: '@aatmavalokana' },
  { id: 3, href: 'https://zcmp.in/xO0w',                    icon: '✉',  label: 'Subscribe to Newsletter' },
];

function ConnectSection({ connect }) {
  const { openModal } = useBookingModal();
  const desc  = connect?.description || STATIC_DESC;
  const links = connect?.links?.length ? connect.links : STATIC_LINKS;

  return (
    <section className="connect-section" id="connect">
      <div className="connect-left reveal">
        <div className="section-label">Connect</div>
        <h2 className="section-title">Begin a <em style={{ color: '#f3b33e' }}>Conversation</em></h2>
        <p className="connect-desc">{desc}</p>
        <div className="connect-links">
          <button className="connect-link connect-link-btn" onClick={openModal}>
            <span className="link-icon">◎</span>
            Book a Session
          </button>
          {links.map(link => (
            <a key={link.id || link.href} href={link.href} className="connect-link" target="_blank" rel="noreferrer">
              <span className="link-icon">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="connect-right reveal reveal-delay-1">
        <ContactForm />
      </div>
    </section>
  );
}

export default ConnectSection;
