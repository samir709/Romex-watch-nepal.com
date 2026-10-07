/*
 * ROMEX women-only collection page.
 *
 * The three finish collections are backed by the product collection field:
 * gold, rose and silver.
 */

RomexStore.ready().then(() => {
  const grid = document.getElementById('collection-page-grid');
  const filters = document.querySelectorAll('[data-filter]');

  if (!grid) {
    return;
  }

  function collectionOf(product) {
    const explicit = String(product.collection || '').toLowerCase().trim();

    if (explicit.includes('rose')) {
      return 'rose';
    }

    if (explicit.includes('silver')) {
      return 'silver';
    }

    if (explicit.includes('gold')) {
      return 'gold';
    }

    const text = `${product.name || ''} ${product.specs?.Strap || ''} ${product.specs?.Dial || ''}`
      .toLowerCase();

    if (text.includes('rose')) {
      return 'rose';
    }

    if (text.includes('silver')) {
      return 'silver';
    }

    return 'gold';
  }

  function priceMarkup(product) {
    if (Number(product.discount) > 0) {
      return `
        <span class="sale">-${Number(product.discount)}%</span>
        <span class="now">${RomexStore.format(product.price)}</span>
        <span class="mrp">M.R.P.: <s>${RomexStore.format(product.mrp)}</s></span>
      `;
    }

    return `<span class="now">${RomexStore.format(product.price)}</span>`;
  }

  function cardMarkup(product) {
    return `
      <article class="card">
        <a class="card-image" href="product.html?id=${product.id}">
          <img src="${product.images?.[0] || ''}" alt="${product.name || 'ROMEX Watch'}">
        </a>
        <div class="card-info">
          <div class="card-code">${product.code || ''}</div>
          <div class="card-title">${product.name || 'ROMEX Watch'}</div>
          <div class="price">
            ${priceMarkup(product)}
          </div>
          <a class="card-link" href="product.html?id=${product.id}">
            Discover watch
          </a>
        </div>
      </article>
    `;
  }

  function render(filter) {
    let products = [...RomexStore.products]
      .filter((product) => product.gender === 'women');

    if (['gold', 'rose', 'silver'].includes(filter)) {
      products = products.filter(
        (product) => collectionOf(product) === filter
      );
    }

    products.sort((a, b) => {
      return Number(b.featured) - Number(a.featured)
        || new Date(a.created_at || 0) - new Date(b.created_at || 0);
    });

    grid.innerHTML = products.length
      ? products.map(cardMarkup).join('')
      : '<div class="collection-page-empty">No timepieces in this selection yet.</div>';
  }

  function setFilter(filter) {
    const validFilters = ['all', 'gold', 'rose', 'silver'];
    const activeFilter = validFilters.includes(filter) ? filter : 'all';

    filters.forEach((button) => {
      button.classList.toggle(
        'active',
        button.dataset.filter === activeFilter
      );
    });

    render(activeFilter);
  }

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      setFilter(button.dataset.filter);
    });
  });

  const params = new URLSearchParams(window.location.search);
  setFilter(params.get('collection') || 'all');
});
