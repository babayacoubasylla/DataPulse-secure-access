export default function BillingPage({ subscriptionSummary, plans }) {
    const current = subscriptionSummary?.subscription;

    const usage = subscriptionSummary?.usage || {
        tracked_items_count: 0,
        monitored_urls_count: 0,
    };

    const currentPlan = current?.plan;

    const percent = (value, max) => {
        if (!max) return 0;
        return Math.min(100, Math.round((value / max) * 100));
    };

    return (
        <section className="page-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">SaaS revenue control</span>

                    <h2>Abonnement, limites et rentabilité.</h2>

                    <p>
                        Cette page montre le plan actif du client, son usage réel et les
                        offres disponibles. Plus tard, elle sera reliée au paiement Mobile
                        Money, CinetPay, PayDunya ou Stripe.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{currentPlan?.name || '—'}</strong>
                    <span>{current?.status || 'aucun plan'}</span>
                </div>
            </article>

            <article className="panel form-panel">
                <h3>Plan actuel</h3>

                {currentPlan ? (
                    <div className="billing-current">
                        <strong>{currentPlan.name}</strong>

                        <span>
                            {Number(currentPlan.price_monthly).toLocaleString('fr-FR')}{' '}
                            {currentPlan.currency} / mois
                        </span>

                        <div className="usage-block">
                            <div className="usage-line">
                                <b>Surveillances</b>
                                <em>
                                    {usage.tracked_items_count} /{' '}
                                    {currentPlan.max_tracked_items}
                                </em>
                            </div>

                            <div className="usage-bar">
                                <i
                                    style={{
                                        width: `${percent(
                                            usage.tracked_items_count,
                                            currentPlan.max_tracked_items
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="usage-block">
                            <div className="usage-line">
                                <b>URLs surveillées</b>
                                <em>
                                    {usage.monitored_urls_count} /{' '}
                                    {currentPlan.max_monitored_urls}
                                </em>
                            </div>

                            <div className="usage-bar">
                                <i
                                    style={{
                                        width: `${percent(
                                            usage.monitored_urls_count,
                                            currentPlan.max_monitored_urls
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <p style={{ color: 'var(--muted)' }}>Aucun abonnement actif.</p>
                )}
            </article>

            <article className="panel list-panel">
                <div className="module-head">
                    <h3>Plans disponibles</h3>
                    <span className="tag">Starter / Business / Enterprise</span>
                </div>

                <div className="plans-grid">
                    {plans.map((plan) => (
                        <div
                            className={`plan-card ${currentPlan?.code === plan.code ? 'active' : ''
                                }`}
                            key={plan.id}
                        >
                            <span>{plan.name}</span>

                            <strong>
                                {Number(plan.price_monthly).toLocaleString('fr-FR')}{' '}
                                {plan.currency}
                            </strong>

                            <em>/ mois</em>

                            <ul>
                                <li>
                                    {plan.max_tracked_items.toLocaleString('fr-FR')}{' '}
                                    surveillances
                                </li>
                                <li>
                                    {plan.max_monitored_urls.toLocaleString('fr-FR')} URLs
                                </li>
                                <li>Refresh toutes les {plan.refresh_frequency_hours}h</li>
                                <li>Email : {plan.email_alerts_enabled ? 'Oui' : 'Non'}</li>
                                <li>
                                    WhatsApp : {plan.whatsapp_alerts_enabled ? 'Oui' : 'Non'}
                                </li>
                                <li>PDF : {plan.pdf_reports_enabled ? 'Oui' : 'Non'}</li>
                                <li>API : {plan.api_access_enabled ? 'Oui' : 'Non'}</li>
                            </ul>

                            <button className="btn primary" disabled>
                                {currentPlan?.code === plan.code
                                    ? 'Plan actuel'
                                    : 'Paiement bientôt'}
                            </button>
                        </div>
                    ))}
                </div>
            </article>
        </section>
    );
}