import RadarMarket from '../components/RadarMarket';
import SectorDock from '../components/SectorDock';
import ScoreRing from '../components/ScoreRing';
import AlertFeed from '../components/AlertFeed';
import PriceWave from '../components/PriceWave';
import HeatMap from '../components/HeatMap';

export default function DashboardPage({ summary, alerts, items, sectors, activeSector, setActiveSector }) {
  const active = sectors[activeSector] || sectors[0];
  return (
    <>
      <section className="hero">
        <article className="panel radar-wrap">
          <div className="topline">
            <div>
              <div className="kicker">Radar concurrentiel vivant</div>
              <div className="big"><span>{active.name}</span><br /><b>{active.change > 0 ? '+' : ''}{active.change}%</b> <span>shift</span></div>
            </div>
            <div className="live"><i /> Workers Python actifs</div>
          </div>
          <RadarMarket activeSector={activeSector} sectors={sectors} />
          <SectorDock sectors={sectors} activeSector={activeSector} onSelect={setActiveSector} />
        </article>

        <aside className="right-stack">
          <article className="panel metric"><h3>Indice de compétitivité</h3><ScoreRing score={summary?.competitiveness_score || 82} /></article>
          <article className="panel ticker"><div className="module-head"><h3>Alertes intelligentes</h3><span className="tag">temps réel</span></div><AlertFeed alerts={alerts} /></article>
        </aside>
      </section>

      <section className="modules">
        <article className="panel module span7">
          <div className="module-head"><div><h3>Historique augmenté des prix</h3><span className="tag">comparaison 90 jours</span></div></div>
          <PriceWave activeSector={activeSector} />
          <div className="cards">
            <div className="mini"><strong>{Math.round((summary?.average_observed_price || 485000) / 1000)}k</strong><span>prix moyen observé</span></div>
            <div className="mini"><strong>{summary?.items_tracked || items.length || 184}</strong><span>éléments surveillés</span></div>
            <div className="mini"><strong>{summary?.alerts_today || alerts.length || 7}</strong><span>menaces détectées</span></div>
          </div>
        </article>
        <article className="panel module span5"><div className="module-head"><div><h3>Carte de pression marché</h3><span className="tag">zones / catégories chaudes</span></div></div><HeatMap /></article>
        <article className="panel module span4"><div className="module-head"><h3>Règles d’alerte</h3><span className="tag">automatisation</span></div><div className="rules"><div className="rule"><div><b>Baisse concurrent direct</b><span>Si prix descend sous cible</span></div><i /></div><div className="rule"><div><b>Rupture de stock</b><span>Opportunité de marge</span></div><i /></div><div className="rule"><div><b>Nouvelle annonce premium</b><span>Cocody, Songon, Marcory</span></div><i /></div></div></article>
        <article className="panel module span4"><div className="module-head"><h3>Workers Python</h3><span className="tag">scraping queue</span></div><div className="cards single"><div className="mini"><strong>{summary?.urls_monitored || 248}</strong><span>URLs programmées</span></div><div className="mini"><strong>99.2%</strong><span>taux d’extraction valide</span></div></div></article>
        <article className="panel module span4"><div className="module-head"><h3>Surveillances récentes</h3><span className="tag">base active</span></div><div className="item-list">{items.slice(0, 4).map((item) => <span key={item.id}>{item.name}<em>{item.item_type}</em></span>)}</div></article>
      </section>
    </>
  );
}
