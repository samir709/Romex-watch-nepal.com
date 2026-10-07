/*
 * ROMEX shop reviews.
 *
 * Firestore uses a live onSnapshot listener, so newly approved reviews appear
 * in Recent Reviews without a page refresh.
 */

(function setupRomexReviews() {
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character]));
  }

  function stars(count) {
    const value = Math.max(0, Math.min(5, Number(count) || 0));
    return '★★★★★'.split('').map((_, index) => index < value ? '★' : '☆').join('');
  }

  function setup() {
    const form = document.getElementById('reviewForm');
    const list = document.getElementById('reviewList');

    if (!form || !list) {
      return;
    }

    if (!window.ROMEX_FIREBASE_CONFIG || !window.firebase) {
      list.innerHTML = '<div class="review-empty">Be the first customer to leave a review.</div>';
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(window.ROMEX_FIREBASE_CONFIG);
      }

      const db = firebase.firestore();
      const reviewsRef = db.collection('romex_shop_reviews');
      const status = document.getElementById('reviewMessage');

      function render(snapshot) {
        const rows = snapshot.docs.map((doc) => doc.data());
        const average = rows.length
          ? rows.reduce((sum, row) => sum + Number(row.rating || 0), 0) / rows.length
          : 0;

        document.getElementById('reviewAverage').textContent = rows.length
          ? average.toFixed(1)
          : '0.0';

        document.getElementById('averageStars').textContent = rows.length
          ? stars(Math.round(average))
          : '☆☆☆☆☆';

        document.getElementById('reviewCount').textContent = `${rows.length} customer review${rows.length === 1 ? '' : 's'}`;

        list.innerHTML = rows.length
          ? rows.map((row) => `
              <article class="review-card">
                <div class="review-stars">${stars(row.rating)}</div>
                <strong>${escapeHtml(row.name || 'Customer')}</strong>
                <p>${escapeHtml(row.review || '')}</p>
                <small>${row.createdAt?.toDate ? row.createdAt.toDate().toLocaleDateString('en-GB') : 'Just now'}</small>
              </article>
            `).join('')
          : '<div class="review-empty">Be the first customer to leave a review.</div>';
      }

      reviewsRef
        .where('approved', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(30)
        .onSnapshot(
          render,
          (error) => {
            console.error('Could not load ROMEX reviews:', error);
            list.innerHTML = '<div class="review-empty">Reviews are temporarily unavailable.</div>';
          }
        );

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = form.name.value.trim();
        const review = form.review.value.trim();
        const rating = Number(form.querySelector('input[name="rating"]:checked')?.value || 0);

        if (!name || !review || !rating) {
          status.textContent = 'Please add your name, rating and review.';
          return;
        }

        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        status.textContent = 'Submitting...';

        try {
          await reviewsRef.add({
            name,
            review,
            rating,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            approved: true
          });

          form.reset();
          status.textContent = 'Thank you — your review is now live for everyone to see.';
        } catch (error) {
          console.error('Could not submit ROMEX review:', error);
          status.textContent = 'Sorry, something went wrong. Please try again.';
        } finally {
          button.disabled = false;
        }
      });
    } catch (error) {
      console.error('ROMEX reviews:', error);
    }
  }

  document.addEventListener('DOMContentLoaded', setup);
})();
