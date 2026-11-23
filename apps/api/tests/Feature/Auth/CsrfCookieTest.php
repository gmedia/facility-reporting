<?php

declare(strict_types=1);

use function Pest\Laravel\get;

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');
});

it('exposes the csrf token as a response header', function (): void {
    $response = get('/sanctum/csrf-cookie');

    $response->assertNoContent();

    $header = $response->headers->get('XSRF-TOKEN');
    $cookie = collect($response->headers->getCookies())
        ->first(fn ($cookie) => $cookie->getName() === 'XSRF-TOKEN');

    expect($header)->not->toBeNull()
        ->and($cookie)->not->toBeNull()
        ->and($header)->toBe($cookie->getValue());
});
