import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navigationLinks as staticLinks } from '../../data/contentConfig';
import { useBookingModal } from '../../context/BookingModalContext';
import logoImg from '../../assets/Images/hero-VinayJi-Logo-Txt-01_VK.png';
import './Header.css';

const NAV_API = `${import.meta.env.VITE_API_URL || 'https://vinaykulkarni.com/api'}/navigation`;

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [closedDropdown, setClosedDropdown] = useState(null);
  const [navigationLinks, setNavigationLinks] = useState(staticLinks);
  const location = useLocation();
  const navRef = useRef(null);

  useEffect(() => {
    fetch(NAV_API)
      .then(r => r.json())
      .then(data => {
        if (data.header?.length) {
          setNavigationLinks(data.header.map(item => ({
            id:       String(item.id),
            label:    item.label,
            path:     item.url,
            external: !!item.is_external,
            ...(item.children?.length ? {
              children: item.children.map(c => ({
                id:       String(c.id),
                label:    c.label,
                path:     c.url,
                external: !!c.is_external,
              })),
            } : {}),
          })));
        }
      })
      .catch(() => {}); // keep static fallback on error
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenSubmenu(null);
  }, [location]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setOpenSubmenu(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Close desktop submenu when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenSubmenu(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { openModal } = useBookingModal();

  const closeMenu = () => setIsMobileMenuOpen(false);
  const toggle    = () => setIsMobileMenuOpen((o) => !o);

  const toggleSubmenu = (id) =>
    setOpenSubmenu((current) => (current === id ? null : id));

  const isParentActive = (link) =>
    location.pathname === link.path ||
    (link.children && link.children.some((c) => location.pathname === c.path));

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mobile-backdrop${isMobileMenuOpen ? ' open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div
        className={`mobile-menu${isMobileMenuOpen ? ' open' : ''}`}
        role="dialog"
        aria-label="Navigation menu"
      >
        <div className="mobile-menu-header">
          <div className="mobile-menu-logo">
            <strong>Vinay Kulkarni</strong>
            Dharayati Iti Dharmaha
          </div>
          <button
            className="mobile-close"
            onClick={closeMenu}
            aria-label="Close menu"
          />
        </div>

        <div className="mobile-menu-body">
          {navigationLinks.map((link) => (
            <div key={link.id} className="mm-item-wrap">
              {link.children ? (
                <>
                  <button
                    className={`mmlink mmlink-parent${openSubmenu === link.id ? ' submenu-open' : ''}`}
                    onClick={() => toggleSubmenu(link.id)}
                    aria-expanded={openSubmenu === link.id}
                  >
                    {link.label}
                    <span className="mm-chevron" aria-hidden="true" />
                  </button>
                  <div className={`mm-submenu${openSubmenu === link.id ? ' open' : ''}`}>
                    <Link
                      to={link.path}
                      className="mmlink mmsub-link"
                      onClick={closeMenu}
                    >
                      All {link.label}
                    </Link>
                    {link.children.map((child) => (
                      <Link
                        key={child.id}
                        to={child.path}
                        className="mmlink mmsub-link"
                        onClick={closeMenu}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  to={link.path}
                  className="mmlink"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}

          <div className="mm-cta-wrap">
            <button
              className="mobile-cta-btn"
              onClick={() => { closeMenu(); openModal(); }}
            >
              Book a Session
            </button>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav ref={navRef} className={`navbar${isScrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="nav-logo">
          <img src={logoImg} alt="Vinay Kulkarni" className="nav-logo-img" />
        </Link>

        <ul className="nav-links">
          {navigationLinks.map((link) => (
            <li
              key={link.id}
              className={`${link.children ? 'has-submenu' : ''}${closedDropdown === link.id ? ' dropdown-closed' : ''}`}
              onMouseLeave={() => link.children && setClosedDropdown(null)}
            >
              <Link
                to={link.path}
                className={`nav-link${isParentActive(link) ? ' active' : ''}${link.children ? ' has-arrow' : ''}`}
                onClick={() => link.children && setClosedDropdown(link.id)}
              >
                {link.label}
              </Link>
              {link.children && (
                <ul className="nav-dropdown">
                  {link.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        to={child.path}
                        className={`nav-dropdown-link${location.pathname === child.path ? ' active' : ''}`}
                        onClick={() => setClosedDropdown(link.id)}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <button className="nav-cta" onClick={openModal}>
          Book a Session
        </button>

        <button
          className={`nav-hamburger${isMobileMenuOpen ? ' open' : ''}`}
          onClick={toggle}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
    </>
  );
}

export default Header;
