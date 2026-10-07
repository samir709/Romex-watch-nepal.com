/*
 * ROMEX Admin dashboard.
 *
 * Product pricing is automatic:
 * - 0% discount means MRP is the customer price.
 * - A percentage discount calculates the customer price from MRP.
 *
 * Collection is stored in the products table so the homepage can
 * filter the catalog without hard-coded product lists. The current store is women-only.
 */

const db = () => RomexCloud.client;
const fmt = (value) => `Rs. ${Number(value || 0).toLocaleString('en-NP')}`;
const modal = document.getElementById('modal');

let taxonomyReady = false;

function showModal(html) {
  document.getElementById('modalBody').innerHTML = html;
  modal.style.display = 'flex';
}

function hideModal() {
  modal.style.display = 'none';
}

async function checkTaxonomy() {
  const { error } = await db()
    .from('products')
    .select('collection')
    .limit(1);

  taxonomyReady = !error;

  if (!taxonomyReady) {
    document.getElementById('cloudStatus').textContent =
      'Connected · run 002_romex_catalog_taxonomy.sql to enable the collection field';
  }
}

function taxonomyFields(product = {}) {
  if (!taxonomyReady) {
    return `
      <div class="taxonomy-warning">
        Run <strong>supabase/migrations/002_romex_catalog_taxonomy.sql</strong>
        once in Supabase SQL Editor to enable Collection fields.
      </div>
    `;
  }

  return `
    <div class="form-grid">
      <label>
        Collection
        <select name="collection" required>
          <option value="gold" ${product.collection === 'gold' ? 'selected' : ''}>Romex Royal Gold</option>
          <option value="rose" ${product.collection === 'rose' ? 'selected' : ''}>Romex Rose Classic</option>
          <option value="silver" ${product.collection === 'silver' ? 'selected' : ''}>Romex Silver Classic</option>
        </select>
      </label>


    </div>
  `;
}

function pricingFields(product = {}) {
  return `
    <div class="form-grid">
      <label>
        Original MRP / selling price
        <input name="mrp" type="number" min="0" step="1" value="${product.mrp ?? ''}" required>
        <small class="price-help">No discount: this is the price customers pay.</small>
      </label>

      <label>
        Discount %
        <input name="discount" id="discountField" type="number" min="0" max="100" step="0.01" value="${product.discount || 0}">
        <small class="price-help">Add a percentage only when you want a sale price.</small>
      </label>
    </div>

    <div class="calculated-price">
      Customer price:
      <strong id="calculatedPrice">${fmt(product.price || product.mrp || 0)}</strong>
    </div>
  `;
}

function wirePricing() {
  const form = document.getElementById('productForm');

  if (!form) {
    return;
  }

  const mrp = form.elements.mrp;
  const discount = form.elements.discount;
  const output = document.getElementById('calculatedPrice');

  function calculate() {
    const original = Math.max(0, Number(mrp.value || 0));
    const percentage = Math.min(100, Math.max(0, Number(discount.value || 0)));
    const price = percentage > 0
      ? Math.round(original * (1 - percentage / 100) * 100) / 100
      : original;

    output.textContent = fmt(price);
  }

  mrp.addEventListener('input', calculate);
  discount.addEventListener('input', calculate);
  calculate();
}

async function loadProducts() {
  const { data, error } = await db()
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  document.getElementById('productRows').innerHTML = (data || []).map((product) => `
    <tr>
      <td>
        <strong>${product.name}</strong><br>
        <small>${product.code}</small>
      </td>
      <td>${product.collection || '—'}</td>
      <td>${fmt(product.price)}</td>
      <td><s>${fmt(product.mrp)}</s></td>
      <td>${product.discount ? `-${product.discount}%` : '—'}</td>
      <td>${product.stock}</td>
      <td>${product.active ? 'Yes' : 'No'}</td>
      <td class="admin-actions">
        <button class="mini" onclick="editProduct('${product.id}')">Edit</button>
        <button class="mini" onclick="archiveProduct('${product.id}', ${product.active})">
          ${product.active ? 'Delete' : 'Restore'}
        </button>
      </td>
    </tr>
  `).join('');

  document.getElementById('statProducts').textContent = data.length;
  document.getElementById('statStock').textContent = data.reduce(
    (total, product) => total + Number(product.stock),
    0
  );
}

