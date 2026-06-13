const LINKS = [
  ["#/faq", "Help & resources"],
  ["#/disclaimer", "Disclaimer"],
  ["#/privacy", "Privacy"],
  ["#/terms", "Terms"],
];

export default function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-ink/10 bg-paper px-4 py-2 text-xs text-ink/50">
      {LINKS.map(([href, label]) => (
        <a key={href} href={href} className="hover:text-slateblue hover:underline">
          {label}
        </a>
      ))}
      <span className="text-ink/30">·</span>
      <span>Not legal advice. Complaints are unverified. Not an emergency service.</span>
    </footer>
  );
}
