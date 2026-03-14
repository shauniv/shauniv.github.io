<?php
/**
 * Plugin Name: Rene Herse Tire Pressure Calculator
 * Plugin URI:  https://www.renehersecycles.com
 * Description: Tire pressure calculator for Rene Herse Cycles — Simple, Pro, and Tire Finder modes. Use the [tire_pressure_calculator] shortcode.
 * Version:     1.0.0
 * Author:      Rene Herse Cycles
 * License:     GPL-2.0-or-later
 * Text Domain: rhc-tire-pressure
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'RHC_TPC_VERSION', '1.0.0' );
define( 'RHC_TPC_DIR', plugin_dir_path( __FILE__ ) );
define( 'RHC_TPC_URL', plugins_url( '', __FILE__ ) );

/**
 * Enqueue plugin styles and scripts.
 * Called from the shortcode so assets only load on pages that use it.
 */
function rhc_tpc_enqueue_assets() {
	wp_enqueue_style(
		'rhc-tpc-fonts',
		'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap',
		[],
		null
	);
	wp_enqueue_style(
		'rhc-tpc-style',
		RHC_TPC_URL . '/assets/tire-pressure-calculator.css',
		[ 'rhc-tpc-fonts' ],
		RHC_TPC_VERSION
	);
	wp_enqueue_script(
		'rhc-tpc-script',
		RHC_TPC_URL . '/assets/tire-pressure-calculator.js',
		[],
		RHC_TPC_VERSION,
		true // load in footer
	);
}

/**
 * Shortcode handler: [tire_pressure_calculator]
 */
function rhc_tpc_shortcode() {
	rhc_tpc_enqueue_assets();
	ob_start();
	include RHC_TPC_DIR . 'templates/calculator.php';
	return ob_get_clean();
}
add_shortcode( 'tire_pressure_calculator', 'rhc_tpc_shortcode' );
