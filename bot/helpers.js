// Parse buttons from text input
// Support "Name - URL && Name - URL" or multiline
function parseButtons(input) {
  if (!input) return [];

  const items = input.includes('&&')
    ? input.split('&&').map(s => s.trim())
    : input.split('\n').map(s => s.trim()).filter(Boolean);

  const buttons = [];
  for (const line of items) {
    const parts = line.split(' - ');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const url = parts.slice(1).join(' - ').trim();
      if (name && url) {
        buttons.push({ text: name, url });
      }
    }
  }
  return buttons;
}

// Simple email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Paginate array
function paginate(array, page = 1, pageSize = 6) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = array.slice(startIndex, endIndex);
  const totalPages = Math.ceil(array.length / pageSize);

  return {
    items,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Format date
function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

// Escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Generate inline keyboard
function createInlineKeyboard(buttons, columns = 2) {
  const keyboard = [];
  for (let i = 0; i < buttons.length; i += columns) {
    keyboard.push(buttons.slice(i, i + columns));
  }
  return { inline_keyboard: keyboard };
}

// Build pagination keyboard
function paginationKeyboard(currentPage, totalPages, callbackPrefix) {
  const buttons = [];

  if (currentPage > 1) {
    buttons.push({ 
      text: '⬅️ Previous', 
      callback_data: `${callbackPrefix}_${currentPage - 1}` 
    });
  }

  buttons.push({ 
    text: `${currentPage}/${totalPages}`, 
    callback_data: 'page_info' 
  });

  if (currentPage < totalPages) {
    buttons.push({ 
      text: 'Next ➡️', 
      callback_data: `${callbackPrefix}_${currentPage + 1}` 
    });
  }

  return [buttons];
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Chunk array
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

module.exports = {
  parseButtons,
  isValidEmail,
  paginate,
  formatCurrency,
  formatDate,
  escapeHtml,
  createInlineKeyboard,
  paginationKeyboard,
  delay,
  chunk
};
