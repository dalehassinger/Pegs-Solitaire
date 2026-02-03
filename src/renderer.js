(() => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  const state = {
    stock: [],
    waste: [],
    foundations: {
      '♠': [],
      '♥': [],
      '♦': [],
      '♣': []
    },
    tableau: [[], [], [], [], [], [], []],
    selected: null,
    gameNumber: 1
  };

  // Utilities
  const isRed = suit => suit === '♥' || suit === '♦';
  const rankLabel = r => {
    if (r === 1) return 'A';
    if (r === 11) return 'J';
    if (r === 12) return 'Q';
    if (r === 13) return 'K';
    return r.toString();
  };

  const buildDeck = () => {
    const deck = [];
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, faceUp: false });
      }
    }
    return deck;
  };

  const shuffle = deck => {
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  function deal() {
    const deck = shuffle(buildDeck());
    state.stock = deck;
    state.waste = [];
    state.foundations = { '♠': [], '♥': [], '♦': [], '♣': [] };
    state.tableau = [[], [], [], [], [], [], []];
    state.selected = null;

    for (let col = 0; col < 7; col += 1) {
      for (let row = 0; row <= col; row += 1) {
        const card = state.stock.pop();
        card.faceUp = row === col;
        state.tableau[col].push(card);
      }
    }
    render();
    setStatus(`Game #${state.gameNumber} — good luck!`);
  }

  // Rendering helpers
  const stockEl = document.getElementById('stock');
  const wasteEl = document.getElementById('waste');
  const foundationEls = Array.from(document.querySelectorAll('.foundation'));
  const tableauEls = Array.from(document.querySelectorAll('.tableau'));
  const statusEl = document.getElementById('status-text');
  const platformChip = document.getElementById('platform-chip');

  platformChip.textContent = `Running on ${window.electronAPI.platform}`;

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function clearSelection() {
    state.selected = null;
    render();
  }

  function renderStock() {
    stockEl.innerHTML = '';
    stockEl.classList.toggle('empty', state.stock.length === 0);
    if (state.stock.length > 0) {
      const back = document.createElement('div');
      back.className = 'card face-down';
      back.style.position = 'relative';
      back.style.transform = 'translateY(0)';
      stockEl.appendChild(back);
    }
  }

  function renderWaste() {
    wasteEl.innerHTML = '';
    wasteEl.classList.toggle('empty', state.waste.length === 0);
    if (state.waste.length > 0) {
      const card = state.waste[state.waste.length - 1];
      const el = renderCard(card, 'waste', null, state.waste.length - 1);
      el.style.position = 'relative';
      wasteEl.appendChild(el);
    }
  }

  function renderFoundations() {
    foundationEls.forEach(el => {
      const suit = el.dataset.foundation;
      const pile = state.foundations[suit];
      el.innerHTML = '';
      el.classList.toggle('empty', pile.length === 0);
      if (pile.length > 0) {
        const card = pile[pile.length - 1];
        const node = renderCard(card, 'foundation', suit, pile.length - 1);
        node.style.position = 'relative';
        el.appendChild(node);
      }
    });
  }

  function renderTableau() {
    tableauEls.forEach((el, colIndex) => {
      el.innerHTML = '';
      const column = state.tableau[colIndex];
      el.classList.toggle('empty', column.length === 0);
      column.forEach((card, rowIndex) => {
        const node = renderCard(card, 'tableau', colIndex, rowIndex);
        node.style.top = `${rowIndex * 26}px`;
        el.appendChild(node);
      });
    });
  }

  function renderCard(card, source, column, index) {
    const el = document.createElement('div');
    el.classList.add('card');
    if (!card.faceUp) el.classList.add('face-down');

    el.dataset.source = source;
    el.dataset.column = column;
    el.dataset.index = index;

    if (state.selected) {
      const sel = state.selected;
      const isSelected =
        sel.source === 'waste' && source === 'waste' && index === sel.index ||
        (sel.source === 'tableau' &&
          source === 'tableau' &&
          Number(column) === sel.column &&
          Number(index) >= sel.index);
      if (isSelected) el.classList.add('selected');
    }

    if (card.faceUp) {
      const color = isRed(card.suit) ? 'red' : 'black';
      el.classList.add(color);

      const top = document.createElement('div');
      top.className = 'corner top';
      top.textContent = `${rankLabel(card.rank)}${card.suit}`;

      const pip = document.createElement('div');
      pip.className = 'pip';
      pip.textContent = card.suit;

      const bottom = document.createElement('div');
      bottom.className = 'corner bottom';
      bottom.textContent = `${rankLabel(card.rank)}${card.suit}`;

      el.append(top, pip, bottom);
    }

    el.addEventListener('click', e => {
      e.stopPropagation();
      handleCardClick(card, source, column, index);
    });

    return el;
  }

  function render() {
    renderStock();
    renderWaste();
    renderFoundations();
    renderTableau();
    updateHints();
    updateCounters();
  }

  function updateCounters() {
    const remaining = state.stock.length;
    const placed = Object.values(state.foundations).reduce((a, b) => a + b.length, 0);
    statusEl.dataset.remaining = remaining;
    statusEl.dataset.placed = placed;
    if (placed === 52) {
      setStatus('You win! 🎉 Start a new game to play again.');
    }
  }

  function updateHints() {
    // Clear previous hints
    foundationEls.forEach(el => el.classList.remove('hint'));
    tableauEls.forEach(el => el.classList.remove('hint'));

    if (!state.selected) return;

    // Foundation hints
    const card = state.selected.cards[0];
    if (card && state.selected.cards.length === 1) {
      foundationEls.forEach(el => {
        const suit = el.dataset.foundation;
        const target = state.foundations[suit];
        const needed = target.length + 1;
        if (card.suit === suit && card.rank === needed) {
          el.classList.add('hint');
        }
      });
    }

    // Tableau hints
    tableauEls.forEach((el, idx) => {
      const dest = state.tableau[idx];
      const lead = state.selected.cards[0];
      if (!lead) return;
      const canPlaceOnEmpty = dest.length === 0 && lead.rank === 13;
      const top = dest[dest.length - 1];
      const canPlaceOnTop =
        dest.length > 0 &&
        top.faceUp &&
        isRed(top.suit) !== isRed(lead.suit) &&
        top.rank === lead.rank + 1;
      if (canPlaceOnEmpty || canPlaceOnTop) {
        el.classList.add('hint');
      }
    });
  }

  // Interaction logic
  stockEl.addEventListener('click', () => {
    if (state.stock.length > 0) {
      const card = state.stock.pop();
      card.faceUp = true;
      state.waste.push(card);
      setStatus('Drew a card.');
    } else if (state.waste.length > 0) {
      while (state.waste.length) {
        const card = state.waste.pop();
        card.faceUp = false;
        state.stock.push(card);
      }
      setStatus('Recycled waste into stock.');
    }
    state.selected = null;
    render();
  });

  wasteEl.addEventListener('click', () => {
    if (state.waste.length === 0) return;
    const topIndex = state.waste.length - 1;
    state.selected = { source: 'waste', index: topIndex, cards: [state.waste[topIndex]] };
    render();
    setStatus('Selected waste card.');
  });

  foundationEls.forEach(el => {
    el.addEventListener('click', () => tryMoveSelectedToFoundation(el.dataset.foundation));
  });

  tableauEls.forEach((el, columnIndex) => {
    el.addEventListener('click', () => {
      if (!state.selected) {
        // No selection: flip top face-down if present
        const column = state.tableau[columnIndex];
        if (column.length === 0) return;
        const top = column[column.length - 1];
        if (!top.faceUp) {
          top.faceUp = true;
          setStatus('Flipped a card.');
          render();
        }
        return;
      }
      attemptMoveToTableau(columnIndex);
    });
  });

  function handleCardClick(card, source, column, index) {
    // If something is already selected, treat a tableau card click as a move target first.
    if (state.selected && source === 'tableau' && card.faceUp) {
      attemptMoveToTableau(Number(column));
      return;
    }

    // Allow clicking a foundation pile (or its top card) as a destination.
    if (state.selected && source === 'foundation') {
      tryMoveSelectedToFoundation(column);
      return;
    }

    if (source === 'tableau') {
      const col = state.tableau[column];
      if (!card.faceUp) {
        if (index === col.length - 1) {
          card.faceUp = true;
          setStatus('Flipped a card.');
          render();
        }
        return;
      }
      state.selected = {
        source: 'tableau',
        column,
        index,
        cards: col.slice(index)
      };
      setStatus('Selected stack.');
      render();
      return;
    }

    if (source === 'waste') {
      state.selected = { source: 'waste', index, cards: [card] };
      setStatus('Selected waste card.');
      render();
    }
  }

  function attemptMoveToTableau(targetColumn) {
    const sel = state.selected;
    if (!sel) return;
    const dest = state.tableau[targetColumn];
    const moving = sel.cards;
    const lead = moving[0];

    const canPlaceOnEmpty = dest.length === 0 && lead.rank === 13;
    const top = dest[dest.length - 1];
    const canPlaceOnTop =
      dest.length > 0 &&
      top.faceUp &&
      isRed(top.suit) !== isRed(lead.suit) &&
      top.rank === lead.rank + 1;

    if (!(canPlaceOnEmpty || canPlaceOnTop)) {
      setStatus('Move not allowed.');
      return;
    }

    if (sel.source === 'waste') {
      state.waste.pop();
    } else if (sel.source === 'tableau') {
      state.tableau[sel.column].splice(sel.index);
      flipTailIfNeeded(sel.column);
    }

    dest.push(...moving);
    state.selected = null;
    setStatus('Moved to tableau.');
    render();
  }

  function moveSelectedToFoundation(suit) {
    const sel = state.selected;
    const card = sel.cards[0];
    if (sel.source === 'waste') {
      state.waste.pop();
    } else if (sel.source === 'tableau') {
      state.tableau[sel.column].splice(sel.index);
      flipTailIfNeeded(sel.column);
    }
    state.foundations[suit].push(card);
    state.selected = null;
    setStatus('Moved to foundation.');
    render();
  }

  function tryMoveSelectedToFoundation(suit) {
    if (!state.selected) return;
    const target = state.foundations[suit];
    const card = state.selected.cards[0];
    if (!card || card.suit !== suit) return;
    if (state.selected.cards.length > 1) return;
    const needed = target.length + 1;
    if (card.rank !== needed) return;
    moveSelectedToFoundation(suit);
  }

  function flipTailIfNeeded(column) {
    const col = state.tableau[column];
    if (col.length === 0) return;
    const tail = col[col.length - 1];
    if (!tail.faceUp) tail.faceUp = true;
  }

  function autoMoveToFoundation() {
    let movedAny = false;

    const tryCard = (card, source, column, index) => {
      const pile = state.foundations[card.suit];
      if (card.rank === pile.length + 1) {
        if (source === 'waste') state.waste.pop();
        if (source === 'tableau') {
          state.tableau[column].splice(index);
          flipTailIfNeeded(column);
        }
        pile.push(card);
        return true;
      }
      return false;
    };

    while (true) {
      let movedThisPass = false;

      if (state.waste.length) {
        const c = state.waste[state.waste.length - 1];
        movedThisPass ||= tryCard(c, 'waste', null, null);
      }

      tableauEls.forEach((_, colIdx) => {
        const col = state.tableau[colIdx];
        if (col.length === 0) return;
        const top = col[col.length - 1];
        if (top.faceUp) movedThisPass ||= tryCard(top, 'tableau', colIdx, col.length - 1);
      });

      if (!movedThisPass) break;
      movedAny = true;
    }

    if (movedAny) {
      setStatus('Auto-moved to foundation.');
      state.selected = null;
      render();
    } else {
      setStatus('No automatic moves available.');
    }
  }

  document.getElementById('new-game').addEventListener('click', () => {
    state.gameNumber += 1;
    deal();
  });

  document.getElementById('restart').addEventListener('click', () => {
    deal();
  });

  document.getElementById('auto-foundation').addEventListener('click', autoMoveToFoundation);

  // Initialize
  deal();
})();
