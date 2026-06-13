import { useState } from 'react';

const primaryNav = [
  { key: 'dashboard', label: 'Radar', icon: '◉' },
  { key: 'watchlist', label: 'Veille', icon: '◆' },
  { key: 'urls', label: 'URLs', icon: '⌬' },
  { key: 'scraping', label: 'Scraping', icon: '⌘' },
  { key: 'observations', label: 'Prix', icon: '◒' },
  { key: 'reports', label: 'Rapports', icon: '▣' },
];

const secondaryNav = [
  { key: 'alerts', label: 'Alertes', icon: '⚡' },
  { key: 'alert-rules', label: 'Règles', icon: '◎' },
  { key: 'sources', label: 'Sources', icon: '⌁' },
  { key: 'billing', label: 'Abonnement', icon: '◍' },
  { key: 'invoices', label: 'Factures', icon: '▤' },
  { key: 'team', label: 'Équipe', icon: '☷' },
  { key: 'settings', label: 'Paramètres', icon: '⚙' },
];

const adminNav = [
  { key: 'admin', label: 'Admin clients', icon: '♛' },
  { key: 'admin-billing', label: 'Admin billing', icon: '◈' },
];

export default function CommandDock({ page, onChange, currentUser }) {
  const [open, setOpen] = useState(false);

  const moreNav =
    currentUser?.role === 'platform_admin'
      ? [...secondaryNav, ...adminNav]
      : secondaryNav;

  const goTo = (key) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div className="dock-more-panel">
          <div className="dock-more-head">
            <b>Modules DataPulse</b>

            <button type="button" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="dock-more-grid">
            {moreNav.map((item) => (
              <button
                key={item.key}
                className={page === item.key ? 'active' : ''}
                onClick={() => goTo(item.key)}
              >
                <b>{item.icon}</b>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="command-dock compact" aria-label="Navigation principale">
        {primaryNav.map((item) => (
          <button
            key={item.key}
            className={page === item.key ? 'active' : ''}
            onClick={() => goTo(item.key)}
          >
            <b>{item.icon}</b>
            <span>{item.label}</span>
          </button>
        ))}

        <button
          className={open ? 'active' : ''}
          onClick={() => setOpen((current) => !current)}
        >
          <b>☰</b>
          <span>Plus</span>
        </button>
      </nav>
    </>
  );
}