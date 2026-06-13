import { useMemo, useState } from 'react';

export default function ScrapingPage({
    urls,
    items,
    competitors,
    results,
    onRunUrl,
    onRunActive,
}) {
    const [runningId, setRunningId] = useState(null);
    const [runningAll, setRunningAll] = useState(false);

    const itemById = useMemo(() => {
        return Object.fromEntries(items.map((item) => [item.id, item]));
    }, [items]);

    const competitorById = useMemo(() => {
        return Object.fromEntries(
            competitors.map((competitor) => [competitor.id, competitor])
        );
    }, [competitors]);

    const activeUrls = urls.filter((url) => url.status === 'active');
    const failedUrls = urls.filter((url) => url.status === 'failed');

    const runOne = async (urlId) => {
        setRunningId(urlId);

        try {
            await onRunUrl(urlId);
        } finally {
            setRunningId(null);
        }
    };

    const runActive = async () => {
        setRunningAll(true);

        try {
            await onRunActive();
        } finally {
            setRunningAll(false);
        }
    };

    return (
        <section className="page-grid scraping-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">Python workers V1</span>

                    <h2>Scraping réel contrôlé.</h2>

                    <p>
                        Cette première version visite les URLs actives, tente d'extraire un
                        prix et crée une observation. Elle fonctionne bien sur les pages HTML
                        simples. Pour les sites très dynamiques, on passera ensuite à
                        Playwright.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{activeUrls.length}</strong>
                    <span>URLs actives</span>
                </div>
            </article>

            <article className="panel admin-kpis wide-panel">
                <div className="mini">
                    <strong>{urls.length}</strong>
                    <span>URLs configurées</span>
                </div>

                <div className="mini">
                    <strong>{activeUrls.length}</strong>
                    <span>URLs actives</span>
                </div>

                <div className="mini">
                    <strong>{failedUrls.length}</strong>
                    <span>URLs en erreur</span>
                </div>

                <div className="mini">
                    <strong>{results.length}</strong>
                    <span>résultats récents</span>
                </div>
            </article>

            <article className="panel list-panel wide-panel">
                <div className="module-head">
                    <div>
                        <h3>File de scraping</h3>
                        <span className="tag">déclenchement manuel V1</span>
                    </div>

                    <button
                        className="btn primary"
                        onClick={runActive}
                        disabled={runningAll || activeUrls.length === 0}
                    >
                        {runningAll ? 'Scraping en cours...' : 'Scraper les URLs actives'}
                    </button>
                </div>

                <div className="admin-table">
                    {urls.map((monitoredUrl) => {
                        const item = itemById[monitoredUrl.tracked_item_id];
                        const competitor = competitorById[monitoredUrl.competitor_id];

                        return (
                            <div className="admin-row scrape-row" key={monitoredUrl.id}>
                                <div>
                                    <b>{item?.name || 'Surveillance inconnue'}</b>

                                    <span>
                                        {competitor?.name || 'Source directe'} ·{' '}
                                        {monitoredUrl.url_type}
                                    </span>

                                    <a
                                        href={monitoredUrl.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {monitoredUrl.url}
                                    </a>
                                </div>

                                <div>
                                    <b>{monitoredUrl.status}</b>
                                    <span>Fréquence : {monitoredUrl.refresh_frequency_hours}h</span>
                                    <em>
                                        Dernier scrape :{' '}
                                        {monitoredUrl.last_scraped_at
                                            ? new Date(monitoredUrl.last_scraped_at).toLocaleString(
                                                'fr-FR'
                                            )
                                            : 'jamais'}
                                    </em>
                                </div>

                                <div className="admin-actions single-action">
                                    <button
                                        className="btn"
                                        onClick={() => runOne(monitoredUrl.id)}
                                        disabled={runningId === monitoredUrl.id}
                                    >
                                        {runningId === monitoredUrl.id ? 'Analyse...' : 'Scraper'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </article>

            <article className="panel list-panel wide-panel">
                <div className="module-head">
                    <div>
                        <h3>Résultats récents</h3>
                        <span className="tag">prix extraits et erreurs</span>
                    </div>
                </div>

                <div className="scrape-results">
                    {results.length === 0 && (
                        <p style={{ color: 'var(--muted)' }}>
                            Aucun scraping lancé depuis cette session.
                        </p>
                    )}

                    {results.map((result, index) => (
                        <div
                            className={`scrape-result ${result.success ? 'success' : 'failed'
                                }`}
                            key={`${result.monitored_url_id}-${index}`}
                        >
                            <div>
                                <b>{result.success ? 'Prix détecté' : 'Erreur'}</b>
                                <span>{result.title || result.url}</span>
                                {result.error && <em>{result.error}</em>}
                            </div>

                            <strong>
                                {result.price
                                    ? `${Number(result.price).toLocaleString('fr-FR')} ${result.currency
                                    }`
                                    : '—'}
                            </strong>

                            <span
                                className={`status-badge ${result.success ? 'active' : 'failed'
                                    }`}
                            >
                                {result.availability_status || 'unknown'} ·{' '}
                                {result.alerts_created || 0} alerte(s)
                            </span>
                        </div>
                    ))}
                </div>
            </article>
        </section>
    );
}