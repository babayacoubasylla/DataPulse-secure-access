import { useMemo, useState } from 'react';

const urlTypeLabels = {
    product_page: 'Page produit',
    category_page: 'Page catégorie',
    real_estate_listing: 'Annonce immobilière',
    event_page: 'Page événement',
    transport_route: 'Trajet transport',
    search_results_page: 'Résultats de recherche',
};

export default function UrlsPage({
    urls,
    items,
    competitors,
    onCreate,
    onUpdate,
    onDelete,
}) {
    const [editing, setEditing] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    const [form, setForm] = useState({
        tracked_item_id: '',
        competitor_id: '',
        url: '',
        url_type: 'product_page',
        refresh_frequency_hours: 24,
        status: 'active',
    });

    const itemById = useMemo(() => {
        return Object.fromEntries(items.map((item) => [item.id, item]));
    }, [items]);

    const competitorById = useMemo(() => {
        return Object.fromEntries(
            competitors.map((competitor) => [competitor.id, competitor])
        );
    }, [competitors]);

    const filteredUrls = useMemo(() => {
        if (filterStatus === 'all') return urls;

        return urls.filter((url) => url.status === filterStatus);
    }, [urls, filterStatus]);

    const updateForm = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const resetForm = () => {
        setEditing(null);

        setForm({
            tracked_item_id: '',
            competitor_id: '',
            url: '',
            url_type: 'product_page',
            refresh_frequency_hours: 24,
            status: 'active',
        });
    };

    const editUrl = (url) => {
        setEditing(url);

        setForm({
            tracked_item_id: url.tracked_item_id || '',
            competitor_id: url.competitor_id || '',
            url: url.url || '',
            url_type: url.url_type || 'product_page',
            refresh_frequency_hours: url.refresh_frequency_hours || 24,
            status: url.status || 'active',
        });
    };

    const submit = async (event) => {
        event.preventDefault();

        const payload = {
            organization_id: 1,
            tracked_item_id: Number(form.tracked_item_id),
            competitor_id: form.competitor_id
                ? Number(form.competitor_id)
                : null,
            url: form.url,
            url_type: form.url_type,
            refresh_frequency_hours: Number(form.refresh_frequency_hours),
            status: form.status,
        };

        if (editing) {
            await onUpdate(editing.id, payload);
        } else {
            await onCreate(payload);
        }

        resetForm();
    };

    return (
        <section className="page-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">Scraping control</span>
                    <h2>Les URLs que les workers Python vont surveiller.</h2>
                    <p>
                        Ici on relie une URL concrète à une surveillance et à un concurrent.
                        C’est le pont entre le dashboard et les futurs robots de scraping.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{urls.length}</strong>
                    <span>URLs</span>
                </div>
            </article>

            <article className="panel form-panel">
                <h3>{editing ? 'Modifier une URL' : 'Nouvelle URL surveillée'}</h3>

                <form onSubmit={submit}>
                    <label>Élément surveillé</label>
                    <select
                        value={form.tracked_item_id}
                        onChange={(event) =>
                            updateForm('tracked_item_id', event.target.value)
                        }
                        required
                    >
                        <option value="">Choisir une surveillance</option>

                        {items.map((item) => (
                            <option value={item.id} key={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <label>Concurrent associé</label>
                    <select
                        value={form.competitor_id}
                        onChange={(event) =>
                            updateForm('competitor_id', event.target.value)
                        }
                    >
                        <option value="">Aucun / source directe</option>

                        {competitors.map((competitor) => (
                            <option value={competitor.id} key={competitor.id}>
                                {competitor.name}
                            </option>
                        ))}
                    </select>

                    <label>URL à surveiller</label>
                    <input
                        value={form.url}
                        onChange={(event) => updateForm('url', event.target.value)}
                        placeholder="https://site-concurrent.com/produit"
                        required
                    />

                    <label>Type d’URL</label>
                    <select
                        value={form.url_type}
                        onChange={(event) => updateForm('url_type', event.target.value)}
                    >
                        <option value="product_page">Page produit</option>
                        <option value="category_page">Page catégorie</option>
                        <option value="real_estate_listing">Annonce immobilière</option>
                        <option value="event_page">Page événement</option>
                        <option value="transport_route">Trajet transport</option>
                        <option value="search_results_page">Résultats de recherche</option>
                    </select>

                    <label>Fréquence de rafraîchissement</label>
                    <select
                        value={form.refresh_frequency_hours}
                        onChange={(event) =>
                            updateForm('refresh_frequency_hours', event.target.value)
                        }
                    >
                        <option value="1">Toutes les heures</option>
                        <option value="6">Toutes les 6 heures</option>
                        <option value="12">Toutes les 12 heures</option>
                        <option value="24">Chaque jour</option>
                        <option value="168">Chaque semaine</option>
                    </select>

                    <label>Statut</label>
                    <select
                        value={form.status}
                        onChange={(event) => updateForm('status', event.target.value)}
                    >
                        <option value="active">Actif</option>
                        <option value="paused">En pause</option>
                        <option value="failed">Erreur</option>
                        <option value="archived">Archivé</option>
                    </select>

                    <div className="form-actions">
                        <button className="btn primary" type="submit">
                            {editing ? 'Enregistrer' : 'Brancher au worker'}
                        </button>

                        {editing && (
                            <button className="btn" type="button" onClick={resetForm}>
                                Annuler
                            </button>
                        )}
                    </div>
                </form>
            </article>

            <article className="panel list-panel">
                <div className="module-head">
                    <h3>URLs surveillées</h3>

                    <div className="filters">
                        {['all', 'active', 'paused', 'failed', 'archived'].map(
                            (status) => (
                                <button
                                    key={status}
                                    className={filterStatus === status ? 'active' : ''}
                                    onClick={() => setFilterStatus(status)}
                                >
                                    {status === 'all' ? 'Toutes' : status}
                                </button>
                            )
                        )}
                    </div>
                </div>

                <div className="watch-table">
                    {filteredUrls.map((monitoredUrl) => {
                        const item = itemById[monitoredUrl.tracked_item_id];
                        const competitor = competitorById[monitoredUrl.competitor_id];

                        return (
                            <div className="watch-row url-row" key={monitoredUrl.id}>
                                <div>
                                    <b>{item?.name || 'Surveillance inconnue'}</b>

                                    <span>
                                        {competitor?.name || 'Source directe'} ·{' '}
                                        {urlTypeLabels[monitoredUrl.url_type] ||
                                            monitoredUrl.url_type}
                                    </span>

                                    <a
                                        href={monitoredUrl.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {monitoredUrl.url}
                                    </a>
                                </div>

                                <strong>{monitoredUrl.refresh_frequency_hours}h</strong>

                                <span className={`status-badge ${monitoredUrl.status}`}>
                                    {monitoredUrl.status}
                                </span>

                                <div className="row-actions">
                                    <button onClick={() => editUrl(monitoredUrl)}>
                                        Modifier
                                    </button>

                                    <button onClick={() => onDelete(monitoredUrl.id)}>
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </article>
        </section>
    );
}