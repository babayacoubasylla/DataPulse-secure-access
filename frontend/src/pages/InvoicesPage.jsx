export default function InvoicesPage({ invoices }) {
    const totalUnpaid = invoices
        .filter((invoice) => ['unpaid', 'overdue'].includes(invoice.status))
        .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);

    const totalPaid = invoices
        .filter((invoice) => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);

    const formatPrice = (amount, currency = 'XOF') => {
        return `${Number(amount || 0).toLocaleString('fr-FR')} ${currency}`;
    };

    const formatDate = (value) => {
        if (!value) return '—';

        return new Date(value).toLocaleDateString('fr-FR');
    };

    return (
        <section className="page-grid invoices-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">Billing center</span>

                    <h2>Factures et paiements.</h2>

                    <p>
                        Consulte les factures de ton organisation, les montants dus, les
                        paiements enregistrés et les échéances. Le paiement en ligne sera
                        branché plus tard.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{invoices.length}</strong>
                    <span>factures</span>
                </div>
            </article>

            <article className="panel admin-kpis wide-panel">
                <div className="mini">
                    <strong>{invoices.length}</strong>
                    <span>factures totales</span>
                </div>

                <div className="mini">
                    <strong>{formatPrice(totalUnpaid)}</strong>
                    <span>reste à payer</span>
                </div>

                <div className="mini">
                    <strong>{formatPrice(totalPaid)}</strong>
                    <span>déjà payé</span>
                </div>

                <div className="mini">
                    <strong>
                        {invoices.filter((invoice) => invoice.status === 'overdue').length}
                    </strong>
                    <span>en retard</span>
                </div>
            </article>

            <article className="panel list-panel wide-panel">
                <div className="module-head">
                    <div>
                        <h3>Mes factures</h3>
                        <span className="tag">historique de facturation</span>
                    </div>
                </div>

                <div className="invoice-table">
                    {invoices.length === 0 && (
                        <p style={{ color: 'var(--muted)' }}>
                            Aucune facture pour le moment.
                        </p>
                    )}

                    {invoices.map((invoice) => (
                        <div className="invoice-row" key={invoice.id}>
                            <div>
                                <b>{invoice.invoice_number}</b>
                                <span>{invoice.notes || 'Abonnement DataPulse'}</span>
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
                        </div>
                    ))}
                </div>
            </article>
        </section>
    );
}