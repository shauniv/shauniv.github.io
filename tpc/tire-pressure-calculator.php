<?php
/**
 * Plugin Name:  Rene Herse Tire Pressure Calculator
 * Plugin URI:   https://github.com/shauniv/TirePressureCalculator
 * Description:  Interactive tire pressure calculator for Rene Herse Cycles.
 * Version:      1.0.6
 * Author:       Rene Herse Cycles
 * License:      Proprietary
 * Text Domain:  tire-pressure-calculator
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'RHC_TPC_VERSION', '1.0.6' );
define( 'RHC_TPC_PATH',    plugin_dir_path( __FILE__ ) );
define( 'RHC_TPC_URL',     plugin_dir_url( __FILE__ ) );

// ── Update checker ────────────────────────────────────────────────────────────
// Checks https://github.com/shauniv/TirePressureCalculator for new releases and
// surfaces updates inside WP Admin → Plugins like any standard plugin.
//
// For private-repo access, add this line to the site's wp-config.php:
//   define( 'RHC_TPC_GITHUB_TOKEN', 'ghp_your_token_here' );
//
require_once RHC_TPC_PATH . 'vendor/autoload.php';

add_action( 'init', function () {
    $checker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
        'https://github.com/shauniv/TirePressureCalculator/',
        __FILE__,
        'tire-pressure-calculator'
    );
    $checker->getVcsApi()->enableReleaseAssets(); // use the ZIP attached to each release
    if ( defined( 'RHC_TPC_GITHUB_TOKEN' ) ) {
        $checker->setAuthentication( RHC_TPC_GITHUB_TOKEN );
    }
} );

// ── Assets ────────────────────────────────────────────────────────────────────
// Only loaded on pages that contain the shortcode.
// Note: this check does not cover page-builder blocks or widgets; if you use
// those, add  define( 'RHC_TPC_FORCE_ENQUEUE', true );  to wp-config.php.
//
add_action( 'wp_enqueue_scripts', function () {
    global $post;
    $in_content = is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'tire_pressure_calculator' );
    if ( ! $in_content && ! ( defined( 'RHC_TPC_FORCE_ENQUEUE' ) && RHC_TPC_FORCE_ENQUEUE ) ) {
        return;
    }

    wp_enqueue_style(
        'rhc-tpc-fonts',
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Open+Sans:wght@300;400;500;600;700;800&display=swap',
        [],
        null
    );
    wp_enqueue_style(
        'rhc-tpc',
        RHC_TPC_URL . 'tire-pressure-calculator/assets/tire-pressure-calculator.css',
        [ 'rhc-tpc-fonts' ],
        RHC_TPC_VERSION
    );
    wp_enqueue_script(
        'rhc-tpc',
        RHC_TPC_URL . 'tire-pressure-calculator/assets/tire-pressure-calculator.js',
        [],
        RHC_TPC_VERSION,
        true // load in footer
    );
} );

// ── Shortcode: [tire_pressure_calculator] ────────────────────────────────────
add_shortcode( 'tire_pressure_calculator', function () {
    ob_start();
    include RHC_TPC_PATH . 'templates/calculator.php';
    return ob_get_clean();
} );
