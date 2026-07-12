<?php
/**
 * Uninstall cleanup for V0Map NPC Gallery.
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

delete_option('v0map_npc_gallery_options');
