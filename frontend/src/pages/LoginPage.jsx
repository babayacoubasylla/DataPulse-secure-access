import { useState } from 'react';

export default function LoginPage({ onLogin, onSwitchToRegister }) {
    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            await onLogin(form);
        } catch (err) {
            setError('Connexion impossible. Vérifie ton email et ton mot de passe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-shell">
            <section className="auth-visual panel">
                <div className="logo" />

                <span className="kicker">DataPulse secure access</span>

                <h1>Connecte-toi à ton centre de contrôle marché.</h1>

                <p>
                    Chaque entreprise dispose de son propre espace sécurisé, de ses
                    surveillances, de ses concurrents et de ses futures règles
                    d’abonnement.
                </p>
            </section>

            <section className="auth-card panel">
                <h2>Connexion</h2>

                <p>Accède à ton dashboard DataPulse.</p>

                <form onSubmit={submit}>
                    <label>Email</label>

                    <input
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                email: event.target.value,
                            })
                        }
                        placeholder="toi@entreprise.com"
                        required
                    />

                    <label>Mot de passe</label>

                    <input
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                password: event.target.value,
                            })
                        }
                        placeholder="••••••••"
                        required
                    />

                    {error && <div className="auth-error">{error}</div>}

                    <button className="btn primary" type="submit" disabled={loading}>
                        {loading ? 'Connexion...' : 'Entrer dans DataPulse'}
                    </button>
                </form>

                <button className="link-button" onClick={onSwitchToRegister}>
                    Pas encore de compte ? Créer une organisation
                </button>
            </section>
        </main>
    );
}