function productForm(product = {}, mode = 'create') {
  return `
    <h2>${mode === 'edit' ? 'Edit watch' : 'Add watch'}</h2>

    ${mode === 'create' ? `
      <p class="price-help">
        Pricing is automatic: enter the original MRP and discount percentage.
        With 0% discount, the MRP is the customer price and nothing is crossed out.
      </p>
    ` : ''}

    <form id="productForm">
      <label>
        ID
        <input name="id" value="${product.id || ''}" ${mode === 'edit' ? 'readonly' : 'placeholder="romex-10"'} required>
      </label>

      <label>
        Code
        <input name="code" value="${product.code || ''}" placeholder="R-10" required>
      </label>

      <label>
        Name
        <input name="name" value="${product.name || ''}" required>
      </label>

      ${taxonomyFields(product)}
      ${pricingFields(product)}

      <div class="form-grid">
        <label>
          Stock
          <input name="stock" type="number" min="0" value="${product.stock || 0}" required>
        </label>

        <label>
          Featured
          <select name="featured">
            <option value="true" ${product.featured ? 'selected' : ''}>Yes</option>
            <option value="false" ${!product.featured ? 'selected' : ''}>No</option>
          </select>
        </label>
      </div>

      <label>
        Images JSON
        <input
          name="images"
          value='${JSON.stringify(product.images || []).replace(/'/g, '&#39;')}'
          placeholder='["assets/images/watch-10/main.jpg"]'
          required
        >
      </label>

      <label>
        Description
        <textarea name="description">${product.description || ''}</textarea>
      </label>

      <label>
        <input name="active" type="checkbox" ${product.active !== false ? 'checked' : ''}>
        Active
      </label>

      <button class="btn" type="submit">
        ${mode === 'edit' ? 'Save watch' : 'Create watch'}
      </button>
    </form>
  `;
}

async function editProduct(id) {
  const { data, error } = await db()
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  showModal(productForm(data, 'edit'));
  wirePricing();

  document.getElementById('productForm').onsubmit = saveProduct;
}

async function saveProduct(event) {
  event.preventDefault();

  const form = new FormData(event.target);
  const mrp = Number(form.get('mrp') || 0);
  const discount = Math.min(100, Math.max(0, Number(form.get('discount') || 0)));
  const price = discount > 0
    ? Math.round(mrp * (1 - discount / 100) * 100) / 100
    : mrp;

  let images;

  try {
    images = JSON.parse(form.get('images'));
  } catch (_) {
    alert('Images must be valid JSON.');
    return;
  }

  const payload = {
    id: form.get('id'),
    code: form.get('code'),
    name: form.get('name'),
    mrp,
    price,
    stock: Number(form.get('stock') || 0),
    discount,
    featured: form.get('featured') === 'true',
    images,
    description: form.get('description'),
    active: form.get('active') === 'on'
  };

  if (taxonomyReady) {
    payload.collection = form.get('collection');
    payload.gender = 'women';
  }

  const { error } = await db()
    .from('products')
    .upsert(payload);

  if (error) {
    alert(error.message);
    return;
  }

  hideModal();
  await refresh();
}

async function addProduct() {
  showModal(productForm({
    mrp: '',
    discount: 0,
    stock: 0,
    featured: false,
    active: true,
    collection: 'gold',
    gender: 'women'
  }));

  wirePricing();
  document.getElementById('productForm').onsubmit = saveProduct;
}

async function archiveProduct(id, active) {
  if (!confirm(active ? 'Archive this watch?' : 'Restore this watch?')) {
    return;
  }

  const { error } = await db()
    .from('products')
    .update({ active: !active })
    .eq('id', id);

  if (error) {
    alert(error.message);
    return;
  }

  await refresh();
}

async function refresh() {
  await loadProducts();
}

document.getElementById('addProduct').onclick = addProduct;
document.getElementById('closeModal').onclick = hideModal;

document.getElementById('logout').onclick = async () => {
  await db().auth.signOut();
  location.reload();
};

document.getElementById('loginForm').onsubmit = async (event) => {
  event.preventDefault();

  const message = document.getElementById('loginMessage');
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const { error } = await db().auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message.textContent = error.message;
    return;
  }

  location.reload();
};

(async () => {
  if (!RomexCloud.ready) {
    document.getElementById('loginMessage').textContent =
      'Configure Supabase first. See SETUP.md.';
    return;
  }

  try {
    const user = await RomexCloud.user();

    if (!user) {
      document.getElementById('loginView').style.display = 'flex';
      return;
    }

    const { data: profile } = await db()
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      document.getElementById('loginView').style.display = 'flex';
      return;
    }

    document.getElementById('loginView').style.display = 'none';
    document.getElementById('adminApp').style.display = 'grid';
    document.getElementById('cloudStatus').textContent = 'Connected to live database';

    await checkTaxonomy();
    await refresh();
  } catch (error) {
    document.getElementById('loginMessage').textContent = error.message;
  }
})();
