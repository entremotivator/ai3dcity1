<?php
/**
 * Plugin Name: WP Iframe Cookie Fix
 * Description: Helps WordPress auth cookies work inside trusted HTTPS iframes by adding SameSite=None; Secure to WP auth cookies and allowing selected frame parents.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Force HTTPS admin cookies.
 */
add_action('init', function () {
    if (!defined('FORCE_SSL_ADMIN')) {
        define('FORCE_SSL_ADMIN', true);
    }
}, 1);

/**
 * Allow trusted iframe parents.
 * Edit these domains.
 */
add_action('send_headers', function () {
    $allowed_frame_parents = [
        "'self'",
        "https://entremotivator.com",
        "https://www.entremotivator.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3006",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3006",
        "http://127.0.0.1:5173",
    ];

    header_remove('X-Frame-Options');

    header(
        "Content-Security-Policy: frame-ancestors " . implode(' ', $allowed_frame_parents) . ";"
    );
}, 20);

/**
 * Add SameSite=None; Secure to WordPress auth/login cookies.
 */
add_action('plugins_loaded', function () {
    header_register_callback(function () {
        $headers = headers_list();
        $set_cookie_headers = [];

        foreach ($headers as $header) {
            if (stripos($header, 'Set-Cookie:') === 0) {
                $set_cookie_headers[] = $header;
            }
        }

        if (empty($set_cookie_headers)) {
            return;
        }

        header_remove('Set-Cookie');

        foreach ($headers as $header) {
            if (stripos($header, 'Set-Cookie:') !== 0) {
                continue;
            }

            $cookie_line = trim(substr($header, strlen('Set-Cookie:')));

            $is_wp_cookie =
                stripos($cookie_line, 'wordpress_') === 0 ||
                stripos($cookie_line, 'wp-settings-') === 0 ||
                stripos($cookie_line, 'wordpress_logged_in_') === 0 ||
                stripos($cookie_line, 'wordpress_test_cookie') === 0;

            if ($is_wp_cookie) {
                if (stripos($cookie_line, 'SameSite=') === false) {
                    $cookie_line .= '; SameSite=None';
                }

                if (stripos($cookie_line, 'Secure') === false) {
                    $cookie_line .= '; Secure';
                }

                if (stripos($cookie_line, 'HttpOnly') === false && stripos($cookie_line, 'wp-settings-') !== 0) {
                    $cookie_line .= '; HttpOnly';
                }
            }

            header('Set-Cookie: ' . $cookie_line, false);
        }
    });
});
