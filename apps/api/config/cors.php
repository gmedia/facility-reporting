<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173'), 'http://127.0.0.1:5173'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    // `XSRF-TOKEN` diekspos lewat CORS supaya web bisa membaca token CSRF
    // dari response /sanctum/csrf-cookie. API mengirimnya sebagai header
    // (ExposeCsrfTokenHeader) karena cookie-nya milik domain API dan tidak
    // terlihat oleh `document.cookie` di domain web.
    'exposed_headers' => ['XSRF-TOKEN'],
    'max_age' => 0,
    'supports_credentials' => true,
];
