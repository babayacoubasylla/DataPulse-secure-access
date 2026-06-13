import { useState } from 'react';

export default function SourcesPage({ competitors, onCreate, onDelete }) {
  const [form, setForm] = useState({ name: '', website_url: '', industry: 'mixed' });
  const submit = async (e) => { e.preventDefault(); await onCreate({ ...form, organization_id: 1 }); setForm({ name: '', website_url: '', industry: 'mixed' }); };
  return (
    <section className="page-grid">
      <article className="panel page-hero"><div><span className="kicker">Sources concurrentielles</span><h2>Les sites et acteurs que tes workers vont surveiller.</h2><p>Ajoute des concurrents par secteur. Les URLs de scraping seront reliées ensuite à ces sources.</p></div><div className="orb-stat"><strong>{competitors.length}</strong><span>sources</span></div></article>
      <article className="panel form-panel"><h3>Nouveau concurrent</h3><form onSubmit={submit}><label>Nom</label><input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required placeholder="Ex: Jumia CI"/><label>Site web</label><input value={form.website_url} onChange={(e)=>setForm({...form,website_url:e.target.value})} placeholder="https://..."/><label>Secteur</label><select value={form.industry} onChange={(e)=>setForm({...form,industry:e.target.value})}><option value="mixed">Mixte</option><option value="ecommerce">E-commerce</option><option value="high_tech">High-Tech</option><option value="real_estate">Immobilier</option><option value="ticketing">Billetterie</option></select><button className="btn primary">Ajouter source</button></form></article>
      <article className="panel list-panel"><h3>Concurrents enregistrés</h3><div className="watch-table">{competitors.map((c)=><div className="watch-row" key={c.id}><div><b>{c.name}</b><span>{c.website_url || 'URL non définie'} · {c.industry}</span></div><strong>actif</strong><div className="row-actions"><button onClick={()=>onDelete(c.id)}>Supprimer</button></div></div>)}</div></article>
    </section>
  );
}
