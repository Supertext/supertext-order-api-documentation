// Site header matching supertext.com's account pages: a sticky dark-green bar
// with the Supertext wordmark linking home. Brand assets are referenced from the
// Supertext CDN (the same URLs the live site uses).
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-primary-default rounded-b-[15px]">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-11 py-3.5">
        <nav>
          <a href="https://www.supertext.com" aria-label="Supertext" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.supertext.com/staticfiles/Supertext_Wordmark_Glow_Light_Green_RGB.png"
              alt="Supertext"
              width={180}
              height={35}
              className="h-[35px] w-auto"
            />
          </a>
        </nav>
      </div>
    </header>
  )
}
