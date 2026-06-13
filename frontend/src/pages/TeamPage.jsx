import { useMemo, useState } from 'react';

const emptyForm = {
    full_name: '',
    email: '',
    password: '',
    role: 'viewer',
};

const roleLabels = {
    owner: 'Owner',
    admin: 'Admin',
    analyst: 'Analyste',
    viewer: 'Lecteur',
    platform_admin: 'Platform Admin',
};

export default function TeamPage({
    members,
    currentUser,
    onCreate,
    onUpdate,
    onDeactivate,
}) {
    const [form, setForm] = useState(emptyForm);
    const [roleFilter, setRoleFilter] = useState('all');
    const [error, setError] = useState('');

    const canManage = ['owner', 'admin', 'platform_admin'].includes(
        currentUser?.role
    );

    const filteredMembers = useMemo(() => {
        if (roleFilter === 'all') return members;

        return members.filter((member) => member.role === roleFilter);
    }, [members, roleFilter]);

    const update = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const submit = async (event) => {
        event.preventDefault();

        setError('');

        if (!canManage) {
            setError("Tu n'as pas le droit de gérer l'équipe.");
            return;
        }

        if (form.password.length < 8) {
            setError(
                'Le mot de passe temporaire doit contenir au moins 8 caractères.'
            );
            return;
        }

        try {
            await onCreate(form);
            setForm(emptyForm);
        } catch (err) {
            setError(
                "Impossible d'ajouter ce membre. L'email est peut-être déjà utilisé."
            );
        }
    };

    const changeRole = async (member, role) => {
        await onUpdate(member.id, {
            role,
        });
    };

    const toggleActive = async (member) => {
        await onUpdate(member.id, {
            is_active: !member.is_active,
        });
    };

    return (
        <section className="page-grid team-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">Team management</span>

                    <h2>Gestion équipe V1.</h2>

                    <p>
                        Ajoute des membres à l’organisation, attribue des rôles et désactive
                        les comptes. Les rôles préparent la gouvernance B2B : owner, admin,
                        analyst, viewer.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{members.length}</strong>
                    <span>membres</span>
                </div>
            </article>

            <article className="panel form-panel">
                <h3>Ajouter un membre</h3>

                {!canManage && (
                    <div className="auth-error" style={{ marginTop: 14 }}>
                        Ton rôle actuel ne permet pas d’ajouter un membre.
                    </div>
                )}

                <form onSubmit={submit}>
                    <label>Nom complet</label>

                    <input
                        value={form.full_name}
                        onChange={(event) => update('full_name', event.target.value)}
                        placeholder="Ex: Awa Koné"
                        required
                        disabled={!canManage}
                    />

                    <label>Email</label>

                    <input
                        type="email"
                        value={form.email}
                        onChange={(event) => update('email', event.target.value)}
                        placeholder="awa@entreprise.com"
                        required
                        disabled={!canManage}
                    />

                    <label>Mot de passe temporaire</label>

                    <input
                        type="password"
                        value={form.password}
                        onChange={(event) => update('password', event.target.value)}
                        placeholder="8 caractères minimum"
                        required
                        disabled={!canManage}
                    />

                    <label>Rôle</label>

                    <select
                        value={form.role}
                        onChange={(event) => update('role', event.target.value)}
                        disabled={!canManage}
                    >
                        <option value="viewer">Lecteur</option>
                        <option value="analyst">Analyste</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                    </select>

                    {error && <div className="auth-error">{error}</div>}

                    <button className="btn primary" type="submit" disabled={!canManage}>
                        Ajouter le membre
                    </button>
                </form>
            </article>

            <article className="panel list-panel">
                <div className="module-head">
                    <div>
                        <h3>Membres de l’organisation</h3>
                        <span className="tag">rôles et accès</span>
                    </div>

                    <div className="filters">
                        {['all', 'owner', 'admin', 'analyst', 'viewer'].map((role) => (
                            <button
                                key={role}
                                className={roleFilter === role ? 'active' : ''}
                                onClick={() => setRoleFilter(role)}
                            >
                                {role === 'all' ? 'Tous' : roleLabels[role]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="team-table">
                    {filteredMembers.map((member) => (
                        <div className="team-row" key={member.id}>
                            <div>
                                <b>{member.full_name}</b>
                                <span>{member.email}</span>

                                {member.id === currentUser?.id && <em>Compte actuel</em>}
                            </div>

                            <span
                                className={`status-badge ${member.is_active ? 'active' : 'archived'
                                    }`}
                            >
                                {member.is_active ? 'actif' : 'inactif'}
                            </span>

                            <select
                                value={member.role}
                                onChange={(event) => changeRole(member, event.target.value)}
                                disabled={
                                    !canManage ||
                                    member.id === currentUser?.id ||
                                    member.role === 'platform_admin'
                                }
                            >
                                <option value="viewer">Lecteur</option>
                                <option value="analyst">Analyste</option>
                                <option value="admin">Admin</option>
                                <option value="owner">Owner</option>

                                {member.role === 'platform_admin' && (
                                    <option value="platform_admin">Platform Admin</option>
                                )}
                            </select>

                            <div className="row-actions">
                                <button
                                    disabled={!canManage || member.id === currentUser?.id}
                                    onClick={() => toggleActive(member)}
                                >
                                    {member.is_active ? 'Désactiver' : 'Réactiver'}
                                </button>

                                <button
                                    disabled={!canManage || member.id === currentUser?.id}
                                    onClick={() => onDeactivate(member.id)}
                                >
                                    Supprimer accès
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </article>
        </section>
    );
}