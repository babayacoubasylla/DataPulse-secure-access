export default function AlertFeed({ alerts }) {
  const fallback = [
    { id: 'a', message: 'Jumia baisse Galaxy S24 de 5.1%', channel: 'dashboard', status: 'sent' },
    { id: 'b', message: 'Villa 4 pièces Cocody sous 90M détectée', channel: 'email', status: 'sent' },
    { id: 'c', message: 'Ticket VIP Festival : stock limité', channel: 'whatsapp', status: 'sent' },
  ];

  return (
    <div className="ticker-list">
      {(alerts?.length ? alerts : fallback).slice(0, 4).map((alert) => (
        <div className="alert-row" key={alert.id}>
          <div className="badge">⚡</div>
          <p>{alert.message}<br /><em>{alert.channel} · {alert.status}</em></p>
          <span className="chip">actif</span>
        </div>
      ))}
    </div>
  );
}
