// Site footer matching supertext.com's account pages: a dark-green bar with the
// copyright, legal/contact links, and social icons. Icons are referenced from the
// Supertext CDN and inverted to white (as the live site does), and turn mint on hover.

const LINKS = [
  { href: 'https://www.supertext.com/de-CH/kontakt', label: 'Kontakt' },
  { href: 'https://www.supertext.com/de-CH/faq', label: 'FAQ' },
  { href: 'https://www.supertext.com/de-CH/impressum', label: 'Impressum' },
  { href: 'https://www.supertext.com/de-CH/agb', label: 'AGB' },
  { href: 'https://www.supertext.com/de-CH/datenschutz', label: 'Datenschutzerklärung' },
]

const SOCIAL = [
  {
    href: 'https://www.linkedin.com/company/supertext-group/',
    label: 'LinkedIn',
    src: 'https://cdn.supertext.com/staticfiles/linkedin-brands-solid.svg',
  },
  {
    href: 'https://www.meetup.com/language-ai-meetup/',
    label: 'Meetup',
    src: 'https://cdn.supertext.com/staticfiles/meetup.svg',
  },
  {
    href: 'https://www.youtube.com/@supertext',
    label: 'YouTube',
    src: 'https://cdn.supertext.com/staticfiles/youtube-brands-solid.svg',
  },
]

export default function SiteFooter() {
  return (
    <footer className="bg-primary-default">
      <div className="max-w-[1200px] w-full mx-auto flex flex-wrap justify-between items-center gap-[30px] px-5 py-10 text-white text-sm">
        <div>&copy; 2026 Supertext AG</div>

        <div className="flex flex-wrap items-center gap-4">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-white no-underline hover:text-secondary-default hover:underline transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {SOCIAL.map((s) => (
            <a key={s.href} href={s.href} aria-label={s.label} className="inline-flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.label} width={20} height={20} className="invert" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
