import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import footerLogo from '../../assets/Images/footer-logo-VK.png';
import './Footer.css';

const NAV_API = `${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/navigation`;

const STATIC_LINKS = [
  { label: 'Biography',            url: '/biography',           is_external: false },
  { label: 'Articles',             url: '/articles',            is_external: false },
  { label: 'Teaching',             url: '/teaching',            is_external: false },
  { label: 'Videos',               url: '/videos',              is_external: false },
  { label: 'Events',               url: '/events',              is_external: false },
  { label: 'Workshops & Retreats', url: '/workshops',           is_external: false },
  { label: 'Connect',              url: '/connect',             is_external: false },
  { label: 'Gallery',              url: '/gallery',             is_external: false },
  { label: 'Newsletter',           url: 'https://zcmp.in/xO0w', is_external: true  },
];

function Footer() {
  const [links, setLinks] = useState(STATIC_LINKS);

  useEffect(() => {
    fetch(NAV_API)
      .then(r => r.json())
      .then(data => { if (data.footer?.length) setLinks(data.footer); })
      .catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="footer-logo">
        <img src={footerLogo} alt="Vinay Kulkarni" className="footer-logo-img" />
      </div>
      <ul className="footer-nav">
        {links.map(link => (
          <li key={link.label}>
            {link.is_external ? (
              <a href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
            ) : (
              <Link to={link.url}>{link.label}</Link>
            )}
          </li>
        ))}
      </ul>
      <div className="footer-copy">© 2026 Vinay Kulkarni · All Rights Reserved</div>
    </footer>
  );
}

export default Footer;
