(() => {
  'use strict';
  const search = document.querySelector('[data-tool-search]');
  const cards = [...document.querySelectorAll('[data-tool-card]')];
  const buttons = [...document.querySelectorAll('[data-category-filter]')];
  const status = document.querySelector('[data-filter-status]');
  const empty = document.querySelector('[data-no-results]');
  if (!search || !cards.length || !status || !empty) return;
  let category = 'all';
  const normalized = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const update = () => {
    const terms = normalized(search.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    let available = 0;
    for (const card of cards) {
      const visible = (category === 'all' || card.dataset.category === category)
        && terms.every(term => normalized([card.querySelector('h3')?.textContent, card.querySelector(':scope > p')?.textContent, card.querySelector('dl')?.textContent, card.dataset.category].join(' ')).includes(term));
      card.hidden = !visible;
      if (visible) { count += 1; if (card.dataset.live === 'true') available += 1; }
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category));
    status.textContent = `${count} ${count === 1 ? 'tool' : 'tools'} shown. ${available} available now${count > available ? `; ${count - available} in preparation` : ''}.`;
    empty.hidden = count !== 0;
  };
  search.addEventListener('input', update);
  search.addEventListener('keydown', event => { if (event.key === 'Escape') { search.value = ''; update(); } });
  for (const button of buttons) button.addEventListener('click', () => { category = button.dataset.categoryFilter; update(); });
  update();
})();
