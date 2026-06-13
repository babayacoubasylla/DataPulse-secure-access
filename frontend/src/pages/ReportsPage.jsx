import { useEffect, useState } from 'react';

import { api } from '../services/api';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = async (periodDays = days) => {
    setLoading(true);
    setError('');

    try {
      const data = await api.marketSummaryReport(periodDays);
      setReport(data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le rapport. Vérifie que le backend est lancé et que la route reports existe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(7);
  }, []);

  const printReport = () => {
    window.print();
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('fr-FR');
  };

  const formatPrice = (value, currency = 'XOF') => {
    if (!value) return '—';
    return `${Number(value).toLocaleString('fr-FR')} ${currency}`;
  };

  return (
    <section className="page-grid reports-grid">
      <article className="panel page-hero no-print">
        <div>
          <span className="kicker">Executive reports</span>

          <h2>Rapports PDF / HTML pour dirigeants.</h2>

          <p>
            Génère un rapport imprimable contenant les observations récentes,
            les alertes importantes et les recommandations. Utilise le bouton
            imprimer pour l’enregistrer en PDF.
          </p>
        </div>

        <div className="orb-stat">
          <strong>PDF</strong>
          <span>export</span>
        </div>
      </article>

      <article className="panel report-toolbar no-print">
        <div>
          <h3>Paramètres du rapport</h3>
          <span className="tag">période d’analyse</span>
        </div>

        <div className="report-actions">
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value="7">7 derniers jours</option>
            <option value="14">14 derniers jours</option>
            <option value="30">30 derniers jours</option>
          </select>

          <button
            className="btn"
            onClick={() => loadReport(days)}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>

          <button
            className="btn primary"
            onClick={printReport}
            disabled={!report}
          >
            Imprimer / Exporter PDF
          </button>
        </div>
      </article>

      <article className="panel report-document wide-panel">
        {error && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!report && !error && (
          <p style={{ color: 'var(--muted)' }}>Chargement du rapport...</p>
        )}

        {report && (
          <>
            <div className="report-cover">
              <span>DataPulse Market Intelligence</span>

              <h1>{report.title}</h1>

              <p>
                {report.organization.name} · {report.organization.industry}
              </p>

              <em>
                Période : {formatDate(report.period.start)} →{' '}
                {formatDate(report.period.end)}
              </em>
            </div>

            <div className="report-section">
              <h2>Résumé exécutif</h2>

              <div className="report-kpis">
                <div>
                  <strong>{report.summary.tracked_items_count}</strong>
                  <span>surveillances</span>
                </div>

                <div>
                  <strong>{report.summary.monitored_urls_count}</strong>
                  <span>URLs surveillées</span>
                </div>

                <div>
                  <strong>{report.summary.observations_count}</strong>
                  <span>observations</span>
                </div>

                <div>
                  <strong>{report.summary.alerts_count}</strong>
                  <span>alertes</span>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>Indicateurs de prix</h2>

              <div className="report-price-grid">
                <p>
                  <b>Prix moyen :</b>{' '}
                  {formatPrice(
                    report.summary.average_price,
                    report.summary.currency
                  )}
                </p>

                <p>
                  <b>Prix minimum :</b>{' '}
                  {formatPrice(
                    report.summary.min_price,
                    report.summary.currency
                  )}
                </p>

                <p>
                  <b>Prix maximum :</b>{' '}
                  {formatPrice(
                    report.summary.max_price,
                    report.summary.currency
                  )}
                </p>
              </div>
            </div>

            <div className="report-section">
              <h2>Alertes récentes</h2>

              <div className="report-list">
                {report.recent_alerts.length === 0 && (
                  <p>Aucune alerte récente.</p>
                )}

                {report.recent_alerts.map((alert) => (
                  <div className="report-list-row" key={alert.id}>
                    <b>{alert.item_name}</b>
                    <span>{alert.message}</span>
                    <em>
                      {formatDate(alert.created_at)} · {alert.channel}
                    </em>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-section">
              <h2>Dernières observations</h2>

              <div className="report-list">
                {report.recent_observations.length === 0 && (
                  <p>Aucune observation récente.</p>
                )}

                {report.recent_observations.map((observation) => (
                  <div className="report-list-row" key={observation.id}>
                    <b>{observation.item_name}</b>
                    <span>
                      {formatPrice(
                        observation.observed_price,
                        observation.currency
                      )}{' '}
                      · {observation.availability_status}
                    </span>
                    <em>{formatDate(observation.observed_at)}</em>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-section">
              <h2>Recommandations</h2>

              <ul className="report-recommendations">
                {report.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>

            <footer className="report-footer">
              Rapport généré le {formatDate(report.generated_at)} par DataPulse.
            </footer>
          </>
        )}
      </article>
    </section>
  );
}