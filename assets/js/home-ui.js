/*
 * ROMEX homepage interactions.
 *
 * The homepage is women-only and shows three timepieces at a time.
 * The arrow controls move the rail to the next group.
 */

RomexStore.ready().then(() => {
  const grid = document.getElementById('product-grid');
  const previous = document.getElementById('product-prev');
  const next = document.getElementById('product-next');

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
      <article class="card product-rail-card">
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

  function render() {
    const products = [...RomexStore.products]
      .filter((product) => product.gender === 'women')
      .sort((a, b) => {
        return Number(b.featured) - Number(a.featured)
          || new Date(a.created_at || 0) - new Date(b.created_at || 0);
      });

    grid.innerHTML = products.length
      ? products.map(cardMarkup).join('')
      : '<div class="collection-empty">No timepieces in this selection yet.</div>';

    grid.scrollLeft = 0;
    updateArrows();
  }

  function updateArrows() {
    const maxScroll = grid.scrollWidth - grid.clientWidth;

    if (previous) {
      previous.disabled = grid.scrollLeft <= 4;
    }

    if (next) {
      next.disabled = maxScroll <= 4 || grid.scrollLeft >= maxScroll - 4;
    }
  }

  function scrollByGroup(direction) {
    grid.scrollBy({
      left: direction * grid.clientWidth,
      behavior: 'smooth'
    });
  }

  document.querySelectorAll('[data-collection]').forEach((button) => {
    button.addEventListener('click', () => {
      const collection = button.dataset.collection;
      window.location.href = `collection.html?collection=${encodeURIComponent(collection)}`;
    });
  });

  previous?.addEventListener('click', () => scrollByGroup(-1));
  next?.addEventListener('click', () => scrollByGroup(1));
  grid.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);

  render();
});
