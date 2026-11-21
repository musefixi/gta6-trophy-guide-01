// One helper every view shares: escaping text that came from the data file or the
// reader before it is placed into an HTML string, so a trophy name with an
// apostrophe (or anything sharper) can never break the markup around it.

export function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
