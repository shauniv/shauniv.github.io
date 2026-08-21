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

// ── Tabs ──────────────────────────────────────────────────────────────────────
// Slug → visible label. Each slug needs a matching templates/partials/tab-{slug}.html.
// Slugs are also the DOM ids (rhc-tab-{slug}) and the argument to rhcTpcSwitchTab();
// if a tab has inputs, the JS needs a matching entry in TAB_PREFIX / TAB_IDS.
//
define( 'RHC_TPC_TAB_LABELS', [
    'simple'       => 'Simple',
    'pro'          => 'Pro',
    'tire-finder'  => 'Tire Finder',
    'width-finder' => 'How Wide Should I Run?',
    'clearance'    => 'Will It Fit?',
] );

// Which shortcode renders which tabs, in display order.
define( 'RHC_TPC_SHORTCODES', [
    'tire_pressure_calculator' => [ 'simple', 'pro' ],
    'tire_finder'              => [ 'tire-finder', 'width-finder', 'clearance' ],
] );

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
    $in_content = false;
    if ( is_a( $post, 'WP_Post' ) ) {
        foreach ( array_keys( RHC_TPC_SHORTCODES ) as $tag ) {
            if ( has_shortcode( $post->post_content, $tag ) ) {
                $in_content = true;
                break;
            }
        }
    }
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

// ── Shortcodes ────────────────────────────────────────────────────────────────
// [tire_pressure_calculator] → Simple + Pro
// [tire_finder]              → Tire Finder + How Wide Should I Run?
//
// Both render the same shell from the same partials; only the tab list differs.
// The `tabs` attribute overrides the default set, e.g.
//   [tire_finder tabs="width-finder"]
// which lets tabs be moved between pages from the editor, without a release.
//
function rhc_tpc_render( array $tabs ) {
    // Drop unknown slugs so a typo in the editor can't fatal on a missing partial.
    $tabs = array_values( array_intersect( $tabs, array_keys( RHC_TPC_TAB_LABELS ) ) );
    if ( ! $tabs ) {
        return '';
    }
    ob_start();
    include RHC_TPC_PATH . 'templates/shell.php'; // consumes $tabs
    return ob_get_clean();
}

foreach ( RHC_TPC_SHORTCODES as $rhc_tpc_tag => $rhc_tpc_default_tabs ) {
    add_shortcode( $rhc_tpc_tag, function ( $atts ) use ( $rhc_tpc_default_tabs ) {
        $atts = shortcode_atts( [ 'tabs' => implode( ',', $rhc_tpc_default_tabs ) ], $atts );
        return rhc_tpc_render( array_map( 'trim', explode( ',', $atts['tabs'] ) ) );
    } );
}
unset( $rhc_tpc_tag, $rhc_tpc_default_tabs );
