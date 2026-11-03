# Security notes

- Strict Content Security Policy: only this site's own files may run; no third-party scripts, fonts or trackers.
- No inline scripts, no inline event handlers; all dynamic text is HTML-escaped.
- No accounts, no analytics, no network calls except loading this site's own files. Progress is stored only in the browser on your device.
- Referrer is never sent. Service worker only handles same-origin GET requests.
- Keep GitHub two-factor authentication enabled for the repository owner, and never commit secrets (there are none in this project).
