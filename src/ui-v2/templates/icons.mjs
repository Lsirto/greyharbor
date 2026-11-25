/**
 * src/ui-v2/templates/icons.mjs — static inline SVG glyphs.
 *
 * No external fonts, images or CDN assets.  Glyph markup is a constant, so it
 * never needs escaping; user-supplied text is escaped by the templates.
 */

const wrap = (body, extra = '') =>
  `<svg class="gh2-icon ${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const ICONS = Object.freeze({
  eye: wrap('<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/>'),
  moon: wrap('<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>'),
  sun: wrap('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>'),
  seal: wrap('<path d="M12 2 4 5.5v6.2c0 5 3.4 8.3 8 10.3 4.6-2 8-5.3 8-10.3V5.5L12 2Z"/><path d="m8.5 12 2.3 2.3 4.7-4.8"/>'),
  corruption: wrap('<path d="M12 2c4 5 7.5 8.2 7.5 13.2A7.5 7.5 0 0 1 4.5 15C4.5 10.2 8 7 12 2Z"/><path d="M9.5 14.5c.6 1.7 2.5 2.6 4.2 1.8"/>'),
  stealth: wrap('<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><path d="M3 3l18 18"/>'),
  chain: wrap('<path d="M9.5 14.5 14.5 9.5"/><path d="M7.8 11.2 6 13a3.5 3.5 0 0 0 5 5l1.8-1.8"/><path d="M16.2 12.8 18 11a3.5 3.5 0 0 0-5-5l-1.8 1.8"/>'),
  backlash: wrap('<path d="M12 3 4.5 13H11l-1 8 8.5-11H12l1-7Z"/>'),
  sacrifice: wrap('<path d="M12 21V9"/><path d="M12 9c-3.5 0-6-2.3-6-5.5 3.4 0 6 2.2 6 5.5Z"/><path d="M12 9c3.5 0 6-2.3 6-5.5-3.4 0-6 2.2-6 5.5Z"/><path d="M7 21h10"/>'),
  equipment: wrap('<path d="M9 3h6M10 3v3M14 3v3"/><path d="M7 6h10l-1 5H8L7 6Z"/><path d="M12 11v7M9 21h6"/>'),
  sword: wrap('<path d="m14 4 6-2-2 6-9 9-3-3 8-10Z"/><path d="m6 14-3 3 4 4 3-3"/>'),
  plus: wrap('<path d="M12 5v14M5 12h14"/>'),
  minus: wrap('<path d="M5 12h14"/>'),
  hand: wrap('<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S5 17.5 5 13v-3a1.5 1.5 0 0 1 3 0v2"/>'),
  deck: wrap('<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6M9 11h6"/>'),
  discard: wrap('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  night: wrap('<path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/><path d="m18 3 .6 1.6L20 5l-1.4.5L18 7l-.6-1.5L16 5l1.4-.4L18 3Z"/>'),
  scene: wrap('<path d="M3 20h18"/><path d="M6 20V9l4-3 4 3v11"/><path d="M14 20v-7h4v7"/><path d="M8 12h1M8 15h1M8 18h1"/>'),
  archive: wrap('<path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4V4Z"/><path d="M20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7V4Z"/>'),
  dream: wrap('<path d="M12 3c3.5 3.8 6 6.8 6 10.5A6 6 0 0 1 6 13.5C6 9.8 8.5 6.8 12 3Z"/><path d="M10 15.5c.3 1.2 1.2 2 2.5 2.2"/>'),
  crown: wrap('<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z"/><path d="M5 21h14"/>'),
  back: wrap('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><path d="m12 5 1.8 3.7 4.2.5-3 2.8.8 4-3.8-2-3.8 2 .8-4-3-2.8 4.2-.5L12 5Z"/>'),
  'art-unit': wrap('<path d="M12 3 5 7v7c0 4 3 6.5 7 7.8 4-1.3 7-3.8 7-7.8V7l-7-4Z"/><path d="M9 12h6M12 9v7"/>'),
  'art-oldgod': wrap('<circle cx="12" cy="12" r="4.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.9 4.9l3.4 3.4M15.7 15.7l3.4 3.4M19.1 4.9l-3.4 3.4M8.3 15.7l-3.4 3.4"/>'),
  'art-event': wrap('<path d="M6 3h9l4 4v14H6V3Z"/><path d="M14 3v5h5"/><path d="m9 13 2 2 4-4"/>'),
  'art-ritual': wrap('<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  'art-equipment': wrap('<path d="M9 3h6M10 3v3M14 3v3"/><path d="M7 6h10l-1 6H8L7 6Z"/><path d="M12 12v6M9 21h6"/>'),
  'art-location': wrap('<path d="M4 21V9l5-3 5 3v12"/><path d="M14 21V12h5v9"/><path d="M3 21h18M8 12h2M8 16h2"/>'),
  'art-environment': wrap('<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z"/><path d="M4 20c3-2 5-2 8 0"/>'),
  'art-leader': wrap('<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z"/><path d="M12 12v7"/>'),
});

/** Returns a static SVG string; unknown names resolve to an empty string. */
export function icon(name) {
  return ICONS[name] ?? '';
}

export function hasIcon(name) {
  return Object.prototype.hasOwnProperty.call(ICONS, name);
}
