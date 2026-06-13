import { useEffect, useMemo, useState } from 'react';

import { api, clearToken, getToken, setToken } from './services/api';

import CommandDock from './components/CommandDock';
import WatchDrawer from './components/WatchDrawer';

import DashboardPage from './pages/DashboardPage';
import WatchlistPage from './pages/WatchlistPage';
import AlertsPage from './pages/AlertsPage';
import AlertRulesPage from './pages/AlertRulesPage';
import SourcesPage from './pages/SourcesPage';
import UrlsPage from './pages/UrlsPage';
import ReportsPage from './pages/ReportsPage';
import ScrapingPage from './pages/ScrapingPage';
import ObservationsPage from './pages/ObservationsPage';
import BillingPage from './pages/BillingPage';
import InvoicesPage from './pages/InvoicesPage';
import AdminBillingPage from './pages/AdminBillingPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import TeamPage from './pages/TeamPage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const defaultSectors = [
  {
    key: 'ecommerce',
    name: 'E-commerce',
    score: 78,
    change: -4.2,
    color: '#ffcf5a',
  },
  {
    key: 'high_tech',
    name: 'High-Tech',
    score: 84,
    change: -2.1,
    color: '#59dcff',
  },
  {
    key: 'real_estate',
    name: 'Immobilier',
    score: 71,
    change: 5.7,
    color: '#62ffa8',
  },
  {
    key: 'ticketing',
    name: 'Billetterie',
    score: 89,
    change: 8.4,
    color: '#ff4fd8',
  },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [authPage, setAuthPage] = useState('login');

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [items, setItems] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [monitoredUrls, setMonitoredUrls] = useState([]);
  const [subscriptionSummary, setSubscriptionSummary] = useState(null);
  const [plans, setPlans] = useState([]);
  const [adminOrganizations, setAdminOrganizations] = useState([]);
  const [scrapingResults, setScrapingResults] = useState([]);
  const [observations, setObservations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [adminInvoices, setAdminInvoices] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  const [activeSector, setActiveSector] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('connexion...');

  const sectors = useMemo(() => {
    const apiSectors = summary?.sectors?.length
      ? summary.sectors
      : defaultSectors;

    return apiSectors.map((sector, index) => ({
      ...defaultSectors[index],
      ...sector,
    }));
  }, [summary]);

  const load = async (userOverride = currentUser) => {
    try {
      const [
        dashboard,
        alertRows,
        ruleRows,
        trackedRows,
        competitorRows,
        urlRows,
        subscriptionRows,
        planRows,
        observationRows,
        invoiceRows,
        teamRows,
      ] = await Promise.all([
        api.dashboard(),
        api.alerts(),
        api.alertRules(),
        api.trackedItems(),
        api.competitors(),
        api.monitoredUrls(),
        api.currentSubscription(),
        api.subscriptionPlans(),
        api.observations(),
        api.billingInvoices(),
        api.teamMembers(),
      ]);

      setSummary(dashboard);
      setAlerts(alertRows);
      setAlertRules(ruleRows);
      setItems(trackedRows);
      setCompetitors(competitorRows);
      setMonitoredUrls(urlRows);
      setSubscriptionSummary(subscriptionRows);
      setPlans(planRows);
      setObservations(observationRows);
      setInvoices(invoiceRows);
      setTeamMembers(teamRows);

      if (userOverride?.role === 'platform_admin') {
        const [adminRows, adminInvoiceRows, billingSummaryRows] = await Promise.all([
          api.adminOrganizations(),
          api.billingAdminInvoices(),
          api.billingAdminSummary(),
        ]);

        setAdminOrganizations(adminRows);
        setAdminInvoices(adminInvoiceRows);
        setBillingSummary(billingSummaryRows);
      }

      setApiStatus('API connectée');
    } catch (error) {
      console.error(error);
      setApiStatus('API indisponible');
    }
  };

  const bootstrapAuth = async () => {
    const token = getToken();

    if (!token) {
      setAuthLoading(false);
      return;
    }

    try {
      const user = await api.me();

      setCurrentUser(user);

      await load(user);
    } catch (error) {
      clearToken();
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    bootstrapAuth();
  }, []);

  const handleLogin = async (payload) => {
    const response = await api.login(payload);

    setToken(response.access_token);
    setCurrentUser(response.user);

    await load(response.user);
  };

  const handleRegister = async (payload) => {
    const response = await api.register(payload);

    setToken(response.access_token);
    setCurrentUser(response.user);

    await load(response.user);
  };

  const logout = () => {
    clearToken();
    setCurrentUser(null);
    setPage('dashboard');
    setAuthPage('login');
  };

  const createTrackedItem = async (payload) => {
    await api.createTrackedItem(payload);
    await load();
  };

  const updateTrackedItem = async (id, payload) => {
    await api.updateTrackedItem(id, payload);
    await load();
  };

  const deleteTrackedItem = async (id) => {
    if (confirm('Supprimer cette surveillance ?')) {
      await api.deleteTrackedItem(id);
      await load();
    }
  };

  const createCompetitor = async (payload) => {
    await api.createCompetitor(payload);
    await load();
  };

  const deleteCompetitor = async (id) => {
    if (confirm('Supprimer ce concurrent ?')) {
      await api.deleteCompetitor(id);
      await load();
    }
  };

  const createMonitoredUrl = async (payload) => {
    await api.createMonitoredUrl(payload);
    await load();
  };

  const updateMonitoredUrl = async (id, payload) => {
    await api.updateMonitoredUrl(id, payload);
    await load();
  };

  const deleteMonitoredUrl = async (id) => {
    if (confirm('Supprimer cette URL surveillée ?')) {
      await api.deleteMonitoredUrl(id);
      await load();
    }
  };

  const changeOrganizationPlan = async (organizationId, planCode) => {
    await api.adminChangeOrganizationPlan(organizationId, {
      plan_code: planCode,
      subscription_status: 'active',
    });

    await load();
  };

  const changeOrganizationStatus = async (organizationId, status) => {
    await api.adminChangeOrganizationStatus(organizationId, {
      status,
    });

    await load();
  };

  const runScrapeUrl = async (urlId) => {
    const result = await api.runScrapeUrl(urlId);

    setScrapingResults((current) => [result, ...current].slice(0, 20));

    await load();
  };

  const runScrapeActive = async () => {
    const response = await api.runScrapeActive(10);

    setScrapingResults((current) => [
      ...response.results,
      ...current,
    ].slice(0, 20));

    await load();
  };

  const createAlertRule = async (payload) => {
    await api.createAlertRule(payload);
    await load();
  };

  const updateAlertRule = async (id, payload) => {
    await api.updateAlertRule(id, payload);
    await load();
  };

  const deleteAlertRule = async (id) => {
    if (confirm('Supprimer cette règle ?')) {
      await api.deleteAlertRule(id);
      await load();
    }
  };

  const createInvoice = async (payload) => {
    await api.billingCreateInvoice(payload);
    await load();
  };

  const markInvoicePaid = async (id) => {
    await api.billingMarkInvoicePaid(id, {
      provider: 'manual',
    });

    await load();
  };

  const changeInvoiceStatus = async (id, status) => {
    await api.billingUpdateInvoiceStatus(id, {
      status,
    });

    await load();
  };

  const createTeamMember = async (payload) => {
    await api.createTeamMember(payload);
    await load();
  };

  const updateTeamMember = async (id, payload) => {
    await api.updateTeamMember(id, payload);
    await load();
  };

  const deactivateTeamMember = async (id) => {
    if (confirm('Désactiver ce membre ?')) {
      await api.deactivateTeamMember(id);
      await load();
    }
  };

  if (authLoading) {
    return (
      <div className="boot-screen">
        <div className="logo" />
        <p>Chargement sécurisé...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <div className="orbs" />
        <div className="grain" />

        {authPage === 'login' ? (
          <LoginPage
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthPage('register')}
          />
        ) : (
          <RegisterPage
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthPage('login')}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="orbs" />
      <div className="grain" />

      <main className="shell with-dock">
        <header>
          <div className="brand">
            <div className="logo" />

            <div>
              <h1>DataPulse</h1>
              <p>
                Market Command Center — intelligence tarifaire multi-secteurs
              </p>
            </div>
          </div>

          <div className="actions">
            <span className="status-pill">{apiStatus}</span>

            <span className="status-pill">
              {currentUser.full_name} · {currentUser.role}
            </span>

            <button className="btn">Exporter PDF</button>
            <button className="btn" onClick={() => setPage('notifications')}>
              WhatsApp Ops
            </button>

            <button
              className="btn primary"
              onClick={() => setDrawerOpen((current) => !current)}
            >
              Nouvelle surveillance
            </button>

            <button className="btn" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </header>

        {page === 'dashboard' && (
          <DashboardPage
            summary={summary}
            alerts={alerts}
            items={items}
            sectors={sectors}
            activeSector={activeSector}
            setActiveSector={setActiveSector}
          />
        )}

        {page === 'watchlist' && (
          <WatchlistPage
            items={items}
            onCreate={createTrackedItem}
            onUpdate={updateTrackedItem}
            onDelete={deleteTrackedItem}
          />
        )}

        {page === 'alerts' && <AlertsPage alerts={alerts} />}

        {page === 'alert-rules' && (
          <AlertRulesPage
            rules={alertRules}
            items={items}
            onCreate={createAlertRule}
            onUpdate={updateAlertRule}
            onDelete={deleteAlertRule}
          />
        )}

        {page === 'urls' && (
          <UrlsPage
            urls={monitoredUrls}
            items={items}
            competitors={competitors}
            onCreate={createMonitoredUrl}
            onUpdate={updateMonitoredUrl}
            onDelete={deleteMonitoredUrl}
          />
        )}

        {page === 'sources' && (
          <SourcesPage
            competitors={competitors}
            onCreate={createCompetitor}
            onDelete={deleteCompetitor}
          />
        )}

        {page === 'scraping' && (
          <ScrapingPage
            urls={monitoredUrls}
            items={items}
            competitors={competitors}
            results={scrapingResults}
            onRunUrl={runScrapeUrl}
            onRunActive={runScrapeActive}
          />
        )}

        {page === 'observations' && (
          <ObservationsPage
            observations={observations}
            items={items}
            competitors={competitors}
          />
        )}

        {page === 'reports' && <ReportsPage />}

        {page === 'billing' && (
          <BillingPage
            subscriptionSummary={subscriptionSummary}
            plans={plans}
          />
        )}

        {page === 'invoices' && (
          <InvoicesPage invoices={invoices} />
        )}

        {page === 'team' && (
          <TeamPage
            members={teamMembers}
            currentUser={currentUser}
            onCreate={createTeamMember}
            onUpdate={updateTeamMember}
            onDeactivate={deactivateTeamMember}
          />
        )}

        {page === 'notifications' && (
          <NotificationsPage
            alerts={alerts}
            alertRules={alertRules}
          />
        )}

        {page === 'admin-billing' && currentUser.role === 'platform_admin' && (
          <AdminBillingPage
            organizations={adminOrganizations}
            invoices={adminInvoices}
            summary={billingSummary}
            onCreateInvoice={createInvoice}
            onMarkPaid={markInvoicePaid}
            onChangeStatus={changeInvoiceStatus}
          />
        )}

        {page === 'settings' && (
          <SettingsPage
            currentUser={currentUser}
            subscriptionSummary={subscriptionSummary}
            onLogout={logout}
          />
        )}

        {page === 'admin' && currentUser.role === 'platform_admin' && (
          <AdminPage
            organizations={adminOrganizations}
            plans={plans}
            onChangePlan={changeOrganizationPlan}
            onChangeStatus={changeOrganizationStatus}
          />
        )}
      </main>

      <CommandDock
        page={page}
        onChange={setPage}
        currentUser={currentUser}
      />

      <button
        className="fab"
        onClick={() => setDrawerOpen((current) => !current)}
      >
        +
      </button>

      <WatchDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreate={createTrackedItem}
      />
    </>
  );
}