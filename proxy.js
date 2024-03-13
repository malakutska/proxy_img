import { serve } from 'https://deno.land/std/http/server.ts';

const server = serve({ port: 8000 });

console.log('\x1b[36m', 'Proxy server is listening on port 8000');

// Функция для обработки запроса
async function handleRequest(req) {
  // Устанавливаем заголовки CORS для разрешения доступа с любого домена
  await req.respond({
    status: 200,
    headers: new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }),
  });

  if (req.method === 'OPTIONS') {
    // Поддержка предварительных запросов (preflight)
    return;
  }

  const imageUrl = new URL(req.url).pathname;

  // Проверяем, содержит ли URL "https://api.lampishe.cc/"
  if (imageUrl.includes('https://api.lampishe.cc/')) {
    // Обрезаем URL, оставляя только путь к изображению
    imageUrl.replace('https://api.lampishe.cc/', '/');
  }

  // Проксирование запросов к изображениям
  const requestOptions = {
    hostname: 'image.tmdb.org',
    path: imageUrl,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(`https://${requestOptions.hostname}${requestOptions.path}`, {
      method: requestOptions.method,
      headers: new Headers(requestOptions.headers),
    });

    const contentType = response.headers.get('content-type');

    if (response.status !== 200) {
      console.error('\x1b[31m', `Unsuccessful request: ${imageUrl}, status: ${response.status}`);
      return;
    }

    if (contentType && contentType.startsWith('image/')) {
      const body = new Uint8Array(await response.arrayBuffer());
      await req.respond({
        status: 200,
        headers: new Headers({
          'Content-Type': contentType,
        }),
        body,
      });
    } else {
      console.error('\x1b[31m', `Not an image: ${imageUrl}`);
    }
  } catch (err) {
    console.error('\x1b[31m', `Request error: ${err.message}`);
  }
}

// Обработка запросов
for await (const req of server) {
  handleRequest(req);
}
