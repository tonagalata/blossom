import Link from 'next/link'
import { getInstagramPosts } from '@/lib/instagram'

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default async function Footer() {
  const posts = await getInstagramPosts(8)

  return (
    <>
      {posts.length > 0 && (
        <section className="instagram-feed">
          <a
            href="https://www.instagram.com/eventsinbloomdmv"
            target="_blank"
            rel="noopener noreferrer"
            className="instagram-feed-heading"
          >
            <InstagramIcon />
            @eventsinbloomdmv
          </a>
          <div className="instagram-feed-grid">
            {posts.map(post => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="instagram-feed-item"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.mediaUrl} alt={post.caption ?? 'Instagram post'} />
              </a>
            ))}
          </div>
        </section>
      )}
      <footer>
      <div className="footer-grid">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo_w.svg" alt="Events in Bloom" className="footer-logo-img" />
          <p className="footer-tagline">
            Floral arrangements, event styling, backdrop rentals, and in-home subscriptions — blooms for every occasion.
          </p>
          <div className="footer-contact">
            <a href="tel:+14438775828" className="footer-contact-link">443-877-5828</a>
            <a href="mailto:eventsinbloomdmv@gmail.com" className="footer-contact-link">eventsinbloomdmv@gmail.com</a>
          </div>
        </div>
        <div>
          <h4 className="footer-heading">Navigate</h4>
          <ul className="footer-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/portfolio">Portfolio</Link></li>
            <li><Link href="/inquiry">Inquire</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="footer-heading">Connect</h4>
          <ul className="footer-links">
            <li>
              <a
                href="https://www.instagram.com/eventsinbloomdmv"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
              >
                <InstagramIcon />
                @eventsinbloomdmv
              </a>
            </li>
            <li><Link href="/inquiry">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 Events in Bloom. All rights reserved.</span>
        <span>Bethesda, MD</span>
      </div>
      </footer>
    </>
  )
}
