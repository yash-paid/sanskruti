const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = parseInt(process.env.PORT, 10) || 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.download': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '': 'text/css'
};

function scanFolder(folderName) {
    const targetDir = path.join(BASE_DIR, folderName);
    if (!fs.existsSync(targetDir)) {
        return [];
    }

    const catalogsMap = {};
    const getOrInitCatalog = (id, title) => {
        if (!catalogsMap[id]) {
            catalogsMap[id] = {
                id: String(id),
                title: title || `Catalog ${id}`,
                cover: null,
                photos: [],
                videos: []
            };
        }
        return catalogsMap[id];
    };

    try {
        const entries = fs.readdirSync(targetDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isFile()) {
                const fileName = entry.name;
                const ext = path.extname(fileName).toLowerCase();
                const isVideo = ['.mp4', '.webm', '.mov'].includes(ext);
                const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);

                if (!isVideo && !isImage) continue;

                const fileUrl = `/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`;

                // Check cover: "catelog 1-1.jpg", "catalog 2.jpg", "catelog 1.jpg"
                const coverMatch = fileName.match(/(?:catelog|catalog)[_\s-]*(\d+)(?:[_\s-]+(\d+))?/i);
                if (coverMatch) {
                    const catId = coverMatch[1];
                    const cat = getOrInitCatalog(catId, `Catalog ${catId}`);
                    if (!cat.cover) cat.cover = fileUrl;
                    continue;
                }

                // Check item: "1-1.jpg", "1-40.jpg", "2-3.mp4"
                const itemMatch = fileName.match(/^(\d+)[_\s-]+(\d+)\./i);
                if (itemMatch) {
                    const catId = itemMatch[1];
                    const itemNum = parseInt(itemMatch[2], 10);
                    const cat = getOrInitCatalog(catId, `Catalog ${catId}`);
                    const itemObj = {
                        name: `${catId}-${itemNum}`,
                        num: itemNum,
                        url: fileUrl,
                        type: isVideo ? 'video' : 'photo'
                    };
                    if (isVideo) cat.videos.push(itemObj);
                    else cat.photos.push(itemObj);
                    continue;
                }

                // Default fallback
                const defaultCat = getOrInitCatalog('1', 'Catalog 1');
                const defaultItem = {
                    name: fileName.replace(/\.[^/.]+$/, ''),
                    num: 999,
                    url: fileUrl,
                    type: isVideo ? 'video' : 'photo'
                };
                if (isVideo) defaultCat.videos.push(defaultItem);
                else defaultCat.photos.push(defaultItem);

            } else if (entry.isDirectory()) {
                const subDirName = entry.name;
                const subDirPath = path.join(targetDir, subDirName);
                const subMatch = subDirName.match(/(\d+)/);
                const catId = subMatch ? subMatch[1] : subDirName;
                const cat = getOrInitCatalog(catId, subDirName);

                try {
                    const subEntries = fs.readdirSync(subDirPath);
                    for (const subFile of subEntries) {
                        const ext = path.extname(subFile).toLowerCase();
                        const isVideo = ['.mp4', '.webm', '.mov'].includes(ext);
                        const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
                        if (!isVideo && !isImage) continue;

                        const fileUrl = `/${encodeURIComponent(folderName)}/${encodeURIComponent(subDirName)}/${encodeURIComponent(subFile)}`;
                        if (subFile.toLowerCase().includes('cover') || subFile.toLowerCase().includes('catelog') || subFile.toLowerCase().includes('catalog')) {
                            cat.cover = fileUrl;
                        } else {
                            const itemNumMatch = subFile.match(/(\d+)/);
                            const itemNum = itemNumMatch ? parseInt(itemNumMatch[1], 10) : 0;
                            const itemObj = {
                                name: subFile.replace(/\.[^/.]+$/, ''),
                                num: itemNum,
                                url: fileUrl,
                                type: isVideo ? 'video' : 'photo'
                            };
                            if (isVideo) cat.videos.push(itemObj);
                            else cat.photos.push(itemObj);
                        }
                    }
                } catch (err) {}
            }
        }
    } catch (err) {
        console.error('Error scanning folder ' + folderName + ':', err);
    }

    const result = Object.values(catalogsMap).map(cat => {
        cat.photos.sort((a, b) => a.num - b.num);
        cat.videos.sort((a, b) => a.num - b.num);
        if (!cat.cover) {
            cat.cover = (cat.photos[0] && cat.photos[0].url) || (cat.videos[0] && cat.videos[0].url) || '';
        }
        cat.totalPhotos = cat.photos.length;
        cat.totalVideos = cat.videos.length;
        return cat;
    });

    result.sort((a, b) => (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0));
    return result;
}

function createServer() {
    return http.createServer((req, res) => {
        const fullUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
        const pathname = decodeURI(fullUrl.pathname);

        if (pathname === '/api/catalogs' || pathname === '/api/media') {
            const category = fullUrl.searchParams.get('category') || 'all';
            let folderName = 'photo and video 2';
            if (category === 'videos') {
                folderName = 'videos 2';
            } else if (category === 'photos') {
                folderName = 'photos 2';
            }

            const catalogs = scanFolder(folderName);
            res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                category: category,
                folder: folderName,
                catalogs: catalogs
            }));
            return;
        }

        let reqUrl = pathname;
        if (reqUrl === '/' || reqUrl === '') {
            reqUrl = '/index.html';
        }

        let filePath = path.join(BASE_DIR, reqUrl);

        if (!filePath.startsWith(BASE_DIR)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Access Denied');
            return;
        }

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                // /chat is an alias for the WA Meet page
                if (reqUrl === '/chat' && fs.existsSync(path.join(BASE_DIR, 'WA Meet.html'))) {
                    filePath = path.join(BASE_DIR, 'WA Meet.html');
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('File Not Found');
                    return;
                }
            }

            const ext = path.extname(filePath).toLowerCase();
            let contentType = MIME_TYPES[ext] || 'application/octet-stream';
            if (filePath.endsWith('icon')) {
                contentType = 'text/css; charset=utf-8';
            }

            if (ext === '.mp4') {
                const range = req.headers.range;
                const fileSize = stats.size;
                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunksize = (end - start) + 1;
                    const file = fs.createReadStream(filePath, {start, end});
                    const head = {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize,
                        'Content-Type': 'video/mp4',
                    };
                    res.writeHead(206, head);
                    file.pipe(res);
                    return;
                } else {
                    const head = {
                        'Content-Length': fileSize,
                        'Content-Type': 'video/mp4',
                        'Accept-Ranges': 'bytes',
                    };
                    res.writeHead(200, head);
                    fs.createReadStream(filePath).pipe(res);
                    return;
                }
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Access-Control-Allow-Origin': '*'
            });

            fs.createReadStream(filePath).pipe(res);
        });
    });
}

function startListening(port) {
    const server = createServer();
    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} in use, trying port ${port + 1}...`);
            startListening(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });

    server.listen(port, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 WA Meet is running on localhost!`);
        console.log(`👉 http://localhost:${port}/`);
        console.log(`👉 http://localhost:${port}/WA%20Meet.html`);
        console.log(`======================================================\n`);
    });
}

startListening(PORT);
if (PORT !== 8000) {
    startListening(8000);
}
