import { useState } from 'react';

export default function RegisterPage({ onRegister, onSwitchToLogin }) {
    const [form, setForm] = useState({
        organization_name: '',
        industry: 'mixed',
        full_name: '',
        email: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const update = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const submit = async (event) => {
        event.preventDefault();

        setError('');

        if (form.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        setLoading(true);

        try {
            await onRegister(form);
        } catch (err) {
            setError('Création impossible. Cet email est peut-être déjà utilisé.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-shell">
            <section className="auth-visual panel">
                <div className="logo" />

                <span className="kicker">Nouvelle organisation</span>

                <h1>Crée ton espace SaaS de veille tarifaire.</h1>

                <p>
                    Cette inscription crée une organisation cliente et un utilisateur
                    propriétaire. Plus tard, c’est ici que les abonnements seront
                    rattachés.
                </p>
            </section>

            <section className="auth-card panel">
                <h2>Créer un compte</h2>

                <p>Premier utilisateur = propriétaire de l’organisation.</p>

                <form onSubmit={submit}>
                    <label>Nom de l’organisation</label>

                    <input
                        value={form.organization_name}
                        onChange={(event) =>
                            update('organization_name', event.target.value)
                        }
                        placeholder="Ex: Agence Immo Prestige"
                        required
                    />

                    <label>Secteur principal</label>

                    <select
                        value={form.industry}
                        onChange={(event) => update('industry', event.target.value)}
                    >
                        <option value="mixed">Mixte</option>
                        <option value="ecommerce">E-commerce</option>
                        <option value="high_tech">High-Tech</option>
                        <option value="real_estate">Immobilier</option>
                        <option value="ticketing">Billetterie</option>
                    </select>

                    <label>Nom complet</label>

                    <input
                        value={form.full_name}
                        onChange={(event) => update('full_name', event.target.value)}
                        placeholder="Ton nom complet"
                        required
                    />

                    <label>Email</label>

                    <input
                        type="email"
                        value={form.email}
                        onChange={(event) => update('email', event.target.value)}
                        placeholder="toi@entreprise.com"
                        required
                    />

                    <label>Mot de passe</label>

                    <input
                        type="password"
                        value={form.password}
                        onChange={(event) => update('password', event.target.value)}
                        placeholder="8 caractères minimum"
                        required
                    />

                    {error && <div className="auth-error">{error}</div>}

                    <button className="btn primary" type="submit" disabled={loading}>
                        {loading ? 'Création...' : 'Créer mon espace'}
                    </button>
                </form>

                <button className="link-button" onClick={onSwitchToLogin}>
                    J’ai déjà un compte
                </button>
            </section>
        </main>
    );
}