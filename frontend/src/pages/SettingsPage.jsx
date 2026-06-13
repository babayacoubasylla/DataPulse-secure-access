import { useMemo } from 'react';

export default function SettingsPage({
    currentUser,
    subscriptionSummary,
    onLogout,
}) {
    const plan = subscriptionSummary?.subscription?.plan;

    const usage = subscriptionSummary?.usage || {
        tracked_items_count: 0,
        monitored_urls_count: 0,
    };

    const securityChecks = useMemo(() => {
        return [
            {
                title: 'Authentification active',
                description: 'Les pages internes nécessitent une session connectée.',
                status: 'ok',
            },
            {
                title: 'Token JWT',
                description:
                    'La session est transmise au backend via Authorization Bearer.',
                status: 'ok',
            },
            {
                title: 'Multi-tenant',
                description:
                    'Les données sont filtrées par organisation côté backend.',
                status: 'ok',
            },
            {
                title: 'Mot de passe oublié',
                description:
                    'À ajouter plus tard avec email de réinitialisation.',
                status: 'todo',
            },
        ];
    }, []);

    const formatLimit = (value, max) => {
        if (!max) return `${value} / —`;

        return `${Number(value || 0).toLocaleString('fr-FR')} / ${Number(
            max
        ).toLocaleString('fr-FR')}`;
    };

    return (
        <section className="page-grid settings-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">Account control</span>

                    <h2>Paramètres du compte.</h2>

                    <p>
                        Cette page centralise l’identité de l’utilisateur, son rôle, son
                        organisation, son abonnement et les informations de sécurité. Elle
                        préparera ensuite la gestion d’équipe.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{currentUser?.role || '—'}</strong>
                    <span>rôle</span>
                </div>
            </article>

            <article className="panel form-panel">
                <h3>Profil utilisateur</h3>

                <div className="settings-card-list">
                    <div className="settings-line">
                        <span>Nom complet</span>
                        <strong>{currentUser?.full_name || '—'}</strong>
                    </div>

                    <div className="settings-line">
                        <span>Email</span>
                        <strong>{currentUser?.email || '—'}</strong>
                    </div>

                    <div className="settings-line">
                        <span>Rôle</span>
                        <strong>{currentUser?.role || '—'}</strong>
                    </div>

                    <div className="settings-line">
                        <span>Organisation ID</span>
                        <strong>{currentUser?.organization_id || '—'}</strong>
                    </div>
                </div>

                <button
                    className="btn"
                    onClick={onLogout}
                    style={{
                        marginTop: 18,
                        width: '100%',
                    }}
                >
                    Déconnexion
                </button>
            </article>

            <article className="panel list-panel">
                <div className="module-head">
                    <div>
                        <h3>Abonnement</h3>
                        <span className="tag">plan et usage</span>
                    </div>
                </div>

                <div className="settings-plan-card">
                    <span>Plan actuel</span>

                    <strong>{plan?.name || 'Aucun plan'}</strong>

                    <em>
                        {plan
                            ? `${Number(plan.price_monthly).toLocaleString('fr-FR')} ${plan.currency
                            } / mois`
                            : 'Non configuré'}
                    </em>
                </div>

                <div className="settings-card-list">
                    <div className="settings-line">
                        <span>Surveillances utilisées</span>
                        <strong>
                            {formatLimit(
                                usage.tracked_items_count,
                                plan?.max_tracked_items
                            )}
                        </strong>
                    </div>

                    <div className="settings-line">
                        <span>URLs surveillées</span>
                        <strong>
                            {formatLimit(
                                usage.monitored_urls_count,
                                plan?.max_monitored_urls
                            )}
                        </strong>
                    </div>

                    <div className="settings-line">
                        <span>Refresh minimum</span>
                        <strong>{plan ? `${plan.refresh_frequency_hours}h` : '—'}</strong>
                    </div>

                    <div className="settings-line">
                        <span>Rapports PDF</span>
                        <strong>
                            {plan?.pdf_reports_enabled ? 'Activés' : 'Non inclus'}
                        </strong>
                    </div>
                </div>
            </article>

            <article className="panel wide-panel settings-security">
                <div className="module-head">
                    <div>
                        <h3>Sécurité et préparation production</h3>
                        <span className="tag">checklist technique</span>
                    </div>
                </div>

                <div className="security-grid">
                    {securityChecks.map((check) => (
                        <div className={`security-card ${check.status}`} key={check.title}>
                            <b>{check.title}</b>
                            <span>{check.description}</span>
                            <em>{check.status === 'ok' ? 'OK' : 'À faire'}</em>
                        </div>
                    ))}
                </div>
            </article>

            <article className="panel wide-panel settings-next">
                <h3>Prochaines évolutions prévues</h3>

                <div className="settings-roadmap">
                    <div>
                        <b>Gestion équipe</b>
                        <span>
                            Inviter des utilisateurs, changer les rôles, désactiver un compte.
                        </span>
                    </div>

                    <div>
                        <b>Mot de passe</b>
                        <span>
                            Changer le mot de passe et réinitialisation par email.
                        </span>
                    </div>

                    <div>
                        <b>Notifications</b>
                        <span>
                            Configurer email, WhatsApp et préférences de rapport.
                        </span>
                    </div>

                    <div>
                        <b>Clés API</b>
                        <span>
                            Créer des clés pour les clients Enterprise.
                        </span>
                    </div>
                </div>
            </article>
        </section>
    );
}