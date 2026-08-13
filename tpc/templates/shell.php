<?php
/**
 * Tab shell. Renders the nav and one panel per tab.
 *
 * Expects $tabs — an ordered array of tab slugs, already validated against
 * RHC_TPC_TAB_LABELS by rhc_tpc_render(). The first tab is the active one.
 *
 * Panel bodies live in templates/partials/tab-{slug}.html. They are plain HTML
 * (no PHP) so that tools/build-static.mjs can inline the same files into the
 * standalone demo pages — one copy of the markup, two consumers.
 */
if ( ! defined( 'ABSPATH' ) ) exit;
?>
<div class="rhc-tpc">

<div class="tab-nav">
<?php foreach ( $tabs as $i => $slug ) : ?>
  <button class="tab-btn<?php echo 0 === $i ? ' active' : ''; ?>" onclick="rhcTpcSwitchTab('<?php echo esc_attr( $slug ); ?>', this)"><?php echo esc_html( RHC_TPC_TAB_LABELS[ $slug ] ); ?></button>
<?php endforeach; ?>
</div>

<?php foreach ( $tabs as $i => $slug ) : ?>
<div id="rhc-tab-<?php echo esc_attr( $slug ); ?>" class="tab-panel<?php echo 0 === $i ? ' active' : ''; ?>">
  <div class="panel-inner">
<?php include RHC_TPC_PATH . 'templates/partials/tab-' . $slug . '.html'; ?>
  </div>
</div>
<?php endforeach; ?>

</div><!-- /.rhc-tpc -->
