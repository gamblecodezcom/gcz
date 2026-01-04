// Inline keyboard helpers for GCZ bot

export function row(...buttons) {
  return buttons;
}

export function btn(text, dataOrUrl) {
  if (String(dataOrUrl).startsWith("http")) {
    return { text, url: dataOrUrl };
  }
  return { text, callback_data: dataOrUrl };
}

export function keyboard(rows = []) {
  return { inline_keyboard: rows };
}