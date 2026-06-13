import { useMemo, useState } from 'react';

const emptyForm = {
    organization_id: '',
    amount: '',
    currency: 'XOF',
    due_in_days: 7,
    notes: '',
};

export default function AdminBillingPage({
    organizations,
    invoices,
    summary,
    onCreateInvoice,
    onMarkPaid,
    onChangeStatus,
}) {
    const [form, setForm] = useState(emptyForm);
    const [statusFilter, setStatusFilter] = useState('all');

    const organizationOptions = useMemo(() => {
        return organizations.map((organization) => ({
            id: organization.id,
            name: organization.name,
            plan: organization.subscription?.plan?.name || '—',
        }));
    }, [organizations]);

    const filteredInvoices = useMemo(() => {
        if (statusFilter === 'all') return invoices;

        return invoices.filter((invoice) => invoice.status === statusFilter);
    }, [invoices, statusFilter]);

    const update = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const submit = async (event) => {
        event.preventDefault();

        await onCreateInvoice({
            organization_id: Number(form.organization_id),
            amount: Number(form.amount),
            currency: form.currency,
            due_in_days: Number(form.due_in_days),
            notes: form.notes || null,
        });

        setForm(emptyForm);
    };

    const formatPrice = (amount, currency = 'XOF') => {
        return `${Number(amount || 0).toLocaleString('fr-FR')} ${currency}`;
    };

    const formatDate = (value) => {
        if (!value) return '—';

        return new Date(value).toLocaleDateString('fr-FR');
    };

    return (
        <section className="page-grid admin-billing-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">Revenue operations</span>

                    <h2>Admin facturation.</h2>

                    <p>
                        Crée des factures, suis les paiements manuels et prépare
                        l’intégration future Mobile Money, CinetPay, PayDunya ou Stripe.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{formatPrice(summary?.total_paid || 0)}</strong>
                    <span>encaissé</span>
                </div>
            </article>

            <article className="panel admin-kpis wide-panel">
                <div className="mini">
                    <strong>{formatPrice(summary?.total_invoiced || 0)}</strong>
                    <span>total facturé</span>
                </div>

                <div className="mini">
                    <strong>{formatPrice(summary?.total_paid || 0)}</strong>
                    <span>total payé</span>
                </div>

                <div className="mini">
                    <strong>{formatPrice(summary?.total_unpaid || 0)}</strong>
                    <span>impayé</span>
                </div>

                <div className="mini">
                    <strong>{summary?.invoices_count || 0}</strong>
                    <span>factures</span>
                </div>
            </article>

            <article className="panel form-panel">
                <h3>Créer une facture</h3>

                <form onSubmit={submit}>
                    <label>Organisation</label>

                    <select
                        value={form.organization_id}
                        onChange={(event) => update('organization_id', event.target.value)}
                        required
                    >
                        <option value="">Choisir un client</option>

                        {organizationOptions.map((organization) => (
                            <option value={organization.id} key={organization.id}>
                                {organization.name} · {organization.plan}
                            </option>
                        ))}
                    </select>

                    <label>Montant</label>

                    <input
                        type="number"
                        value={form.amount}
                        onChange={(event) => update('amount', event.target.value)}
                        placeholder="100000"
                        required
                    />

                    <label>Devise</label>

                    <select
                        value={form.currency}
                        onChange={(event) => update('currency', event.target.value)}
                    >
                        <option value="XOF">XOF</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                    </select>

                    <label>Échéance</label>

                    <select
                        value={form.due_in_days}
                        onChange={(event) => update('due_in_days', event.target.value)}
                    >
                        <option value="7">Dans 7 jours</option>
                        <option value="15">Dans 15 jours</option>
                        <option value="30">Dans 30 jours</option>
                    </select>

                    <label>Notes</label>

                    <input
                        value={form.notes}
                        onChange={(event) => update('notes', event.target.value)}
                        placeholder="Abonnement Business - Juin 2026"
                    />

                    <button className="btn primary" type="submit">
                        Créer la facture
                    </button>
                </form>
            </article>

            <article className="panel list-panel">
                <div className="module-head">
                    <div>
                        <h3>Factures clients</h3>
                        <span className="tag">suivi manuel V1</span>
                    </div>

                    <div className="filters">
                        {['all', 'unpaid', 'paid', 'overdue', 'cancelled'].map(
                            (status) => (
                                <button
                                    key={status}
                                    className={statusFilter === status ? 'active' : ''}
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status === 'all' ? 'Toutes' : status}
                                </button>
                            )
                        )}
                    </div>
                </div>

                <div className="invoice-table">
                    {filteredInvoices.map((invoice) => (
                        <div className="invoice-row admin-invoice-row" key={invoice.id}>
                            <div>
                                <b>{invoice.invoice_number}</b>

                                <span>
                                    {invoice.organization_name ||
                                        `Organisation #${invoice.organization_id}`}
                                </span>

                                <em>{invoice.notes || '—'}</em>
                            </div>

                            <strong>{formatPrice(invoice.amount, invoice.currency)}</strong>

                            <span
                                className={`status-badge ${invoice.status === 'paid'
                                    ? 'active'
                                    : invoice.status === 'overdue'
                                        ? 'failed'
                                        : 'paused'
                                    }`}
                            >
                                {invoice.status}
                            </span>

                            <em>Échéance : {formatDate(invoice.due_date)}</em>

                            <div className="row-actions">
                                {invoice.status !== 'paid' && (
                                    <button onClick={() => onMarkPaid(invoice.id)}>
                                        Marquer payée
                                    </button>
                                )}

                                <button onClick={() => onChangeStatus(invoice.id, 'overdue')}>
                                    Retard
                                </button>

                                <button onClick={() => onChangeStatus(invoice.id, 'cancelled')}>
                                    Annuler
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </article>
        </section>
    );
}