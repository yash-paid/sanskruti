/**
 * Syncs legacy services (/service, /connect, /meeting, /wa.vc, /ps)
 * into ishika/public during Netlify & local builds so both
 * ISHIKA'S WORLD and legacy services live on sanskrutiservice.in.
 */
const fs = require('fs');
const path = require('path');

const ishikaDir = path.resolve(__dirname, '..');
const rootDir = fs.existsSync(path.join(ishikaDir, '..', 'service-meet'))
  ? path.resolve(ishikaDir, '..')
  : ishikaDir;

const publicDir = path.join(ishikaDir, 'public');

console.log('[sync-legacy] Root directory:', rootDir);
console.log('[sync-legacy] Public directory:', publicDir);

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Copy folders
const syncList = [
  { src: path.join(rootDir, 'service-meet'), dest: path.join(publicDir, 'service-meet') },
  { src: path.join(rootDir, 'meeting'), dest: path.join(publicDir, 'meeting') },
  { src: path.join(rootDir, 'wa-vc'), dest: path.join(publicDir, 'wa-vc') },
  { src: path.join(rootDir, 'PS'), dest: path.join(publicDir, 'ps') },
  { src: path.join(rootDir, 'connect', 'dist'), dest: path.join(publicDir, 'connect', 'dist') },
  { src: path.join(rootDir, 'connect', 'dist', 'index.html'), dest: path.join(publicDir, 'connect', 'index.html') },
  { src: path.join(rootDir, 'connect', 'dist', 'assets'), dest: path.join(publicDir, 'connect', 'assets') },
  { src: path.join(rootDir, 'connect', 'dist', 'default-avatars'), dest: path.join(publicDir, 'connect', 'default-avatars') },
];

for (const item of syncList) {
  if (fs.existsSync(item.src)) {
    console.log(`[sync-legacy] Copying ${item.src} -> ${item.dest}`);
    fs.mkdirSync(path.dirname(item.dest), { recursive: true });
    fs.cpSync(item.src, item.dest, { recursive: true, force: true });
  } else {
    console.warn(`[sync-legacy] Warning: Source path does not exist: ${item.src}`);
  }
}

// 2. Generate public/_redirects
const redirectsContent = `# ==============================================================================
# SANSKRUTI SERVICES - CANONICAL ROUTING (ISHIKA'S WORLD + LEGACY PLATFORMS)
# ==============================================================================

# 0. SECURITY
/BACKUP_*                                 /404                                      404!
/backup_*                                 /404                                      404!

# 1. CONNECT PLATFORM (SPA)
/connect/assets/*                         /connect/assets/:splat                    200!
/connect/default-avatars/*                /connect/default-avatars/:splat           200!
/connect/dist/assets/*                    /connect/assets/:splat                    200!
/connect/dist/default-avatars/*           /connect/default-avatars/:splat           200!
/connect                                  /connect/index.html                       200!
/connect/                                 /connect/index.html                       200!
/connect/*                                /connect/index.html                       200!
/assets/*                                 /connect/assets/:splat                    200

# 3. SERVICE PLATFORM
/service/payment-status.html              /service-meet/payment-status.html         200!
/service/payment-status                   /service-meet/payment-status.html         200!
/service/payment_status.html              /service-meet/payment-status.html         200!
/service/payment_status                   /service-meet/payment-status.html         200!
/service                                  /service-meet/index.html                  200!
/service/                                 /service-meet/index.html                  200!
/service/*                                /service-meet/:splat                      200!
/service-meet/*                           /service-meet/:splat                      200!

# 4. MEETING PLATFORM
/meeting/payment-status.html              /meeting/payment-status.html              200!
/meeting/payment-status                   /meeting/payment-status.html              200!
/meeting/payment_status.html              /meeting/payment-status.html              200!
/meeting/payment_status                   /meeting/payment-status.html              200!
/meet                                     /meeting/                                 301
/meet/*                                   /meeting/:splat                           301
/meeting                                  /meeting/                                 301
/meeting/                                 /meeting/index.html                       200
/meeting/*                                /meeting/index.html                       200

# 5. WA.VC PLATFORM
/wa.vc                                    /wa-vc/index.html                         200!
/wa.vc/                                   /wa-vc/index.html                         200!
/wa.vc/index.php                          /wa-vc/index.php.html                     200!
/wa.vc/index.php.html                     /wa-vc/index.php.html                     200!
/wa.vc/WA%20Meet.html                     /wa-vc/WA%20Meet.html                     200!
/wa.vc/live.html                          /wa-vc/live.html                          200!
/wa.vc/live                               /wa-vc/live.html                          200!
/wa.vc/catalogs-all.json                  /wa-vc/catalogs-all.json                  200!
/wa.vc/catalogs-photos.json               /wa-vc/catalogs-photos.json               200!
/wa.vc/catalogs-videos.json               /wa-vc/catalogs-videos.json               200!
/wa.vc/video%20call%20girl.png            /wa-vc/video%20call%20girl.png            200!
/wa.vc/text.png                           /wa-vc/text.png                           200!
/wa.vc/WA%20Meet_files/*                  /wa-vc/WA%20Meet_files/:splat             200!
/wa.vc/index.php_files/*                  /wa-vc/index.php_files/:splat             200!
/wa.vc/photos/*                           /wa-vc/photos/:splat                      200!
/wa.vc/videos/*                           /wa-vc/videos/:splat                      200!
/wa.vc/photo%20and%20video%202/*          /wa-vc/photo%20and%20video%202/:splat     200!
/wa.vc/photos%202/*                       /wa-vc/photos%202/:splat                  200!
/wa.vc/videos%202/*                       /wa-vc/videos%202/:splat                  200!
/wa.vc/*                                  /wa-vc/:splat                             200!
/wa-vc/*                                  /wa-vc/:splat                             200!

# 6. PLAYSTATION EVENT PLATFORM
/ps                                       /ps/index.html                            200!
/ps/                                      /ps/index.html                            200!
/ps/*                                     /ps/:splat                                200!
/PS                                       /ps/index.html                            301!
/PS/                                      /ps/index.html                            301!
/PS/*                                     /ps/:splat                                301!
`;

const redirectsPath = path.join(publicDir, '_redirects');
fs.writeFileSync(redirectsPath, redirectsContent.trim() + '\n', 'utf8');
console.log('[sync-legacy] Wrote _redirects to', redirectsPath);
console.log('[sync-legacy] Complete!');
