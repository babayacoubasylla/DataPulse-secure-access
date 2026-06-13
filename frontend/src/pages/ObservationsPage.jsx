import { useMemo, useState } from 'react';

export default function ObservationsPage({ observations, items, competitors }) {
    const [query, setQuery] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');

    const itemById = useMemo(() => {
        return Object.fromEntries(items.map((item) => [item.id, item]));
    }, [items]);

    const competitorById = useMemo(() => {
        return Object.fromEntries(
            competitors.map((competitor) => [competitor.id, competitor])
        );
    }, [competitors]);

    const filteredObservations = useMemo(() => {
        return observations.filter((observation) => {
            const item = itemById[observation.tracked_item_id];
            const competitor = competitorById[observation.competitor_id];

            const searchable = [
                item?.name,
                item?.category,
                item?.brand,
                competitor?.name,
                observation.availability_status,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesQuery = searchable.includes(query.toLowerCase());

            const matchesAvailability =
                availabilityFilter === 'all' ||
                observation.availability_status === availabilityFilter;

            return matchesQuery && matchesAvailability;
        });
    }, [
        observations,
        itemById,
        competitorById,
        query,
        availabilityFilter,
    ]);

    const latestObservation = filteredObservations[0];

    const averagePrice = filteredObservations.length
        ? filteredObservations.reduce((sum, observation) => {
            return sum + Number(observation.observed_price || 0);
        }, 0) / filteredObservations.length
        : 0;

    const formatPrice = (value, currency = 'XOF') => {
        if (!value) return '—';

        return `${Number(value).toLocaleString('fr-FR')} ${currency}`;
    };

    return (
        <section className="page-grid observations-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">Real market data</span>

                    <h2>Historique réel des prix collectés.</h2>

                    <p>
                        Chaque scraping réussi crée une observation. C’est cette donnée qui
                        alimentera les courbes, les alertes automatiques, les rapports PDF
                        et les recommandations tarifaires.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{observations.length}</strong>
                    <span>observations</span>
                </div>
            </article>

            <article className="panel admin-kpis wide-panel">
                <div className="mini">
                    <strong>{filteredObservations.length}</strong>
                    <span>observations filtrées</span>
                </div>

                <div className="mini">
                    <strong>{formatPrice(averagePrice)}</strong>
                    <span>prix moyen observé</span>
                </div>

                <div className="mini">
                    <strong>
                        {latestObservation
                            ? formatPrice(
                                latestObservation.observed_price,
                                latestObservation.currency
                            )
                            : '—'}
                    </strong>
                    <span>dernier prix</span>
                </div>

                <div className="mini">
                    <strong>
                        {latestObservation
                            ? new Date(latestObservation.observed_at).toLocaleDateString(
                                'fr-FR'
                            )
                            : '—'}
                    </strong>
                    <span>dernière collecte</span>
                </div>
            </article>

            <article className="panel list-panel wide-panel">
                <div className="module-head">
                    <div>
                        <h3>Observations de prix</h3>
                        <span className="tag">données enregistrées par le scraping</span>
                    </div>

                    <div className="admin-tools">
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Rechercher produit, concurrent..."
                        />

                        <select
                            value={availabilityFilter}
                            onChange={(event) => setAvailabilityFilter(event.target.value)}
                        >
                            <option value="all">Toutes disponibilités</option>
                            <option value="available">available</option>
                            <option value="limited_stock">limited_stock</option>
                            <option value="out_of_stock">out_of_stock</option>
                            <option value="unknown">unknown</option>
                        </select>
                    </div>
                </div>

                <div className="observations-table">
                    {filteredObservations.length === 0 && (
                        <p style={{ color: 'var(--muted)' }}>
                            Aucune observation pour le moment. Lance un scraping réussi pour
                            alimenter cette page.
                        </p>
                    )}

                    {filteredObservations.map((observation) => {
                        const item = itemById[observation.tracked_item_id];
                        const competitor = competitorById[observation.competitor_id];

                        return (
                            <div className="observation-row" key={observation.id}>
                                <div>
                                    <b>{item?.name || 'Élément inconnu'}</b>

                                    <span>
                                        {competitor?.name || 'Source directe'} ·{' '}
                                        {item?.category || 'non classé'}
                                    </span>
                                </div>

                                <strong>
                                    {formatPrice(observation.observed_price, observation.currency)}
                                </strong>

                                <span
                                    className={`status-badge ${observation.availability_status}`}
                                >
                                    {observation.availability_status}
                                </span>

                                <em>
                                    {new Date(observation.observed_at).toLocaleString('fr-FR')}
                                </em>
                            </div>
                        );
                    })}
                </div>
            </article>
        </section>
    );
}