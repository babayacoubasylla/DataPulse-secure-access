import { useMemo, useState } from 'react';

const labels = { high_tech: 'High-Tech', ecommerce: 'E-commerce', real_estate: 'Immobilier', ticketing: 'Billetterie' };

export default function WatchlistPage({ items, onCreate, onUpdate, onDelete }) {
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ item_type: 'high_tech', name: '', category: '', brand: '', target_price: '' });

  const filtered = useMemo(() => filter === 'all' ? items : items.filter((i) => i.item_type === filter), [items, filter]);

  const reset = () => { setEditing(null); setForm({ item_type: 'high_tech', name: '', category: '', brand: '', target_price: '' }); };
  const edit = (item) => { setEditing(item); setForm({ item_type: item.item_type, name: item.name, category: item.category || '', brand: item.brand || '', target_price: item.target_price || '' }); };
  const submit = async (event) => {
    event.preventDefault();
    const payload = { ...form, organization_id: 1, currency: 'XOF', target_price: form.target_price ? Number(form.target_price) : null };
    if (editing) await onUpdate(editing.id, payload); else await onCreate(payload);
    reset();
  };

  return (
    <section className="page-grid">
      <article className="panel page-hero">
        <div><span className="kicker">Watchlist opérationnelle</span><h2>Tout ce que DataPulse surveille pour toi.</h2><p>Ajoute, filtre, modifie ou supprime tes produits, annonces immobilières et tickets suivis.</p></div>
        <div className="orb-stat"><strong>{items.length}</strong><span>éléments actifs</span></div>
      </article>

      <article className="panel form-panel">
        <h3>{editing ? 'Modifier une surveillance' : 'Nouvelle surveillance'}</h3>
        <form onSubmit={submit}>
          <label>Secteur</label><select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })}><option value="high_tech">High-Tech</option><option value="ecommerce">E-commerce</option><option value="real_estate">Immobilier</option><option value="ticketing">Billetterie</option></select>
          <label>Nom</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: MacBook Pro M3" />
          <label>Catégorie</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="laptop, villa, concert..." />
          <label>Marque / zone</label><input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Apple, Cocody..." />
          <label>Prix cible</label><input type="number" value={form.target_price} onChange={(e) => setForm({ ...form, target_price: e.target.value })} placeholder="750000" />
          <div className="form-actions"><button className="btn primary">{editing ? 'Enregistrer' : 'Activer'}</button>{editing && <button type="button" className="btn" onClick={reset}>Annuler</button>}</div>
        </form>
      </article>

      <article className="panel list-panel">
        <div className="module-head"><h3>Surveillances</h3><div className="filters">{['all','high_tech','ecommerce','real_estate','ticketing'].map((f) => <button key={f} className={filter===f?'active':''} onClick={() => setFilter(f)}>{f==='all'?'Tous':labels[f]}</button>)}</div></div>
        <div className="watch-table">
          {filtered.map((item) => <div className="watch-row" key={item.id}><div><b>{item.name}</b><span>{labels[item.item_type] || item.item_type} · {item.category || 'non classé'} · {item.brand || '—'}</span></div><strong>{item.target_price ? Number(item.target_price).toLocaleString('fr-FR') + ' XOF' : '—'}</strong><div className="row-actions"><button onClick={() => edit(item)}>Modifier</button><button onClick={() => onDelete(item.id)}>Supprimer</button></div></div>)}
        </div>
      </article>
    </section>
  );
}
