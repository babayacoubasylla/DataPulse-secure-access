import AlertFeed from '../components/AlertFeed';

export default function AlertsPage({ alerts }) {
  return (
    <section className="page-grid">
      <article className="panel page-hero">
        <div>
          <span className="kicker">Signal intelligence</span>

          <h2>Les mouvements marché qui exigent une décision.</h2>

          <p>
            Les alertes sont maintenant créées automatiquement après scraping
            lorsqu’un prix passe sous la cible ou lorsqu’une règle est
            déclenchée.
          </p>
        </div>

        <div className="orb-stat">
          <strong>{alerts.length}</strong>
          <span>alertes</span>
        </div>
      </article>

      <article className="panel wide-panel">
        <h3>Flux d’alertes</h3>
        <AlertFeed alerts={alerts} />
      </article>

      <article className="panel module span4">
        <h3>Canaux</h3>

        <div className="cards single">
          <div className="mini">
            <strong>Email</strong>
            <span>rapports et règles lentes</span>
          </div>

          <div className="mini">
            <strong>WhatsApp</strong>
            <span>alertes critiques instantanées</span>
          </div>

          <div className="mini">
            <strong>Dashboard</strong>
            <span>centre d’opération</span>
          </div>
        </div>
      </article>
    </section>
  );
}