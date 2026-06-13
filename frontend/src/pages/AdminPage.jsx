import { useMemo, useState } from 'react';

const statusOptions = [
    'active',
    'trial',
    'suspended',
    'cancelled',
    'expired',
];

export default function AdminPage({
    organizations,
    plans,
    onChangePlan,
    onChangeStatus,
}) {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredOrganizations = useMemo(() => {
        return organizations.filter((organization) => {
            const matchesQuery = [
                organization.name,
                organization.email,
                organization.industry,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(query.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' || organization.status === statusFilter;

            return matchesQuery && matchesStatus;
        });
    }, [organizations, query, statusFilter]);

    const totalRevenue = organizations.reduce((sum, organization) => {
        if (organization.subscription?.status !== 'active') return sum;

        return sum + Number(organization.subscription?.plan?.price_monthly || 0);
    }, 0);

    const totalTrackedItems = organizations.reduce((sum, organization) => {
        return sum + Number(organization.usage?.tracked_items_count || 0);
    }, 0);

    const totalUrls = organizations.reduce((sum, organization) => {
        return sum + Number(organization.usage?.monitored_urls_count || 0);
    }, 0);

    return (
        <section className="page-grid admin-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">Owner command console</span>

                    <h2>Admin Console propriétaire.</h2>

                    <p>
                        Cet espace est réservé au propriétaire de DataPulse. Il permet de
                        voir les clients, suivre l’usage, changer les plans et suspendre les
                        comptes.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{organizations.length}</strong>
                    <span>clients</span>
                </div>
            </article>

            <article className="panel admin-kpis wide-panel">
                <div className="mini">
                    <strong>{organizations.length}</strong>
                    <span>organisations</span>
                </div>

                <div className="mini">
                    <strong>{totalRevenue.toLocaleString('fr-FR')}</strong>
                    <span>MRR actif estimé XOF</span>
                </div>

                <div className="mini">
                    <strong>{totalTrackedItems}</strong>
                    <span>surveillances totales</span>
                </div>

                <div className="mini">
                    <strong>{totalUrls}</strong>
                    <span>URLs totales</span>
                </div>
            </article>

            <article className="panel list-panel wide-panel">
                <div className="module-head">
                    <div>
                        <h3>Organisations clientes</h3>
                        <span className="tag">gestion commerciale et support</span>
                    </div>

                    <div className="admin-tools">
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Rechercher client..."
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="all">Tous statuts</option>

                            {statusOptions.map((status) => (
                                <option value={status} key={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="admin-table">
                    {filteredOrganizations.map((organization) => {
                        const plan = organization.subscription?.plan;
                        const usage = organization.usage || {};

                        return (
                            <div className="admin-row" key={organization.id}>
                                <div>
                                    <b>{organization.name}</b>
                                    <span>
                                        {organization.email || 'email non défini'} ·{' '}
                                        {organization.industry}
                                    </span>
                                    <em>{organization.users_count} utilisateur(s)</em>
                                </div>

                                <div>
                                    <b>{plan?.name || '—'}</b>
                                    <span>{organization.subscription?.status || '—'}</span>
                                    <em>
                                        {Number(plan?.price_monthly || 0).toLocaleString('fr-FR')}{' '}
                                        {plan?.currency || 'XOF'}/mois
                                    </em>
                                </div>

                                <div>
                                    <b>
                                        {usage.tracked_items_count || 0} /{' '}
                                        {plan?.max_tracked_items || 0}
                                    </b>
                                    <span>surveillances</span>
                                    <em>
                                        {usage.monitored_urls_count || 0} /{' '}
                                        {plan?.max_monitored_urls || 0} URLs
                                    </em>
                                </div>

                                <div className="admin-actions">
                                    <select
                                        value={plan?.code || 'starter'}
                                        onChange={(event) =>
                                            onChangePlan(organization.id, event.target.value)
                                        }
                                    >
                                        {plans.map((availablePlan) => (
                                            <option
                                                value={availablePlan.code}
                                                key={availablePlan.code}
                                            >
                                                {availablePlan.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={organization.status}
                                        onChange={(event) =>
                                            onChangeStatus(organization.id, event.target.value)
                                        }
                                    >
                                        {statusOptions.map((status) => (
                                            <option value={status} key={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </article>
        </section>
    );
}