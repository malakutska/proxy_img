const http = require('http');
const https = require('https');
const { URL } = require('url');

const server = http.createServer((req, res) => {
  // Устанавливаем заголовки CORS для разрешения доступа с любого домена
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Поддержка предварительных запросов (preflight)
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let imageUrl = parsedUrl.pathname;

  // Проверяем, содержит ли URL "https://api.lampishe.cc/"
  if (imageUrl.includes('https://api.lampishe.cc/')) {
    // Обрезаем URL, оставляя только путь к изображению
    imageUrl = imageUrl.replace('https://api.lampishe.cc/', '/');
  }

  // Проксирование запросов к изображениям
  const request = https.get(`https://image.tmdb.org${imageUrl}`, (response) => {
    const contentType = response.headers['content-type'];

    if (response.statusCode !== 200) {
      console.error('\x1b[31m', `Unsuccessful request: ${imageUrl}, status: ${response.statusCode}`);
      res.writeHead(404);
      res.end();
      return;
    }

    if (contentType && contentType.startsWith('image/')) {
      res.setHeader('Content-Type', contentType);
      response.pipe(res);
    } else {
      console.error('\x1b[31m', `Not an image: ${imageUrl}`);
      res.writeHead(404);
      res.end();
    }
  });

  request.on('error', (err) => {
    console.error('\x1b[31m', `Request error: ${err.message}`);
    res.writeHead(500);
    res.end();
  });
});

// Порт указывать не нужно, GitHub Actions предоставит соответствующий порт в переменной среды
server.listen(() => {
  console.log('\x1b[36m', `Proxy server is listening on port ${process.env.PORT || 3000}`);
});
