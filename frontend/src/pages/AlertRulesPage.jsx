import { useMemo, useState } from 'react';

const emptyForm = {
    tracked_item_id: '',
    rule_name: '',
    rule_type: 'price_below',
    threshold_value: '',
    channel: 'dashboard',
    is_active: true,
};

const ruleTypeLabels = {
    price_below: 'Prix inférieur ou égal',
    price_above: 'Prix supérieur ou égal',
    stock_out: 'Rupture de stock',
    stock_available: 'Stock disponible',
};

const channelLabels = {
    dashboard: 'Dashboard',
    email: 'Email',
    whatsapp: 'WhatsApp',
    email_and_whatsapp: 'Email + WhatsApp',
};

export default function AlertRulesPage({
    rules,
    items,
    onCreate,
    onUpdate,
    onDelete,
}) {
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const [error, setError] = useState('');

    const itemById = useMemo(() => {
        return Object.fromEntries(items.map((item) => [item.id, item]));
    }, [items]);

    const filteredRules = useMemo(() => {
        if (typeFilter === 'all') return rules;

        return rules.filter((rule) => rule.rule_type === typeFilter);
    }, [rules, typeFilter]);

    const updateForm = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const reset = () => {
        setEditing(null);
        setError('');
        setForm(emptyForm);
    };

    const editRule = (rule) => {
        setEditing(rule);
        setError('');

        setForm({
            tracked_item_id: rule.tracked_item_id || '',
            rule_name: rule.rule_name || '',
            rule_type: rule.rule_type || 'price_below',
            threshold_value: rule.threshold_value ?? '',
            channel: rule.channel || 'dashboard',
            is_active: Boolean(rule.is_active),
        });
    };

    const submit = async (event) => {
        event.preventDefault();

        setError('');

        const needsThreshold = ['price_below', 'price_above'].includes(
            form.rule_type
        );

        if (needsThreshold && !form.threshold_value) {
            setError('Cette règle nécessite une valeur seuil.');
            return;
        }

        const payload = {
            tracked_item_id: form.tracked_item_id
                ? Number(form.tracked_item_id)
                : null,
            rule_name: form.rule_name,
            rule_type: form.rule_type,
            threshold_value: needsThreshold ? Number(form.threshold_value) : null,
            channel: form.channel,
            is_active: form.is_active,
        };

        if (editing) {
            await onUpdate(editing.id, payload);
        } else {
            await onCreate(payload);
        }

        reset();
    };

    return (
        <section className="page-grid alert-rules-grid">
            <article className="panel page-hero">
                <div>
                    <span className="kicker">Alert automation</span>

                    <h2>Règles d’alerte intelligentes.</h2>

                    <p>
                        Crée des règles personnalisées qui seront évaluées après chaque
                        scraping réussi : prix sous seuil, prix au-dessus d’un seuil,
                        rupture de stock ou retour en disponibilité.
                    </p>
                </div>

                <div className="orb-stat">
                    <strong>{rules.length}</strong>
                    <span>règles</span>
                </div>
            </article>

            <article className="panel form-panel">
                <h3>{editing ? 'Modifier une règle' : 'Nouvelle règle'}</h3>

                <form onSubmit={submit}>
                    <label>Nom de la règle</label>

                    <input
                        value={form.rule_name}
                        onChange={(event) => updateForm('rule_name', event.target.value)}
                        placeholder="Ex: Alerte prix sous 260 000"
                        required
                    />

                    <label>Surveillance concernée</label>

                    <select
                        value={form.tracked_item_id}
                        onChange={(event) =>
                            updateForm('tracked_item_id', event.target.value)
                        }
                    >
                        <option value="">Toutes les surveillances</option>

                        {items.map((item) => (
                            <option value={item.id} key={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <label>Type de règle</label>

                    <select
                        value={form.rule_type}
                        onChange={(event) => updateForm('rule_type', event.target.value)}
                    >
                        <option value="price_below">Prix inférieur ou égal</option>
                        <option value="price_above">Prix supérieur ou égal</option>
                        <option value="stock_out">Rupture de stock</option>
                        <option value="stock_available">Stock disponible</option>
                    </select>

                    {['price_below', 'price_above'].includes(form.rule_type) && (
                        <>
                            <label>Valeur seuil</label>

                            <input
                                type="number"
                                value={form.threshold_value}
                                onChange={(event) =>
                                    updateForm('threshold_value', event.target.value)
                                }
                                placeholder="260000"
                            />
                        </>
                    )}

                    <label>Canal</label>

                    <select
                        value={form.channel}
                        onChange={(event) => updateForm('channel', event.target.value)}
                    >
                        <option value="dashboard">Dashboard</option>
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email_and_whatsapp">Email + WhatsApp</option>
                    </select>

                    <label className="check-line">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) => updateForm('is_active', event.target.checked)}
                        />
                        Règle active
                    </label>

                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-actions">
                        <button className="btn primary" type="submit">
                            {editing ? 'Enregistrer' : 'Créer la règle'}
                        </button>

                        {editing && (
                            <button className="btn" type="button" onClick={reset}>
                                Annuler
                            </button>
                        )}
                    </div>
                </form>
            </article>

            <article className="panel list-panel">
                <div className="module-head">
                    <div>
                        <h3>Règles configurées</h3>
                        <span className="tag">évaluées après chaque observation</span>
                    </div>

                    <div className="filters">
                        {[
                            'all',
                            'price_below',
                            'price_above',
                            'stock_out',
                            'stock_available',
                        ].map((type) => (
                            <button
                                key={type}
                                className={typeFilter === type ? 'active' : ''}
                                onClick={() => setTypeFilter(type)}
                            >
                                {type === 'all' ? 'Toutes' : ruleTypeLabels[type]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rules-table">
                    {filteredRules.length === 0 && (
                        <p style={{ color: 'var(--muted)' }}>
                            Aucune règle pour le moment. Crée une règle pour automatiser les
                            alertes.
                        </p>
                    )}

                    {filteredRules.map((rule) => {
                        const item = itemById[rule.tracked_item_id];

                        return (
                            <div className="alert-rule-row" key={rule.id}>
                                <div>
                                    <b>{rule.rule_name}</b>

                                    <span>
                                        {item?.name || 'Toutes les surveillances'} ·{' '}
                                        {ruleTypeLabels[rule.rule_type] || rule.rule_type}
                                    </span>
                                </div>

                                <strong>
                                    {rule.threshold_value
                                        ? `${Number(rule.threshold_value).toLocaleString(
                                            'fr-FR'
                                        )} XOF`
                                        : '—'}
                                </strong>

                                <span
                                    className={`status-badge ${rule.is_active ? 'active' : 'archived'
                                        }`}
                                >
                                    {rule.is_active ? 'active' : 'inactive'} ·{' '}
                                    {channelLabels[rule.channel] || rule.channel}
                                </span>

                                <div className="row-actions">
                                    <button onClick={() => editRule(rule)}>Modifier</button>
                                    <button onClick={() => onDelete(rule.id)}>Supprimer</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </article>
        </section>
    );
}