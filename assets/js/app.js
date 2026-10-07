/*
 * ROMEX storefront state and Supabase product access.
 *
 * The storefront is women-only.
 * Orders are completed through WhatsApp instead of an online payment gateway.
 */

(function initializeRomexStore() {
  const baseProducts = window.ROMEX_PRODUCTS || [];
  const cartKey = 'romex_cart_v2';
  const whatsappNumber = '9779746878973';

  let products = [...baseProducts];
  let readyPromise = null;

  function format(number) {
    return `Rs. ${Number(number || 0).toLocaleString('en-NP')}`;
  }

  async function load() {
    if (readyPromise) {
      return readyPromise;
    }

    readyPromise = (async () => {
      if (window.RomexCloud?.ready) {
        try {
          const { data, error } = await RomexCloud.client
            .from('products')
            .select('*')
            .eq('active', true)
            .order('featured', { ascending: false })
            .order('created_at', { ascending: true });

          if (!error && data?.length) {
            products = data.map((product) => ({
              ...product,
              gender: 'women',
              images: product.images || [],
              specs: product.specs || {}
            }));
          }
        } catch (error) {
          console.warn('ROMEX cloud product load failed', error);
        }
      }

      products = products.map((product) => ({
        ...product,
        gender: 'women'
      }));

      return products;
    })();

    return readyPromise;
  }

  function cart() {
    return JSON.parse(localStorage.getItem(cartKey) || '[]');
  }

  function setCart(items) {
    localStorage.setItem(cartKey, JSON.stringify(items));
    updateCartCount();
  }

  function get(id) {
    return products.find((product) => product.id === id);
  }

  function add(id) {
    const product = get(id);

    if (!product || product.stock < 1) {
      return false;
    }

    const items = cart();
    const row = items.find((item) => item.id === id);

    if (row) {
      row.qty = Math.min(row.qty + 1, product.stock);
    } else {
      items.push({ id, qty: 1 });
    }

    setCart(items);
    return true;
  }

  function remove(id) {
    setCart(cart().filter((item) => item.id !== id));
  }

  function change(id, quantity) {
    const product = get(id);
    const items = cart();
    const row = items.find((item) => item.id === id);

    if (!row || !product) {
      return;
    }

    if (quantity <= 0) {
      remove(id);
      return;
    }

    row.qty = Math.min(Number(quantity), product.stock);
    setCart(items);
  }

  function updateCartCount() {
    document.querySelectorAll('[data-cart-count]').forEach((element) => {
      element.textContent = cart().reduce(
        (total, item) => total + item.qty,
        0
      );
    });
  }

  function subtotal() {
    return cart().reduce((total, item) => {
      return total + (get(item.id)?.price || 0) * item.qty;
    }, 0);
  }

  function productPageUrl(product) {
    return new URL(
      `product.html?id=${encodeURIComponent(product.id)}`,
      window.location.href
    ).href;
  }

  function productImageUrl(product) {
    if (!product.images?.[0]) {
      return '';
    }

    return new URL(product.images[0], window.location.href).href;
  }

  function whatsappOrder(product, quantity = 1) {
    if (!product) {
      return false;
    }

    const message = [
      'Hello ROMEX Watch Nepal, I want to order this watch.',
      '',
      `Product: ${product.name}`,
      `Code: ${product.code || '—'}`,
      `Price: ${format(product.price)}`,
      `Quantity: ${quantity}`,
      '',
      `Product page: ${productPageUrl(product)}`,
      `Product image: ${productImageUrl(product)}`,
      '',
      'Please confirm availability and send me the payment/order instructions here on WhatsApp.'
    ].join('\n');

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
    return true;
  }

  function whatsappCartOrder() {
    const items = cart();

    if (!items.length) {
      return false;
    }

    const lines = [
      'Hello ROMEX Watch Nepal, I want to order these watches.',
      ''
    ];

    let total = 0;

    items.forEach((item, index) => {
      const product = get(item.id);

      if (!product) {
        return;
      }

      const lineTotal = product.price * item.qty;
      total += lineTotal;

      lines.push(
        `${index + 1}. ${product.name} (${product.code || '—'})`,
        `   Quantity: ${item.qty}`,
        `   Price: ${format(product.price)}`,
        `   Product page: ${productPageUrl(product)}`,
        `   Product image: ${productImageUrl(product)}`,
        ''
      );
    });

    lines.push(
      `Estimated total: ${format(total)}`,
      '',
      'Please confirm availability and send me the payment/order instructions here on WhatsApp.'
    );

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener');
    return true;
  }

  window.RomexStore = {
    ready: load,
    format,
    cart,
    setCart,
    get,
    add,
    remove,
    change,
    updateCartCount,
    subtotal,
    whatsappOrder,
    whatsappCartOrder,
    get products() {
      return products;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    load();
  });
})();
