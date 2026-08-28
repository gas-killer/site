/**
 * Small brand marks used as destination indicators beside a channel's name,
 * e.g. in the table on the Contact page. Deliberately not links: the adjacent
 * text carries the href, the icon only says where it goes.
 */
const PATHS = {
  mail: [
    "M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z",
    "M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z",
  ],
  telegram: [
    "M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.56 8.24-1.86 8.77c-.14.62-.51.77-1.03.48l-2.85-2.1-1.37 1.32c-.15.15-.28.28-.57.28l.2-2.9 5.28-4.77c.23-.2-.05-.32-.36-.11l-6.52 4.1-2.81-.88c-.61-.19-.62-.61.13-.9l10.99-4.24c.51-.19.96.12.79.95z",
  ],
  x: [
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  ],
} as const

export function ChannelIcon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="mr-1.5 inline-block h-4 w-4 shrink-0 align-[-0.2em] opacity-70"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
