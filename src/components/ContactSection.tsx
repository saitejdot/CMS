export default function ContactSection() {
  const socials = [
    {
      label: "Email",
      value: "nagasaiteja.info@gmail.com",
      href: "mailto:nagasaiteja.info@gmail.com",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      value: "@saitejdot",
      href: "https://instagram.com/saitejdot",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.31.975.975 1.248 2.242 1.31 3.608.058 1.265.07 1.645.07 4.849s-.012 3.584-.07 4.85c-.062 1.366-.335 2.633-1.31 3.608-.975.975-2.242 1.248-3.608 1.31-1.265.058-1.645.07-4.849.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.335-3.608-1.31-.975-.975-1.248-2.242-1.31-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.335-2.633 1.31-3.608.975-.975 2.242-1.248 3.608-1.31C8.416 2.175 8.796 2.163 12 2.163M12 0C8.741 0 8.333.014 7.053.072 5.775.13 4.602.44 3.635 1.407 2.667 2.374 2.358 3.547 2.3 4.825 2.242 6.105 2.228 6.513 2.228 12c0 5.488.014 5.895.072 7.175.058 1.278.368 2.451 1.335 3.418.967.967 2.14 1.277 3.418 1.335C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.058 2.451-.368 3.418-1.335.967-.967 1.277-2.14 1.335-3.418.058-1.28.072-1.687.072-7.175 0-5.487-.014-5.895-.072-7.175-.058-1.278-.368-2.451-1.335-3.418C19.398.44 18.225.13 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      value: "naga-sai-teja-bollimuntha",
      href: "https://www.linkedin.com/in/naga-sai-teja-bollimuntha",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M20.447 20.452H16.89v-5.569c0-1.328-.024-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.98 1.98 0 1 1 0-3.96 1.98 1.98 0 0 1 0 3.96zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      label: "GitHub",
      value: "saitejdot",
      href: "https://github.com/saitejdot",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.625-5.48 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="border-t mt-8" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-lg mx-auto px-8 py-8 text-center">

        {/* Logo */}
        <div className="logo text-2xl mb-1" style={{ display: "flex", justifyContent: "center" }}>
          Naga Sai Teja
        </div>

        {/* Tagline */}
        <p className="text-xs tracking-widest uppercase mb-10" style={{ color: "var(--muted)" }}>
          Blogger · Developer · Fitness
        </p>

        {/* 2×2 grid: left column = items 0,1 | right column = items 2,3 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 3rem" }}>
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "var(--text)" }}
              className="contact-grid-item"
            >
              <span className="contact-grid-icon">{s.icon}</span>
              <span className="contact-grid-text">
                <span className="contact-grid-label">{s.label}</span>
                <span className="contact-grid-value">{s.value}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
