import { useState } from 'react';

const emptyForm = {
  item_type: 'high_tech',
  name: '',
  category: '',
  brand: '',
  target_price: '',
};

export default function WatchDrawer({ open, onClose, onCreate }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const closeDrawer = () => {
    setError('');
    onClose();
  };

  const submit = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await onCreate({
        ...form,
        target_price: form.target_price ? Number(form.target_price) : null,
        currency: 'XOF',
      });

      setForm(emptyForm);
      closeDrawer();
    } catch (err) {
      setError(
        "Impossible d'ajouter cette surveillance. Vérifie ton abonnement ou les informations saisies."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="drawer-backdrop"
        type="button"
        onClick={closeDrawer}
        aria-label="Fermer"
      />

      <aside className="drawer open">
        <div className="drawer-head">
          <div>
            <h3>Configurer une surveillance</h3>
            <p>
              Ajoute un produit, une annonce ou un ticket au radar DataPulse.
            </p>
          </div>

          <button
            className="drawer-close"
            type="button"
            onClick={closeDrawer}
            aria-label="Fermer le panneau"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          <label>Secteur</label>

          <select
            value={form.item_type}
            onChange={(event) => update('item_type', event.target.value)}
          >
            <option value="high_tech">High-Tech</option>
            <option value="ecommerce">E-commerce</option>
            <option value="real_estate">Immobilier</option>
            <option value="ticketing">Billetterie</option>
          </select>

          <label>Nom de l’élément</label>

          <input
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Ex: iPhone 15 Pro Max"
            required
          />

          <label>Catégorie</label>

          <input
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            placeholder="smartphone, villa, concert..."
          />

          <label>Marque / zone / organisateur</label>

          <input
            value={form.brand}
            onChange={(event) => update('brand', event.target.value)}
            placeholder="Samsung, Cocody, Festival..."
          />

          <label>Prix cible</label>

          <input
            type="number"
            value={form.target_price}
            onChange={(event) => update('target_price', event.target.value)}
            placeholder="500000"
          />

          {error && <div className="auth-error">{error}</div>}

          <div className="form-actions drawer-actions">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? 'Activation...' : 'Activer le radar'}
            </button>

            <button className="btn" type="button" onClick={closeDrawer}>
              Annuler
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}