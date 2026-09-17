const input = document.querySelector('#search');
const cards = [...document.querySelectorAll('.article-section[data-title], .notice[data-title], .rule-grid[data-title]')];
const status = document.querySelector('#search-status');
const toast = document.querySelector('#toast');

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2800);
}

function filterArticles() {
  const query = input.value.trim().toLocaleLowerCase('fr');
  let count = 0;
  cards.forEach((card) => {
    const haystack = `${card.dataset.title} ${card.dataset.tags}`.toLocaleLowerCase('fr');
    const match = !query || haystack.includes(query);
    card.classList.toggle('hidden', !match);
    if (match) count++;
  });
  status.textContent = query ? `${count} résultat${count !== 1 ? 's' : ''} pour « ${input.value} »` : '';
}

input.addEventListener('input', filterArticles);
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault(); input.focus();
  }
  if (event.key === 'Escape') { input.value = ''; filterArticles(); input.blur(); }
});
document.querySelectorAll('[data-message]').forEach((button) => button.addEventListener('click', () => showToast(button.dataset.message)));
cards.forEach((card) => card.addEventListener('click', () => showToast(`Ouverture : ${card.dataset.title}`)));

document.addEventListener('wheel', (event) => {
  if (event.ctrlKey || event.metaKey) event.preventDefault();
}, { passive: false });
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && ['+', '=', '-'].includes(event.key)) event.preventDefault();
});
