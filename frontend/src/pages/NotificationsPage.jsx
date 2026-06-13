import { useEffect, useState } from 'react';

const STORAGE_KEY = 'datapulse_notification_settings';

const defaultSettings = {
    whatsapp_enabled: false,
    whatsapp_provider: 'meta_cloud_api',
    whatsapp_phone: '',
    email_enabled: true,
    report_frequency: 'weekly',
};

export default function NotificationsPage({ alerts, alertRules }) {
    const [settings, setSettings] = useState(defaultSettings);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (raw) {
            setSettings({
                ...defaultSettings,
                ...JSON.parse(raw),
            });
        }
    }, []);

    const update = (key, value) => {
        setSettings((current) => ({
            ...current,
            [key]: value,
        }));

        setSaved(false);
    };

    const save = (event) => {
        event.preventDefault();

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(settings)
        );

        setSaved(true);
    };

    return (
        <section className="page-grid notifications-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">WhatsApp Ops</span>

                    <h2>Centre notifications.</h2>

                    <p>
                        Configure les préférences Email/WhatsApp et prépare l’intégration
                        réelle. L’envoi WhatsApp en production passera par Meta Cloud API,
                        Twilio ou un fournisseur local autorisé.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{settings.whatsapp_enabled ? 'ON' : 'OFF'}</strong>
                    <span>WhatsApp</span>
                </div>
            </article>

            <article className="panel form-panel">
                <h3>Configuration notifications</h3>

                <form onSubmit={save}>
                    <label className="check-line">
                        <input
                            type="checkbox"
                            checked={settings.email_enabled}
                            onChange={(event) =>
                                update('email_enabled', event.target.checked)
                            }
                        />
                        Activer les notifications Email
                    </label>

                    <label className="check-line">
                        <input
                            type="checkbox"
                            checked={settings.whatsapp_enabled}
                            onChange={(event) =>
                                update('whatsapp_enabled', event.target.checked)
                            }
                        />
                        Activer WhatsApp Ops
                    </label>

                    <label>Fournisseur WhatsApp</label>

                    <select
                        value={settings.whatsapp_provider}
                        onChange={(event) =>
                            update('whatsapp_provider', event.target.value)
                        }
                    >
                        <option value="meta_cloud_api">Meta Cloud API</option>
                        <option value="twilio">Twilio WhatsApp</option>
                        <option value="local_provider">Fournisseur local</option>
                    </select>

                    <label>Numéro WhatsApp opérationnel</label>

                    <input
                        value={settings.whatsapp_phone}
                        onChange={(event) =>
                            update('whatsapp_phone', event.target.value)
                        }
                        placeholder="Ex: +2250700000000"
                    />

                    <label>Fréquence rapports</label>

                    <select
                        value={settings.report_frequency}
                        onChange={(event) =>
                            update('report_frequency', event.target.value)
                        }
                    >
                        <option value="daily">Quotidien</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuel</option>
                    </select>

                    <button className="btn primary" type="submit">
                        Enregistrer la configuration
                    </button>

                    {saved && (
                        <div
                            className="auth-error"
                            style={{
                                borderColor: 'rgba(98,255,168,.4)',
                                background: 'rgba(98,255,168,.12)',
                                color: 'var(--green)',
                            }}
                        >
                            Configuration enregistrée localement.
                        </div>
                    )}
                </form>
            </article>

            <article className="panel list-panel">
                <div className="module-head">
                    <div>
                        <h3>État opérationnel</h3>
                        <span className="tag">alertes et règles</span>
                    </div>
                </div>

                <div className="settings-card-list">
                    <div className="settings-line">
                        <span>Alertes récentes</span>
                        <strong>{alerts.length}</strong>
                    </div>

                    <div className="settings-line">
                        <span>Règles actives</span>
                        <strong>
                            {alertRules.filter((rule) => rule.is_active).length}
                        </strong>
                    </div>

                    <div className="settings-line">
                        <span>Email</span>
                        <strong>
                            {settings.email_enabled ? 'Activé' : 'Désactivé'}
                        </strong>
                    </div>

                    <div className="settings-line">
                        <span>WhatsApp</span>
                        <strong>
                            {settings.whatsapp_enabled ? 'Préconfiguré' : 'Non activé'}
                        </strong>
                    </div>
                </div>

                <div className="report-preview" style={{ marginTop: 18 }}>
                    <h4>Note production</h4>
                    <p>
                        Pour envoyer réellement sur WhatsApp, il faudra ajouter les clés API
                        dans le backend, valider les templates et brancher un provider
                        officiel.
                    </p>
                </div>
            </article>
        </section>
    );
}