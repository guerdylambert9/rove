// Minimal inline-SVG icon set so there are no external icon dependencies.
const paths = {
  browse: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
  fleet: 'M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v6h-3v-2H6v2H3z M6.5 16h.01M17.5 16h.01',
  trips: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0',
  payouts: 'M3 7h18v10H3zM3 10h18M7 14h3',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z',
  back: 'M15 18l-6-6 6-6',
  pin: 'M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  doc: 'M6 2h9l5 5v15H6zM15 2v5h5',
  chat: 'M4 4h16v12H8l-4 4z',
  chevron: 'M9 6l6 6-6 6',
  check: 'M5 12l4 4 10-10',
}

export default function Icon({ name, size = 20, stroke = 'currentColor', fill = 'none', ...rest }) {
  const d = paths[name] || ''
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {d.split(' M').map((seg, i) => (
        <path key={i} d={(i === 0 ? seg : 'M' + seg)} />
      ))}
    </svg>
  )
}
