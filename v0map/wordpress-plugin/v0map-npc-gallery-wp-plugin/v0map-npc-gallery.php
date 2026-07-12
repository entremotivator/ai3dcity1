<?php
/**
 * Plugin Name: V0Map NPC Gallery
 * Plugin URI: https://example.com/v0map-npc-gallery
 * Description: Embed and manage the upgraded V0Map NPC Gallery app with exact live WordPress shortcode NPC windows, server-side REST/API feature sync, iframe cookie fixes, API health panels, content pulling, full API feature suite pulling, endpoint diagnostics, plugin/theme summaries, shortcode provider grouping, command-center payloads, shortcode search, render URL validation, connection repair hints, and one-window-at-a-time rendering, voice-command metadata, shortcode menu handoff, and live Next.js command-center integration, voice-created NPC metadata, importable 25/50/100 team presets, city voice commands, and 3D feature-builder route metadata, realtime live/dictation voice modes, project-management window templates, daily checklist payloads, habit tracker imports, and NPC movement command metadata, v25 command parsing metadata, project sprint imports, advanced habit templates, realtime voice command-suite endpoints, NPC movement playbook endpoints, v28 realistic NPC walking with turn-in-place and crowd separation, NPC gesture voice commands (wave/nod/point/cheer/clap/think/salute), named room navigation across all floors (lobby, cafe, boardroom, focus pods, arcade lounge, media wall, rooftop garden, helipad), a live in-app editable NPC directory with browser persistence, and pointer-lock/movement stability fixes.
 * Version: 1.24.0
 * Author: V0Map
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: v0map-npc-gallery
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('FORCE_SSL_ADMIN')) {
    define('FORCE_SSL_ADMIN', true);
}

define('V0MAP_NPC_GALLERY_VERSION', '1.24.0');
define('V0MAP_NPC_GALLERY_FILE', __FILE__);
define('V0MAP_NPC_GALLERY_DIR', plugin_dir_path(__FILE__));
define('V0MAP_NPC_GALLERY_URL', plugin_dir_url(__FILE__));

final class V0Map_NPC_Gallery_Plugin {
    private const OPTION_NAME = 'v0map_npc_gallery_options';
    private const PAGES_OPTION_NAME = 'v0map_npc_gallery_pages';
    private const REST_NAMESPACE = 'v0map-npc/v1';
    private const FAPC_REST_NAMESPACE = 'fapc/v1';

    private static ?V0Map_NPC_Gallery_Plugin $instance = null;

    public static function instance(): V0Map_NPC_Gallery_Plugin {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', [$this, 'register_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('init', [$this, 'maybe_migrate_options'], 5);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('wp_enqueue_scripts', [$this, 'register_frontend_assets']);
        add_action('template_redirect', [$this, 'maybe_render_shortcode_page']);
        add_action('send_headers', [$this, 'send_iframe_parent_headers'], 20);
        add_action('plugins_loaded', [$this, 'register_iframe_cookie_callback']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_filter('rest_pre_serve_request', [$this, 'send_rest_cors_headers'], 10, 4);
        add_shortcode('v0map_gallery', [$this, 'render_gallery_shortcode']);
        add_shortcode('v0map_npc_launcher', [$this, 'render_launcher_shortcode']);
        add_shortcode('v0map_npc_window', [$this, 'render_npc_window_shortcode']);
        add_shortcode('v0map_npc_windows', [$this, 'render_npc_windows_shortcode']);
        add_shortcode('v0map_shortcode_dashboard', [$this, 'render_shortcode_dashboard_shortcode']);
        add_shortcode('v0map_npc_live_dashboard', [$this, 'render_live_dashboard_shortcode']);
        add_shortcode('v0map_npc_api_dashboard', [$this, 'render_api_dashboard_shortcode']);
        add_shortcode('v0map_agent_dashboard', [$this, 'render_agent_dashboard_shortcode']);
    }

    public static function activate(): void {
        $defaults = self::default_options();
        $existing = get_option(self::OPTION_NAME, []);
        $options = wp_parse_args(is_array($existing) ? $existing : [], $defaults);
        $options['plugin_version'] = V0MAP_NPC_GALLERY_VERSION;
        $options['npc_windows'] = self::default_npc_window_lines();
        update_option(self::OPTION_NAME, $options);
        self::create_dashboard_pages();
    }

    public static function uninstall(): void {
        delete_option(self::OPTION_NAME);
    }

    public static function default_options(): array {
        return [
            'plugin_version' => V0MAP_NPC_GALLERY_VERSION,
            'app_url' => 'https://entremotivator.com',
            'localhost_world_url' => 'http://localhost:3006',
            'default_domain' => 'entremotivator.com',
            'iframe_height' => '720',
            'open_new_tab' => '1',
            'show_toolbar' => '1',
            'allow_fullscreen' => '1',
            'persist_local_session' => '1',
            'auth_sync' => '1',
            'npc_sync' => '1',
            'live_connection' => '1',
            'auto_create_pages' => '1',
            'api_auth_required' => '1',
            'connection_title' => 'Live NPC Connection',
            'npc_windows_title' => 'NPC Shortcode Windows',
            'npc_windows' => self::default_npc_window_lines(),
            'title' => 'V0Map NPC Gallery',
            'description' => 'Explore the AI NPC gallery, teams, floor manager, rooftop deck, and live WordPress shortcode-powered NPC windows.',
        ];
    }

    private static function default_npc_window_lines(): string {
        return implode("\n", [
            'CRM HUB|Operators|[matrix_crm_app] [matrix_hub_manager]|https://entremotivator.com/wp-admin/admin.php?page=matrix-crm-mobile-voice|1',
            'Ecom HUB|Operators||https://entremotivator.com/wp-admin/admin.php?page=evai-mobile-studio|2',
            'Community|Operators||https://entremotivator.com/agents/operators/community|3',
            'AI TUBE - Video Manager|Operators|[aitube_home] [aitube_watch] [aitube_upload] [aitube_studio] [aitube_channels] [aitube_shorts] [aitube_trending] [aitube_search] [aitube_library] [aitube_playlists] [aitube_tv] [aitube_mobile_stream] [aitube_video_grid limit="12" type="short"]|https://entremotivator.com/wp-admin/admin.php?page=aitube-dashboard|4',
            'Domains & Servers|Operators||https://entremotivator.com/wp-admin/admin.php?page=twentyi|5',
            'Habit Tracking Manager|Operators||https://entremotivator.com/wp-admin/admin.php?page=habit-tracker-pro|6',
            'OS|Operators||https://entremotivator.com/nexus-os-mobile/|7',
            'Calendar|Managers|[gcva_calendar]|https://entremotivator.com/mobile-calendar-voice-admin/|8',
            'CRM|Managers|[matrix_crm_app] [matrix_hub_manager]|https://entremotivator.com/wp-admin/admin.php?page=matrix-crm-mobile-voice|9',
            'ECOM|Managers||https://entremotivator.com/wp-admin/admin.php?page=evai-mobile-studio|10',
            'Projects|Managers|[pai_projects]|https://entremotivator.com/wp-admin/admin.php?page=pai-mobile|11',
            'Social|Managers||https://entremotivator.com/wp-admin/admin.php?page=social-ai-auto-v51-compose|12',
            'Email|Managers|[aier_admin_dashboard]|https://entremotivator.com/wp-admin/admin.php?page=aism|13',
            'Communications Sync|Managers||https://entremotivator.com/wp-admin/admin.php?page=mobile-agent-command-hub-pages|14',
            'Ads|Managers||https://entremotivator.com/agents/managers/ads|15',
            'Brands|Managers||https://entremotivator.com/wp-admin/admin.php?page=brand-studio-mobile|16',
            'Reputation Management|Managers||https://entremotivator.com/agents/managers/reputation-management|17',
            'SEO|Managers||https://entremotivator.com/wp-admin/admin.php?page=sapai4-dashboard|18',
            'Context 1 Click|Content Creators||https://entremotivator.com/wp-admin/admin.php?page=fkbg-dashboard|19',
            'Audio Studio|Content Creators||https://entremotivator.com/wp-admin/admin.php?page=ai-audio-studios|20',
            'Images One Click|Content Creators||https://entremotivator.com/wp-admin/admin.php?page=fkbg-dashboard|21',
            'Music|Content Creators||https://entremotivator.com/wp-admin/admin.php?page=music-matrix|22',
            'Video Edit|Content Creators|[wpve_video_dashboard]|https://entremotivator.com/wp-admin/admin.php?page=wp-video-editor|23',
            'Video Create|Content Creators||https://entremotivator.com/wp-admin/admin.php?page=seedance-video-gen|24',
            'Social Posting|Content Creators||https://entremotivator.com/wp-admin/admin.php?page=social-ai-auto-v51-compose|25',
            'Video Recorder|Content Creators|[aitube_home] [aitube_upload] [aitube_studio] [aitube_video_grid limit="12" type="short"]|https://entremotivator.com/wp-admin/admin.php?page=aitube-dashboard|26',
            'Blogger|Content Creators||https://entremotivator.com/agents/content-creators/blogger|27',
            'Contract and Docs|Content Creators|[aifp_library] [aifp_template_library] [ai_my_documents] [aifp_user_account]|https://entremotivator.com/wp-admin/admin.php?page=ai-forms-plugin|28',
            'Vibe Out|Content Creators||https://entremotivator.com/wp-admin/admin.php?page=ipb-mobile-voice|29',
            'Credit|Personal Agents|[cap_credit_ai_pro]|https://entremotivator.com/wp-admin/admin.php?page=aiwcs|30',
            'RE|Personal Agents||http://aiagentms.com/wp-admin/admin.php?page=reai-dashboard|31',
            'Med|Personal Agents||https://entremotivator.com/wp-admin/admin.php?page=aiwcs|32',
            'Legal|Personal Agents||https://entremotivator.com/wp-admin/admin.php?page=aiwcs|33',
            'Account|Personal Agents||https://entremotivator.com/wp-admin/admin.php?page=aiwcs|34',
            'Trust|Personal Agents||https://entremotivator.com/wp-admin/admin.php?page=aiwcs|35',
            'Health|Personal Agents||https://entremotivator.com/wp-admin/admin.php?page=aiwcs|36',
            'Prayer Warrior|Personal Agents||https://entremotivator.com/wp-admin/admin.php?page=aiwcs|37',
            'Writer|Personal Agents||https://entremotivator.com/wp-admin/admin.php?page=aiwcs|38',
            'Course|Personal Agents|||39',
            'Coach|Personal Agents||https://entremotivator.com/agents/personal-agents/coach|40',
            'LinkedIn Leads|Unsupervised Agents|[linkedin_metrix]|https://entremotivator.com/wp-admin/admin.php?page=lio-metrix&force=1|41',
            'Map Leads|Unsupervised Agents||https://entremotivator.com/wp-admin/admin.php?page=gmsap-search-panel|42',
            'Auto Drafter Email|Unsupervised Agents||https://entremotivator.com/wp-admin/admin.php?page=aier-dashboard|43',
            'Messenger Marketing|Unsupervised Agents||https://entremotivator.com/agents/unsupervised-agents/messenger-marketing|44',
            'Email Marketing|Unsupervised Agents||https://entremotivator.com/wp-admin/admin.php?page=mrm-admin|45',
            'Outbound Mass Email|Unsupervised Agents||https://entremotivator.com/wp-admin/admin.php?page=aism|46',
            'Grant Finder|Unsupervised Agents||https://entremotivator.com/wp-admin/admin.php?page=grants-api-dashboard|47',
            'Funnel|Unsupervised Agents||https://entremotivator.com/wp-admin/admin.php?page=wpfunnels|48',
            'AI Call Matrix|Unsupervised Agents||http://aiagentms.com/wp-admin/admin.php?page=acm|49',
            'Trading|Unsupervised Agents|[kacc_strategy_lab]|https://entremotivator.com/wp-admin/admin.php?page=kacc-dashboard#metrics|50',
            'WeatherGPT|Unsupervised Agents|||51',
            'Sales Closer|Unsupervised Agents||https://entremotivator.com/wp-admin/admin.php?page=aisc-sales-closer|52',
            'Future Proof|Operators||https://entremotivator.com/wp-admin/admin.php?page=fpaisr-dashboard|53',
            'Video Studio|Content Creators|[wpve_video_dashboard]|https://entremotivator.com/wp-admin/admin.php?page=wp-video-editor|54',
            'Mockup AI|Content Creators||https://entremotivator.com/wp-admin/admin.php?page=ai-mockup-studio|55',
            'AI Mailer|Managers|[aier_admin_dashboard]|https://entremotivator.com/wp-admin/admin.php?page=aism|56',
            'Events|Managers|[MEC_search_bar] [MEC_fes_list] [MEC_userevents]|https://entremotivator.com/wp-admin/admin.php?page=mec-intro|57',
            'BrandGPT|Operators|[bsp_app]|https://entremotivator.com/wp-admin/admin.php?page=brand-studio|58',
            'Whiteboard|Content Creators|[whiteboard_canvas]|https://entremotivator.com/whiteboard/|59',
            'Wealth GPT|Personal Agents|[kacc_strategy_lab]|https://entremotivator.com/wp-admin/admin.php?page=aiwealthgpt|60',
            'AI WealthGPT|Personal Agents|[kacc_strategy_lab]|https://entremotivator.com/wp-admin/admin.php?page=aiwealthgpt|61',
            'AI All Matrix|Operators||https://entremotivator.com/wp-admin/admin.php?page=mobile-agent-command-hub-pages|62',
            'Speaking GIGs|Special Agents|[shp_speaker_directory]|https://entremotivator.com/wp-admin/admin.php?page=speakerhub|63',
            'Tax Credit|Special Agents||https://entremotivator.com/wp-admin/admin.php?page=tcs-dashboard|64',
            'Agent Manager|Special Agents||http://aiagentms.com/wp-admin/admin.php?page=ai-agents-atm|65',
            'QANDDASH|Special Agents|[rvip_v40_phone_cta] [rvip_v40_agent_phone_directory]|https://entremotivator.com/wp-admin/admin.php?page=rvip-dashboard|66',
            'Agent Directory|Special Agents||https://entremotivator.com/wp-admin/admin.php?page=madp-dashboard|67',
            'Futurama|Special Agents|[futurama_ai_full_admin_dashboard] [fai_dashboard]|https://entremotivator.com/wp-admin/admin.php?page=fai-shortcodes|68'
        ]);
    }

    private static function dashboard_page_definitions(): array {
        return [
            'gallery' => [
                'title' => 'V0Map NPC Gallery',
                'slug' => 'v0map-npc-gallery',
                'content' => '[v0map_gallery height="900"]',
            ],
            'npc_windows' => [
                'title' => 'NPC Shortcode Windows',
                'slug' => 'npc-shortcode-windows',
                'content' => '[v0map_npc_windows]',
            ],
            'live_dashboard' => [
                'title' => 'NPC Live Connection Dashboard',
                'slug' => 'npc-live-connection-dashboard',
                'content' => '[v0map_npc_live_dashboard]',
            ],
            'shortcodes' => [
                'title' => 'WordPress Shortcode Dashboard',
                'slug' => 'wordpress-shortcode-dashboard',
                'content' => '[v0map_shortcode_dashboard limit="120"]',
            ],
            'api_dashboard' => [
                'title' => 'NPC API Auth Dashboard',
                'slug' => 'npc-api-auth-dashboard',
                'content' => '[v0map_npc_api_dashboard]',
            ],
        ];
    }

    public static function create_dashboard_pages(): array {
        if (!function_exists('wp_insert_post')) {
            return [];
        }

        $saved = get_option(self::PAGES_OPTION_NAME, []);
        $saved = is_array($saved) ? $saved : [];
        $created = [];

        foreach (self::dashboard_page_definitions() as $key => $page) {
            $existing_id = isset($saved[$key]) ? absint($saved[$key]) : 0;

            if ($existing_id > 0 && get_post_status($existing_id)) {
                $created[$key] = $existing_id;
                continue;
            }

            $existing = get_page_by_path($page['slug']);
            if ($existing instanceof WP_Post) {
                $created[$key] = (int) $existing->ID;
                continue;
            }

            $post_id = wp_insert_post(
                [
                    'post_title' => $page['title'],
                    'post_name' => $page['slug'],
                    'post_content' => $page['content'],
                    'post_status' => 'publish',
                    'post_type' => 'page',
                    'comment_status' => 'closed',
                ],
                true
            );

            if (!is_wp_error($post_id)) {
                $created[$key] = (int) $post_id;
            }
        }

        update_option(self::PAGES_OPTION_NAME, $created);
        return $created;
    }

    private function dashboard_pages(): array {
        $pages = get_option(self::PAGES_OPTION_NAME, []);
        return is_array($pages) ? $pages : [];
    }

    public function options(): array {
        $saved = get_option(self::OPTION_NAME, []);
        return wp_parse_args(is_array($saved) ? $saved : [], self::default_options());
    }

    public function maybe_migrate_options(): void {
        $saved = get_option(self::OPTION_NAME, []);
        if (!is_array($saved)) {
            return;
        }

        if (($saved['plugin_version'] ?? '') === V0MAP_NPC_GALLERY_VERSION) {
            return;
        }

        $options = wp_parse_args($saved, self::default_options());
        $options['plugin_version'] = V0MAP_NPC_GALLERY_VERSION;
        $options['npc_windows'] = self::default_npc_window_lines();
        update_option(self::OPTION_NAME, $options);
        self::create_dashboard_pages();
    }

    public function register_admin_menu(): void {
        add_menu_page(
            __('V0Map NPC Gallery', 'v0map-npc-gallery'),
            __('V0Map NPC', 'v0map-npc-gallery'),
            'manage_options',
            'v0map-npc-gallery',
            [$this, 'render_admin_page'],
            'dashicons-location-alt',
            58
        );
    }

    public function register_settings(): void {
        register_setting(
            'v0map_npc_gallery_settings',
            self::OPTION_NAME,
            [
                'sanitize_callback' => [$this, 'sanitize_options'],
                'default' => self::default_options(),
            ]
        );

        add_settings_section(
            'v0map_npc_gallery_main',
            __('Embed Settings', 'v0map-npc-gallery'),
            function (): void {
                echo '<p>' . esc_html__('Connect WordPress to your running V0Map app or deployed URL.', 'v0map-npc-gallery') . '</p>';
            },
            'v0map-npc-gallery'
        );

        add_settings_section(
            'v0map_npc_gallery_windows',
            __('NPC Shortcode Windows', 'v0map-npc-gallery'),
            function (): void {
                echo '<p>' . esc_html__('Turn WordPress shortcodes into NPC-style windows. These can replace URL-only iframes when you want WordPress content inside the NPC dashboard.', 'v0map-npc-gallery') . '</p>';
            },
            'v0map-npc-gallery'
        );

        $fields = [
            'app_url' => __('App URL', 'v0map-npc-gallery'),
            'localhost_world_url' => __('Localhost World URL', 'v0map-npc-gallery'),
            'default_domain' => __('Default Domain', 'v0map-npc-gallery'),
            'iframe_height' => __('Iframe Height', 'v0map-npc-gallery'),
            'title' => __('Display Title', 'v0map-npc-gallery'),
            'description' => __('Display Description', 'v0map-npc-gallery'),
            'connection_title' => __('Connection Title', 'v0map-npc-gallery'),
            'show_toolbar' => __('Show Toolbar', 'v0map-npc-gallery'),
            'open_new_tab' => __('Show Open Button', 'v0map-npc-gallery'),
            'allow_fullscreen' => __('Allow Fullscreen', 'v0map-npc-gallery'),
            'persist_local_session' => __('Persistent Localhost Session', 'v0map-npc-gallery'),
            'auth_sync' => __('Auth Sync', 'v0map-npc-gallery'),
            'npc_sync' => __('NPC Sync', 'v0map-npc-gallery'),
            'live_connection' => __('Live Connection Panel', 'v0map-npc-gallery'),
            'auto_create_pages' => __('Auto-create Dashboard Pages', 'v0map-npc-gallery'),
            'api_auth_required' => __('Require API Auth Token', 'v0map-npc-gallery'),
        ];

        foreach ($fields as $field => $label) {
            add_settings_field(
                $field,
                $label,
                [$this, 'render_settings_field'],
                'v0map-npc-gallery',
                'v0map_npc_gallery_main',
                ['field' => $field]
            );
        }

        $window_fields = [
            'npc_windows_title' => __('Dashboard Title', 'v0map-npc-gallery'),
            'npc_windows' => __('NPC Window Shortcodes', 'v0map-npc-gallery'),
        ];

        foreach ($window_fields as $field => $label) {
            add_settings_field(
                $field,
                $label,
                [$this, 'render_settings_field'],
                'v0map-npc-gallery',
                'v0map_npc_gallery_windows',
                ['field' => $field]
            );
        }
    }

    public function sanitize_options(array $input): array {
        $defaults = self::default_options();
        $clean = [];

        $clean['app_url'] = isset($input['app_url']) ? esc_url_raw(trim((string) $input['app_url'])) : $defaults['app_url'];
        $clean['localhost_world_url'] = isset($input['localhost_world_url']) ? esc_url_raw(trim((string) $input['localhost_world_url'])) : $defaults['localhost_world_url'];
        $clean['default_domain'] = isset($input['default_domain']) ? sanitize_text_field($input['default_domain']) : $defaults['default_domain'];
        $clean['iframe_height'] = isset($input['iframe_height']) ? (string) max(320, min(1600, absint($input['iframe_height']))) : $defaults['iframe_height'];
        $clean['title'] = isset($input['title']) ? sanitize_text_field($input['title']) : $defaults['title'];
        $clean['description'] = isset($input['description']) ? sanitize_textarea_field($input['description']) : $defaults['description'];
        $clean['connection_title'] = isset($input['connection_title']) ? sanitize_text_field($input['connection_title']) : $defaults['connection_title'];
        $clean['show_toolbar'] = !empty($input['show_toolbar']) ? '1' : '0';
        $clean['open_new_tab'] = !empty($input['open_new_tab']) ? '1' : '0';
        $clean['allow_fullscreen'] = !empty($input['allow_fullscreen']) ? '1' : '0';
        $clean['persist_local_session'] = !empty($input['persist_local_session']) ? '1' : '0';
        $clean['auth_sync'] = !empty($input['auth_sync']) ? '1' : '0';
        $clean['npc_sync'] = !empty($input['npc_sync']) ? '1' : '0';
        $clean['live_connection'] = !empty($input['live_connection']) ? '1' : '0';
        $clean['auto_create_pages'] = !empty($input['auto_create_pages']) ? '1' : '0';
        $clean['api_auth_required'] = !empty($input['api_auth_required']) ? '1' : '0';
        $clean['npc_windows_title'] = isset($input['npc_windows_title']) ? sanitize_text_field($input['npc_windows_title']) : $defaults['npc_windows_title'];
        $clean['npc_windows'] = isset($input['npc_windows']) ? $this->sanitize_window_lines((string) $input['npc_windows']) : $defaults['npc_windows'];

        if ($clean['app_url'] === '') {
            $clean['app_url'] = $defaults['app_url'];
        }

        if ($clean['localhost_world_url'] === '') {
            $clean['localhost_world_url'] = $defaults['localhost_world_url'];
        }

        if ($clean['default_domain'] === '') {
            $clean['default_domain'] = $defaults['default_domain'];
        }

        if ($clean['auto_create_pages'] === '1') {
            self::create_dashboard_pages();
        }

        return $clean;
    }

    private function sanitize_window_lines(string $value): string {
        $lines = preg_split('/\r\n|\r|\n/', $value);
        $clean_lines = [];

        foreach ($lines as $line) {
            $line = trim(wp_kses_post($line));
            if ($line !== '') {
                $clean_lines[] = $line;
            }
        }

        return implode("\n", $clean_lines);
    }

    public function render_settings_field(array $args): void {
        $field = $args['field'];
        $options = $this->options();
        $name = self::OPTION_NAME . '[' . $field . ']';
        $value = $options[$field] ?? '';

        if (in_array($field, ['show_toolbar', 'open_new_tab', 'allow_fullscreen', 'persist_local_session', 'auth_sync', 'npc_sync', 'live_connection', 'auto_create_pages', 'api_auth_required'], true)) {
            printf(
                '<label><input type="checkbox" name="%1$s" value="1" %2$s> %3$s</label>',
                esc_attr($name),
                checked('1', $value, false),
                esc_html__('Enabled', 'v0map-npc-gallery')
            );
            return;
        }

        if (in_array($field, ['description', 'npc_windows'], true)) {
            printf(
                '<textarea name="%1$s" rows="%4$d" class="large-text code">%2$s</textarea>',
                esc_attr($name),
                esc_textarea($value),
                '',
                $field === 'npc_windows' ? 20 : 4
            );
            if ($field === 'npc_windows') {
                echo '<p class="description">' . esc_html__('One NPC per line: Title|Team|[shortcode_here]. By default, this includes the full shortcode list as WordPress-powered NPC windows.', 'v0map-npc-gallery') . '</p>';
            }
            return;
        }

        $type = $field === 'iframe_height' ? 'number' : 'text';
        printf(
            '<input type="%1$s" name="%2$s" value="%3$s" class="regular-text" %4$s>',
            esc_attr($type),
            esc_attr($name),
            esc_attr($value),
            $field === 'iframe_height' ? 'min="320" max="1600" step="20"' : ''
        );

        if ($field === 'app_url') {
            echo '<p class="description">' . esc_html__('Defaults to https://entremotivator.com. Use this for the public domain or production app shell.', 'v0map-npc-gallery') . '</p>';
        }

        if ($field === 'localhost_world_url') {
            echo '<p class="description">' . esc_html__('Used for local 3D world auth sync while developing. Default: http://localhost:3000.', 'v0map-npc-gallery') . '</p>';
        }
    }

    public function register_frontend_assets(): void {
        wp_register_style(
            'v0map-npc-gallery',
            V0MAP_NPC_GALLERY_URL . 'assets/v0map-npc-gallery.css',
            [],
            V0MAP_NPC_GALLERY_VERSION
        );

        wp_register_script(
            'v0map-npc-gallery',
            V0MAP_NPC_GALLERY_URL . 'assets/v0map-npc-gallery.js',
            [],
            V0MAP_NPC_GALLERY_VERSION,
            true
        );
    }

    public function enqueue_admin_assets(string $hook): void {
        if ($hook !== 'toplevel_page_v0map-npc-gallery') {
            return;
        }

        $this->register_frontend_assets();
        wp_enqueue_style('v0map-npc-gallery');
        wp_enqueue_script('v0map-npc-gallery');
    }

    public function maybe_render_shortcode_page(): void {
        $tag = isset($_GET['v0map_shortcode_tag']) ? preg_replace('/[^A-Za-z0-9_-]/', '', (string) wp_unslash($_GET['v0map_shortcode_tag'])) : '';
        $raw_shortcode = isset($_GET['v0map_shortcode']) ? trim((string) wp_unslash($_GET['v0map_shortcode'])) : '';

        if ($tag === '' && $raw_shortcode === '') {
            return;
        }

        $shortcode = $raw_shortcode !== '' ? $raw_shortcode : '[' . $tag . ']';
        $actual_tag = $this->extract_shortcode_tag($shortcode);

        if (!defined('DONOTCACHEPAGE')) {
            define('DONOTCACHEPAGE', true);
        }

        $this->register_frontend_assets();
        wp_enqueue_style('v0map-npc-gallery');
        wp_enqueue_script('v0map-npc-gallery');

        /**
         * Render before wp_head() so shortcode callbacks that enqueue CSS/JS can still print
         * those assets in the real WordPress document head/footer. This is what preserves
         * the plugin/theme styling that gets lost inside REST srcDoc rendering.
         */
        $rendered = $this->safe_do_shortcode($shortcode);

        nocache_headers();
        status_header(200);
        header('Content-Type: text/html; charset=' . get_option('blog_charset'));
        header('X-V0Map-Shortcode-Tag: ' . $actual_tag);
        ?>
        <!doctype html>
        <html <?php language_attributes(); ?>>
        <head>
            <meta charset="<?php bloginfo('charset'); ?>">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <base target="_blank">
            <style>
                html, body {
                    margin: 0;
                    min-height: 100%;
                    width: 100%;
                    color: #0f172a;
                    background: #fff;
                }
                body.v0map-shortcode-render-body {
                    overflow-x: hidden;
                }
                .v0map-shortcode-render-shell {
                    width: 100%;
                    min-height: 100vh;
                }
                img, iframe, video, canvas, svg {
                    max-width: 100%;
                }
                .v0map-shortcode-error {
                    border-left: 4px solid #dc2626;
                    background: #fff7f7;
                    color: #7f1d1d;
                    padding: 14px;
                }
            </style>
            <?php wp_head(); ?>
        </head>
        <body <?php body_class('v0map-shortcode-render-body v0map-live-shortcode-' . sanitize_html_class($actual_tag)); ?>>
            <?php wp_body_open(); ?>
            <main class="v0map-shortcode-render-shell" data-v0map-live-shortcode="<?php echo esc_attr($actual_tag); ?>">
                <?php echo $rendered['html']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
            </main>
            <?php wp_footer(); ?>
        </body>
        </html>
        <?php
        exit;
    }

    private function bridge_expires(): int {
        return time() + DAY_IN_SECONDS;
    }

    private function create_bridge_token(int $user_id, int $expires): string {
        return hash_hmac('sha256', $user_id . '|' . $expires . '|' . home_url(), wp_salt('auth'));
    }

    private function rest_base_url(): string {
        return esc_url_raw(rest_url(self::REST_NAMESPACE));
    }

    private function bridge_auth_payload(?int $user_id = null): array {
        $user_id = $user_id ?? get_current_user_id();
        $expires = $this->bridge_expires();

        return [
            'restBase' => $this->rest_base_url(),
            'windowsUrl' => rest_url(self::REST_NAMESPACE . '/windows'),
            'renderUrl' => rest_url(self::REST_NAMESPACE . '/render'),
            'authUrl' => rest_url(self::REST_NAMESPACE . '/auth'),
            'user' => $user_id,
            'expires' => $expires,
            'token' => $this->create_bridge_token((int) $user_id, $expires),
            'nonce' => wp_create_nonce('wp_rest'),
        ];
    }

    private function request_has_bridge_auth(WP_REST_Request $request): bool {
        $options = $this->options();

        if ($options['api_auth_required'] !== '1') {
            return true;
        }

        if (is_user_logged_in() && current_user_can('read')) {
            return true;
        }

        $user_id = absint($request->get_param('user'));
        $expires = absint($request->get_param('expires'));
        $token = (string) $request->get_param('token');

        if ($user_id <= 0 || $expires < time() || $token === '') {
            return false;
        }

        return hash_equals($this->create_bridge_token($user_id, $expires), $token);
    }

    public function register_rest_routes(): void {
        register_rest_route(
            self::FAPC_REST_NAMESPACE,
            '/ping',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_fapc_ping'],
                'permission_callback' => [$this, 'rest_basic_auth_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/ping',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_fapc_ping'],
                'permission_callback' => [$this, 'rest_basic_auth_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/auth',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_auth_payload'],
                'permission_callback' => '__return_true',
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/windows',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_windows'],
                'permission_callback' => [$this, 'rest_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/window/(?P<id>[A-Za-z0-9_-]+)',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_window'],
                'permission_callback' => [$this, 'rest_permission'],
                'args' => [
                    'id' => [
                        'sanitize_callback' => 'sanitize_key',
                    ],
                ],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/shortcodes',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_shortcodes'],
                'permission_callback' => [$this, 'rest_permission'],
                'args' => [
                    'limit' => [
                        'sanitize_callback' => 'absint',
                    ],
                    'random' => [
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'seed' => [
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/render',
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [$this, 'rest_render_shortcode'],
                'permission_callback' => [$this, 'rest_permission'],
                'args' => [
                    'shortcode' => [
                        'type' => 'string',
                        'required' => true,
                    ],
                ],
            ]
        );


        register_rest_route(
            self::REST_NAMESPACE,
            '/features',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_features'],
                'permission_callback' => [$this, 'rest_permission'],
                'args' => [
                    'limit' => [
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/health',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_health'],
                'permission_callback' => [$this, 'rest_basic_auth_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/content',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_content'],
                'permission_callback' => [$this, 'rest_permission'],
                'args' => [
                    'type' => [
                        'sanitize_callback' => 'sanitize_key',
                    ],
                    'limit' => [
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ]
        );


        register_rest_route(
            self::REST_NAMESPACE,
            '/feature-suite',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_feature_suite'],
                'permission_callback' => [$this, 'rest_permission'],
                'args' => [
                    'limit' => [
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/api-map',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_api_map'],
                'permission_callback' => [$this, 'rest_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/diagnostics',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_diagnostics'],
                'permission_callback' => [$this, 'rest_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/command-center',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_command_center'],
                'permission_callback' => [$this, 'rest_permission'],
                'args' => [
                    'limit' => [
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/search',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_search'],
                'permission_callback' => [$this, 'rest_permission'],
                'args' => [
                    'q' => [
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'limit' => [
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/voice-commands',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_voice_commands'],
                'permission_callback' => [$this, 'rest_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/team-presets',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_team_presets'],
                'permission_callback' => [$this, 'rest_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/live-voice-options',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_live_voice_options'],
                'permission_callback' => [$this, 'rest_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/project-templates',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_project_templates'],
                'permission_callback' => [$this, 'rest_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/voice-command-suite',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_voice_command_suite'],
                'permission_callback' => [$this, 'rest_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/project-manager-suite',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_project_manager_suite'],
                'permission_callback' => [$this, 'rest_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/npc-movement-playbook',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_npc_movement_playbook'],
                'permission_callback' => [$this, 'rest_permission'],
            ]
        );

        register_rest_route(
            self::REST_NAMESPACE,
            '/render-url',
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [$this, 'rest_render_url'],
                'permission_callback' => [$this, 'rest_permission'],
                'args' => [
                    'tag' => [
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'shortcode' => [
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ]
        );
    }

    public function rest_voice_commands(WP_REST_Request $request): WP_REST_Response {
        return rest_ensure_response([
            'ok' => true,
            'version' => V0MAP_NPC_GALLERY_VERSION,
            'commands' => [
                'Brand GPT',
                'create NPC named Revenue Coach',
                'create NPC named Mission Guide with shortcode aisc_missions',
                'NPC 7 come here',
                'dance all',
                'walk realistic',
                'scatter NPCs',
                'gather team',
                'import team 25',
                'import team 50',
                'import team 100',
                'add AI tower',
                'add command pod',
                'add voice stage',
                'add skybridge',
                'add WordPress API core',
                'add Yuka path node',
                'add project room',
                'add habit board',
                'add task kanban',
                'open project manager',
                'add task test WordPress API',
                'complete task 1',
                'import habit tracker',
                'dictation mode',
                'command mode',
                'take note review Brand GPT styling',
                'move NPC 2 left',
                'move NPC 4 forward',
                'send NPC 5 to project room',
                'NPC 2 follow me',
                'NPC 3 patrol route',
                'freeze all NPCs',
                'add project board',
                'add voice gate',
                'add automation lab',
                'add client portal',
                'add media studio',
                'add calendar room',
                'export project board',
                'wide screen',
                'close window',
                'refresh WordPress API',
            ],
            'featureBuilder' => [
                'tower',
                'skybridge',
                'command-pod',
                'voice-stage',
                'api-core',
                'path-node',
                'project-room',
                'habit-board',
                'task-kanban',
                'voice-router',
                'project-board',
                'voice-gate',
                'automation-lab',
                'client-portal',
                'media-studio',
                'calendar-room',
            ],
            'notes' => 'Next.js listens in-browser and executes safe local UI actions. WordPress exposes this route so the command tab can stay synchronized with the plugin.',
        ]);
    }

    public function rest_team_presets(WP_REST_Request $request): WP_REST_Response {
        return rest_ensure_response([
            'ok' => true,
            'version' => V0MAP_NPC_GALLERY_VERSION,
            'presets' => [
                [
                    'label' => '25 NPC Team',
                    'size' => 25,
                    'file' => '/npc-team-25.import.json',
                    'description' => 'Fast starter team mapped to live WordPress shortcode windows.',
                ],
                [
                    'label' => '50 NPC Team',
                    'size' => 50,
                    'file' => '/npc-team-50.import.json',
                    'description' => 'Expanded operator team for multiple floors and workflows.',
                ],
                [
                    'label' => '100 NPC Team',
                    'size' => 100,
                    'file' => '/npc-team-100.import.json',
                    'description' => 'Large importable city team for voice-controlled 3D operations.',
                ],
            ],
            'approvedShortcodes' => $this->all_shortcode_items(),
        ]);
    }

    public function rest_live_voice_options(WP_REST_Request $request): WP_REST_Response {
        return rest_ensure_response([
            'ok' => true,
            'version' => V0MAP_NPC_GALLERY_VERSION,
            'modes' => [
                [
                    'id' => 'command',
                    'label' => 'Realtime Command Mode',
                    'description' => 'Voice input controls NPCs, windows, WordPress API refreshes, city building, and safe local npm diagnostics.',
                    'examples' => ['Brand GPT', 'NPC 1 come here', 'next window', 'add project room'],
                ],
                [
                    'id' => 'dictation',
                    'label' => 'Live Dictation Mode',
                    'description' => 'Voice input is captured into project notes until the user says command mode.',
                    'examples' => ['dictation mode', 'take note fix shortcode styling', 'command mode'],
                ],
            ],
            'npcMovement' => [
                'comeHere' => 'Summons the selected NPC to the camera and opens the linked shortcode window.',
                'moveDirections' => ['left', 'right', 'forward', 'back', 'project room', 'stage'],
                'pathing' => 'Next.js uses the existing Yuka-style steering/wander system plus explicit voice target positions.',
            ],
            'safeLocalCommands' => ['wp:ping', 'wp:features', 'wp:suite', 'wp:windows', 'wp:diagnostics'],
        ]);
    }

    public function rest_project_templates(WP_REST_Request $request): WP_REST_Response {
        return rest_ensure_response([
            'ok' => true,
            'version' => V0MAP_NPC_GALLERY_VERSION,
            'templates' => [
                [
                    'label' => 'Project Management Board',
                    'file' => '/project-management.import.json',
                    'description' => 'Importable tasks for WordPress API checks, shortcode windows, Brand GPT, realtime voice, and NPC movement testing.',
                ],
                [
                    'label' => 'Daily Habit Tracker',
                    'file' => '/habit-tracker.import.json',
                    'description' => 'Importable daily habits for API checks, shortcode styling, dictation, NPC commands, and team review.',
                ],
            ],
            'defaultTasks' => [
                ['title' => 'Confirm WordPress REST ping and feature suite', 'priority' => 'high'],
                ['title' => 'Open [bsp_app] styled Brand GPT window', 'priority' => 'high'],
                ['title' => 'Test realtime voice command mode and dictation mode', 'priority' => 'normal'],
                ['title' => 'Move one NPC to project room and open its window', 'priority' => 'normal'],
            ],
            'defaultHabits' => [
                ['name' => 'Run WordPress API health check', 'target' => 30],
                ['name' => 'Open one live shortcode window', 'target' => 30],
                ['name' => 'Save one dictated project note', 'target' => 30],
                ['name' => 'Use one NPC movement voice command', 'target' => 30],
            ],
        ]);
    }

    public function rest_voice_command_suite(WP_REST_Request $request): WP_REST_Response {
        return rest_ensure_response([
            'ok' => true,
            'version' => V0MAP_NPC_GALLERY_VERSION,
            'wakeWord' => 'city',
            'modes' => ['command', 'dictation'],
            'groups' => [
                [
                    'id' => 'windows',
                    'title' => 'Live WordPress Windows',
                    'description' => 'Open, close, resize, and navigate one styled live shortcode iframe at a time.',
                    'examples' => ['Brand GPT', 'next window', 'previous window', 'wide screen', 'close window'],
                ],
                [
                    'id' => 'npc-builder',
                    'title' => 'Voice NPC Builder',
                    'description' => 'Create new NPCs by voice and bind them to approved WordPress shortcode windows.',
                    'examples' => ['create NPC named Revenue Coach', 'create NPC named Mission Guide with shortcode aisc_missions'],
                ],
                [
                    'id' => 'npc-movement',
                    'title' => 'NPC Movement + Yuka-Style Pathing',
                    'description' => 'Summon, follow, patrol, dance, freeze, and move NPCs around the 3D city.',
                    'examples' => ['NPC 2 follow me', 'NPC 3 patrol route', 'freeze all NPCs', 'send NPC 5 to project room', 'dance all'],
                ],
                [
                    'id' => 'npc-gestures',
                    'title' => 'NPC Gestures',
                    'description' => 'Trigger realistic gestures on one NPC or the whole crowd: wave, nod, point, cheer, clap, think, salute.',
                    'examples' => ['NPC 3 wave', 'cheer all', 'everyone salute', 'NPC 5 point', 'nod all'],
                ],
                [
                    'id' => 'room-navigation',
                    'title' => 'Named Room Navigation',
                    'description' => 'Teleport to themed rooms on every floor: lobby, cafe, boardroom, focus pods, arcade lounge, media wall, rooftop garden, helipad.',
                    'examples' => ['go to the lobby', 'take me to the boardroom', 'go to the arcade', 'go to the rooftop garden'],
                ],
                [
                    'id' => 'npc-directory',
                    'title' => 'Live NPC Directory Editor',
                    'description' => 'Open the fully editable in-app NPC directory (names, roles, teams, colors, floors, speed, models, dialogue) with browser persistence.',
                    'examples' => ['open NPC directory', 'edit NPCs'],
                ],
                [
                    'id' => 'city-builder',
                    'title' => '3D City Builder',
                    'description' => 'Add city rooms and tools inside the 3D world without leaving the app.',
                    'examples' => ['add automation lab', 'add project board', 'add voice gate', 'add media studio', 'add calendar room'],
                ],
                [
                    'id' => 'project-management',
                    'title' => 'Project Manager + Daily To-Do',
                    'description' => 'Open the project board, add tasks, complete tasks, import habits, and export project JSON.',
                    'examples' => ['open project manager', 'add task test shortcode styling', 'complete task 1', 'export project board'],
                ],
            ],
            'safeLocalScripts' => ['wp:ping', 'wp:features', 'wp:suite', 'wp:windows', 'wp:diagnostics'],
            'approvedShortcodes' => $this->all_shortcode_items(),
        ]);
    }

    public function rest_project_manager_suite(WP_REST_Request $request): WP_REST_Response {
        return rest_ensure_response([
            'ok' => true,
            'version' => V0MAP_NPC_GALLERY_VERSION,
            'templates' => [
                [
                    'label' => 'Project Management Board',
                    'file' => '/project-management.import.json',
                    'tasks' => 7,
                ],
                [
                    'label' => '30 Day WordPress 3D City Sprint',
                    'file' => '/project-sprint-30-day.import.json',
                    'tasks' => 7,
                ],
                [
                    'label' => 'Daily Habit Tracker',
                    'file' => '/habit-tracker.import.json',
                    'habits' => 4,
                ],
                [
                    'label' => 'Advanced Voice City Habit Tracker',
                    'file' => '/habit-tracker-advanced.import.json',
                    'habits' => 6,
                ],
            ],
            'lanes' => ['todo', 'doing', 'done'],
            'voiceActions' => ['open project manager', 'add task', 'complete task', 'import habit tracker', 'export project board', 'dictation mode'],
            'defaultTasks' => [
                ['title' => 'Confirm WordPress REST ping and feature suite', 'priority' => 'high'],
                ['title' => 'Open [bsp_app] styled Brand GPT window', 'priority' => 'high'],
                ['title' => 'Create one voice NPC and assign a live shortcode', 'priority' => 'normal'],
                ['title' => 'Add automation lab and project board to the 3D city', 'priority' => 'normal'],
                ['title' => 'Export project board JSON backup', 'priority' => 'normal'],
            ],
        ]);
    }

    public function rest_npc_movement_playbook(WP_REST_Request $request): WP_REST_Response {
        return rest_ensure_response([
            'ok' => true,
            'version' => V0MAP_NPC_GALLERY_VERSION,
            'playbook' => [
                ['command' => 'NPC 1 come here', 'action' => 'summon', 'opensWindow' => true],
                ['command' => 'NPC 2 follow me', 'action' => 'follow', 'opensWindow' => true],
                ['command' => 'NPC 3 patrol route', 'action' => 'patrol', 'opensWindow' => false],
                ['command' => 'move NPC 4 forward', 'action' => 'move', 'direction' => 'forward'],
                ['command' => 'send NPC 5 to project room', 'action' => 'move', 'target' => 'project-room'],
                ['command' => 'dance all', 'action' => 'dance', 'target' => 'all'],
                ['command' => 'freeze all NPCs', 'action' => 'freeze', 'target' => 'all'],
            ],
            'movementModes' => ['realistic', 'summon', 'patrol', 'dance'],
            'pathingNotes' => [
                'Next.js owns real-time camera-relative movement targets.',
                'Yuka-style target routing is represented through NPC targetPosition updates and manager movement helpers.',
                'The WordPress endpoint keeps the command list synchronized for admin/help panels.',
            ],
        ]);
    }

    public function rest_basic_auth_permission(WP_REST_Request $request) {
        if (is_user_logged_in() && current_user_can('read')) {
            return true;
        }

        return new WP_Error(
            'v0map_basic_auth_required',
            __('WordPress Application Password Basic Auth is required for this REST ping route.', 'v0map-npc-gallery'),
            ['status' => 401]
        );
    }

    public function rest_permission(WP_REST_Request $request) {
        if ($this->request_has_bridge_auth($request)) {
            return true;
        }

        $basic = $this->rest_basic_auth_permission($request);
        if ($basic === true) {
            return true;
        }

        return new WP_Error(
            'v0map_npc_forbidden',
            __('V0Map NPC API auth failed. Use the WordPress bridge token or server-side Application Password Basic Auth.', 'v0map-npc-gallery'),
            ['status' => 403]
        );
    }

    public function rest_auth_payload(WP_REST_Request $request) {
        $payload = $this->bridge_auth_payload();
        $payload['site'] = home_url();
        $payload['domain'] = $this->options()['default_domain'];
        $payload['pages'] = $this->rest_page_payload();

        return rest_ensure_response($payload);
    }

    public function rest_fapc_ping(WP_REST_Request $request) {
        $user = wp_get_current_user();

        return rest_ensure_response(
            [
                'ok' => true,
                'message' => 'REST ping route connected with WordPress Application Password Basic Auth.',
                'route' => '/' . self::FAPC_REST_NAMESPACE . '/ping',
                'site' => home_url(),
                'plugin' => 'v0map-npc-gallery',
                'version' => V0MAP_NPC_GALLERY_VERSION,
                'user' => [
                    'id' => get_current_user_id(),
                    'login' => $user instanceof WP_User ? $user->user_login : '',
                    'display' => $user instanceof WP_User ? $user->display_name : '',
                ],
                'routes' => [
                    'health' => rest_url(self::REST_NAMESPACE . '/health'),
                    'features' => rest_url(self::REST_NAMESPACE . '/features'),
                    'windows' => rest_url(self::REST_NAMESPACE . '/windows'),
                    'shortcodes' => rest_url(self::REST_NAMESPACE . '/shortcodes'),
                    'render' => rest_url(self::REST_NAMESPACE . '/render'),
                    'content' => rest_url(self::REST_NAMESPACE . '/content'),
                    'featureSuite' => rest_url(self::REST_NAMESPACE . '/feature-suite'),
                    'apiMap' => rest_url(self::REST_NAMESPACE . '/api-map'),
                    'diagnostics' => rest_url(self::REST_NAMESPACE . '/diagnostics'),
                    'commandCenter' => rest_url(self::REST_NAMESPACE . '/command-center'),
                    'search' => rest_url(self::REST_NAMESPACE . '/search'),
                    'renderUrl' => rest_url(self::REST_NAMESPACE . '/render-url'),
                    'liveVoiceOptions' => rest_url(self::REST_NAMESPACE . '/live-voice-options'),
                    'projectTemplates' => rest_url(self::REST_NAMESPACE . '/project-templates'),
                ],
            ]
        );
    }

    public function rest_shortcodes(WP_REST_Request $request) {
        $limit = max(1, min(300, absint($request->get_param('limit') ?: 160)));
        $random = (string) $request->get_param('random') === '1';
        $seed = sanitize_text_field((string) ($request->get_param('seed') ?: 'v0map'));
        $items = $this->all_shortcode_items();

        if ($random) {
            $items = $this->stable_shuffle($items, $seed);
        }

        $items = array_slice($items, 0, $limit);

        return rest_ensure_response(
            [
                'ok' => true,
                'site' => home_url(),
                'domain' => $this->options()['default_domain'],
                'shortcodes' => $items,
                'metrics' => [
                    'returned' => count($items),
                    'configured' => count($this->parse_npc_windows()),
                    'registered' => count($this->registered_shortcode_tags()),
                ],
                'assignment' => [
                    'random' => $random,
                    'seed' => $seed,
                    'mode' => 'unique-shortcodes-per-npc',
                    'noFakeShortcodes' => true,
                    'linkWrapperShortcode' => '[v0map_agent_dashboard agent_no="ID"]',
                    'display' => 'one-at-a-time',
                ],
                'pages' => $this->rest_page_payload(),
            ]
        );
    }

    private function rest_page_payload(): array {
        $pages = $this->dashboard_pages();
        $payload = [];

        foreach (self::dashboard_page_definitions() as $key => $page) {
            $page_id = isset($pages[$key]) ? absint($pages[$key]) : 0;
            $payload[$key] = [
                'title' => $page['title'],
                'slug' => $page['slug'],
                'shortcode' => $page['content'],
                'id' => $page_id,
                'url' => $page_id > 0 ? get_permalink($page_id) : '',
                'edit' => $page_id > 0 ? admin_url('post.php?post=' . $page_id . '&action=edit') : '',
            ];
        }

        return $payload;
    }

    private function rest_window_payload(array $window, int $index, bool $render = true): array {
        $shortcode = trim((string) ($window['shortcode'] ?? ''));
        $tag = (string) ($window['tag'] ?? $this->extract_shortcode_tag($shortcode));
        $registered = $shortcode !== '' && $tag !== '' && shortcode_exists($tag);
        $is_wrapper = $tag === 'v0map_agent_dashboard' || (string) ($window['windowType'] ?? '') === 'link-wrapper';
        $primary_link = esc_url_raw((string) ($window['primaryLink'] ?? ''));
        $tabs = is_array($window['tabs'] ?? null) ? $window['tabs'] : [];
        $html = '';
        $render_error = '';

        if ($render && $shortcode !== '') {
            $rendered = $this->safe_do_shortcode($shortcode);
            $html = $rendered['html'];
            $render_error = $rendered['error'];
        }

        $page = $tag !== '' ? get_page_by_path('npc-live-' . sanitize_title($tag)) : null;
        $page_id = $page instanceof WP_Post ? (int) $page->ID : 0;
        $render_url_args = ['v0map_shortcode_tag' => $tag, 'v0map_embed' => '1', 'v0map_full_assets' => '1'];
        if ($shortcode !== '') {
            $render_url_args['v0map_shortcode'] = $shortcode;
        }
        $render_url = add_query_arg($render_url_args, home_url('/v0map-npc-gallery/'));

        return [
            'id' => (string) ($window['id'] ?? 'npc-window-' . ($index + 1)),
            'index' => $index,
            'npcId' => (int) ($window['agentNo'] ?? ($index + 1)),
            'agentNo' => (int) ($window['agentNo'] ?? ($index + 1)),
            'title' => sanitize_text_field($window['title'] ?? sprintf(__('NPC Window %d', 'v0map-npc-gallery'), $index + 1)),
            'team' => sanitize_text_field($window['team'] ?? __('General', 'v0map-npc-gallery')),
            'category' => sanitize_text_field($window['category'] ?? ($window['team'] ?? __('General', 'v0map-npc-gallery'))),
            'shortcode' => $shortcode,
            'tag' => $tag,
            'registered' => $registered,
            'isWrapper' => $is_wrapper,
            'shortcodeSource' => sanitize_text_field((string) ($window['shortcodeSource'] ?? ($is_wrapper ? 'v0map-wrapper' : 'provided'))),
            'html' => $html,
            'renderError' => $render_error,
            'pageUrl' => $shortcode !== '' ? ($page_id > 0 ? get_permalink($page_id) : $render_url) : $primary_link,
            'liveUrl' => $shortcode !== '' ? $render_url : $primary_link,
            'wordpressUrl' => $shortcode !== '' ? $render_url : $primary_link,
            'primaryLink' => $primary_link,
            'tabs' => $tabs,
            'windowType' => sanitize_text_field((string) ($window['windowType'] ?? ($shortcode !== '' ? 'shortcode' : 'link'))),
            'pageEditUrl' => $page_id > 0 ? admin_url('post.php?post=' . $page_id . '&action=edit') : '',
            'editUrl' => admin_url('admin.php?page=v0map-npc-gallery'),
            'dashboardUrl' => $primary_link ?: admin_url('admin.php?page=v0map-npc-gallery'),
        ];
    }

    public function rest_windows(WP_REST_Request $request) {
        $render = (string) $request->get_param('render') !== '0';
        $limit = max(1, min(200, absint($request->get_param('limit') ?: 160)));
        $random = (string) $request->get_param('random') === '1';
        $seed = sanitize_text_field((string) ($request->get_param('seed') ?: 'v0map'));
        $source_windows = $this->unique_windows_by_shortcode($this->parse_npc_windows());

        if ($random) {
            $source_windows = $this->stable_shuffle($source_windows, $seed);
        }

        $source_windows = array_slice($source_windows, 0, $limit);
        $windows = [];

        foreach ($source_windows as $index => $window) {
            $windows[] = $this->rest_window_payload($window, $index, $render);
        }

        return rest_ensure_response(
            [
                'ok' => true,
                'site' => home_url(),
                'domain' => $this->options()['default_domain'],
                'metrics' => $this->connection_metrics(),
                'pages' => $this->rest_page_payload(),
                'windows' => $windows,
                'auth' => $this->bridge_auth_payload(),
                'assignment' => [
                    'random' => $random,
                    'seed' => $seed,
                    'mode' => 'unique-shortcodes-per-npc',
                    'noFakeShortcodes' => true,
                    'linkWrapperShortcode' => '[v0map_agent_dashboard agent_no="ID"]',
                    'display' => 'one-at-a-time',
                ],
            ]
        );
    }

    public function rest_window(WP_REST_Request $request) {
        $id = sanitize_key((string) $request['id']);

        foreach ($this->parse_npc_windows() as $index => $window) {
            if ($id === sanitize_key((string) ($window['id'] ?? 'npc-window-' . ($index + 1))) || $id === (string) ($index + 1)) {
                return rest_ensure_response($this->rest_window_payload($window, $index, true));
            }
        }

        return new WP_Error(
            'v0map_npc_window_not_found',
            __('NPC shortcode window not found.', 'v0map-npc-gallery'),
            ['status' => 404]
        );
    }

    public function rest_render_shortcode(WP_REST_Request $request) {
        $shortcode = trim((string) $request->get_param('shortcode'));
        $tag = $this->extract_shortcode_tag($shortcode);
        $rendered = $this->safe_do_shortcode($shortcode);

        return rest_ensure_response(
            [
                'shortcode' => $shortcode,
                'tag' => $tag,
                'registered' => $tag !== '' && shortcode_exists($tag),
                'html' => $rendered['html'],
                'renderError' => $rendered['error'],
                'liveUrl' => add_query_arg(['v0map_shortcode_tag' => $tag, 'v0map_shortcode' => $shortcode, 'v0map_embed' => '1', 'v0map_full_assets' => '1'], home_url('/v0map-npc-gallery/')),
            ]
        );
    }


    public function rest_health(WP_REST_Request $request) {
        $metrics = $this->connection_metrics();
        $auth = $this->bridge_auth_payload();

        return rest_ensure_response(
            [
                'ok' => true,
                'site' => home_url(),
                'name' => get_bloginfo('name'),
                'time' => current_time('mysql'),
                'gmtTime' => current_time('mysql', true),
                'plugin' => [
                    'name' => 'v0map-npc-gallery',
                    'version' => V0MAP_NPC_GALLERY_VERSION,
                    'liveConnection' => $this->options()['live_connection'] === '1',
                    'apiAuthRequired' => $this->options()['api_auth_required'] === '1',
                ],
                'checks' => [
                    'basicAuth' => is_user_logged_in() && current_user_can('read'),
                    'restApi' => true,
                    'shortcodeWindowsConfigured' => $metrics['windows'] > 0,
                    'registeredShortcodeMatches' => $metrics['matched'],
                    'missingShortcodeMatches' => $metrics['missing'],
                    'styledRenderPage' => home_url('/v0map-npc-gallery/'),
                    'cookieIframeFix' => function_exists('header_register_callback'),
                ],
                'routes' => [
                    'ping' => rest_url(self::REST_NAMESPACE . '/ping'),
                    'features' => rest_url(self::REST_NAMESPACE . '/features'),
                    'windows' => rest_url(self::REST_NAMESPACE . '/windows'),
                    'shortcodes' => rest_url(self::REST_NAMESPACE . '/shortcodes'),
                    'render' => rest_url(self::REST_NAMESPACE . '/render'),
                    'content' => rest_url(self::REST_NAMESPACE . '/content'),
                    'featureSuite' => rest_url(self::REST_NAMESPACE . '/feature-suite'),
                    'apiMap' => rest_url(self::REST_NAMESPACE . '/api-map'),
                    'diagnostics' => rest_url(self::REST_NAMESPACE . '/diagnostics'),
                    'commandCenter' => rest_url(self::REST_NAMESPACE . '/command-center'),
                    'search' => rest_url(self::REST_NAMESPACE . '/search'),
                    'renderUrl' => rest_url(self::REST_NAMESPACE . '/render-url'),
                    'liveVoiceOptions' => rest_url(self::REST_NAMESPACE . '/live-voice-options'),
                    'projectTemplates' => rest_url(self::REST_NAMESPACE . '/project-templates'),
                ],
                'auth' => [
                    'restBase' => $auth['restBase'],
                    'windowsUrl' => $auth['windowsUrl'],
                    'renderUrl' => $auth['renderUrl'],
                    'authUrl' => $auth['authUrl'],
                    'user' => $auth['user'],
                    'expires' => $auth['expires'],
                ],
                'metrics' => $metrics,
            ]
        );
    }

    public function rest_content(WP_REST_Request $request) {
        $type = sanitize_key((string) ($request->get_param('type') ?: 'all'));
        $limit = max(1, min(60, absint($request->get_param('limit') ?: 20)));

        $payload = [
            'ok' => true,
            'site' => home_url(),
            'type' => $type,
            'limit' => $limit,
            'pages' => [],
            'posts' => [],
            'media' => [],
            'custom' => [],
        ];

        if ($type === 'all' || $type === 'page' || $type === 'pages') {
            $payload['pages'] = $this->content_items('page', $limit);
        }

        if ($type === 'all' || $type === 'post' || $type === 'posts') {
            $payload['posts'] = $this->content_items('post', $limit);
        }

        if ($type === 'all' || $type === 'attachment' || $type === 'media') {
            $payload['media'] = $this->media_items($limit);
        }

        if ($type === 'all' || $type === 'custom') {
            foreach ($this->public_rest_post_types() as $post_type => $post_type_data) {
                if (in_array($post_type, ['post', 'page', 'attachment'], true)) {
                    continue;
                }
                $payload['custom'][$post_type] = [
                    'label' => $post_type_data['label'],
                    'items' => $this->content_items($post_type, min(10, $limit)),
                ];
            }
        }

        return rest_ensure_response($payload);
    }

    public function rest_features(WP_REST_Request $request) {
        $limit = max(1, min(120, absint($request->get_param('limit') ?: 30)));
        $windows = [];
        $source_windows = array_slice($this->unique_windows_by_shortcode($this->parse_npc_windows()), 0, 200);

        foreach ($source_windows as $index => $window) {
            $windows[] = $this->rest_window_payload($window, $index, false);
        }

        $pages = $this->content_items('page', $limit);
        $posts = $this->content_items('post', $limit);
        $media = $this->media_items($limit);
        $post_types = $this->public_rest_post_types();
        $taxonomies = $this->public_rest_taxonomies();
        $menus = $this->menu_items_payload();
        $metrics = $this->connection_metrics();
        $feature_groups = $this->feature_group_metrics($windows);
        $auth = $this->bridge_auth_payload();
        $shortcode_items = $this->all_shortcode_items();

        return rest_ensure_response(
            [
                'ok' => true,
                'source' => 'wordpress-plugin-v0map-npc-gallery',
                'site' => [
                    'url' => home_url(),
                    'name' => get_bloginfo('name'),
                    'description' => get_bloginfo('description'),
                    'language' => get_bloginfo('language'),
                    'timezone' => wp_timezone_string(),
                    'adminUrl' => admin_url(),
                ],
                'plugin' => [
                    'name' => 'V0Map NPC Gallery',
                    'version' => V0MAP_NPC_GALLERY_VERSION,
                    'dashboardUrl' => admin_url('admin.php?page=v0map-npc-gallery'),
                    'settings' => [
                        'appUrl' => $this->options()['app_url'],
                        'localhostWorldUrl' => $this->options()['localhost_world_url'],
                        'defaultDomain' => $this->options()['default_domain'],
                        'authSync' => $this->options()['auth_sync'] === '1',
                        'npcSync' => $this->options()['npc_sync'] === '1',
                        'liveConnection' => $this->options()['live_connection'] === '1',
                        'autoCreatePages' => $this->options()['auto_create_pages'] === '1',
                    ],
                ],
                'connection' => [
                    'ok' => true,
                    'basicAuthUser' => is_user_logged_in() ? wp_get_current_user()->user_login : '',
                    'routes' => [
                        'health' => rest_url(self::REST_NAMESPACE . '/health'),
                        'features' => rest_url(self::REST_NAMESPACE . '/features'),
                        'windows' => rest_url(self::REST_NAMESPACE . '/windows'),
                        'shortcodes' => rest_url(self::REST_NAMESPACE . '/shortcodes'),
                        'render' => rest_url(self::REST_NAMESPACE . '/render'),
                        'content' => rest_url(self::REST_NAMESPACE . '/content'),
                    'featureSuite' => rest_url(self::REST_NAMESPACE . '/feature-suite'),
                    'apiMap' => rest_url(self::REST_NAMESPACE . '/api-map'),
                    'diagnostics' => rest_url(self::REST_NAMESPACE . '/diagnostics'),
                    'commandCenter' => rest_url(self::REST_NAMESPACE . '/command-center'),
                    'search' => rest_url(self::REST_NAMESPACE . '/search'),
                    'renderUrl' => rest_url(self::REST_NAMESPACE . '/render-url'),
                    'liveVoiceOptions' => rest_url(self::REST_NAMESPACE . '/live-voice-options'),
                    'projectTemplates' => rest_url(self::REST_NAMESPACE . '/project-templates'),
                    ],
                    'auth' => [
                        'restBase' => $auth['restBase'],
                        'windowsUrl' => $auth['windowsUrl'],
                        'renderUrl' => $auth['renderUrl'],
                        'authUrl' => $auth['authUrl'],
                        'user' => $auth['user'],
                        'expires' => $auth['expires'],
                    ],
                ],
                'metrics' => [
                    'npcWindows' => count($windows),
                    'approvedShortcodes' => count($shortcode_items),
                    'registeredShortcodes' => count($metrics['registered_tags']),
                    'matchedShortcodes' => $metrics['matched'],
                    'missingShortcodes' => $metrics['missing'],
                    'pages' => count($pages),
                    'posts' => count($posts),
                    'media' => count($media),
                    'customPostTypes' => count($post_types),
                    'taxonomies' => count($taxonomies),
                    'menus' => count($menus),
                    'featureGroups' => count($feature_groups),
                ],
                'features' => [
                    'windows' => $windows,
                    'shortcodes' => $shortcode_items,
                    'dashboardPages' => $this->rest_page_payload(),
                    'pages' => $pages,
                    'posts' => $posts,
                    'media' => $media,
                    'postTypes' => array_values($post_types),
                    'taxonomies' => array_values($taxonomies),
                    'menus' => $menus,
                    'featureGroups' => $feature_groups,
                    'diagnostics' => $this->diagnostics_payload($shortcode_items, $source_windows),
                    'commandCenter' => [
                        'brand' => $this->rest_window_payload(['title' => 'Brand GPT', 'team' => 'Pinned Brand UI', 'shortcode' => '[bsp_app]'], 0, false),
                        'operatorPanels' => [
                            ['title' => 'Brand GPT', 'shortcode' => '[bsp_app]', 'route' => rest_url(self::REST_NAMESPACE . '/render-url?tag=bsp_app')],
                            ['title' => 'Diagnostics', 'shortcode' => '[v0map_npc_api_dashboard]', 'route' => rest_url(self::REST_NAMESPACE . '/diagnostics')],
                            ['title' => 'Shortcodes', 'shortcode' => '[v0map_shortcode_dashboard]', 'route' => rest_url(self::REST_NAMESPACE . '/shortcodes?limit=300')],
                        ],
                    ],
                    'health' => [
                        'styledIframeRender' => true,
                        'oneWindowAtATime' => true,
                        'pinnedShortcode' => '[bsp_app]',
                        'iframeCookieFix' => function_exists('header_register_callback'),
                        'allowedFrameAncestors' => [
                            home_url(),
                            $this->options()['localhost_world_url'],
                            $this->options()['app_url'],
                        ],
                    ],
                ],
            ]
        );
    }


    public function rest_api_map(WP_REST_Request $request) {
        return rest_ensure_response(
            [
                'ok' => true,
                'site' => home_url(),
                'namespace' => self::REST_NAMESPACE,
                'routes' => $this->api_route_summary(),
                'coreRoutes' => [
                    'pages' => rest_url('wp/v2/pages'),
                    'posts' => rest_url('wp/v2/posts'),
                    'media' => rest_url('wp/v2/media'),
                    'types' => rest_url('wp/v2/types'),
                    'taxonomies' => rest_url('wp/v2/taxonomies'),
                    'menus' => rest_url('wp/v2/menus'),
                    'settings' => rest_url('wp/v2/settings'),
                    'usersMe' => rest_url('wp/v2/users/me'),
                ],
                'renderMode' => [
                    'shortcodePage' => home_url('/v0map-npc-gallery/'),
                    'queryTag' => 'v0map_shortcode_tag',
                    'fullAssets' => 'v0map_full_assets=1',
                    'reason' => __('Use the render page iframe when you need real WordPress CSS, JS, forms, login widgets, and plugin assets.', 'v0map-npc-gallery'),
                ],
            ]
        );
    }

    public function rest_feature_suite(WP_REST_Request $request) {
        $limit = max(1, min(160, absint($request->get_param('limit') ?: 60)));
        $windows = [];
        $source_windows = array_slice($this->unique_windows_by_shortcode($this->parse_npc_windows()), 0, 200);

        foreach ($source_windows as $index => $window) {
            $windows[] = $this->rest_window_payload($window, $index, false);
        }

        $pages = $this->content_items('page', $limit);
        $posts = $this->content_items('post', $limit);
        $media = $this->media_items($limit);
        $custom = [];
        foreach ($this->public_rest_post_types() as $post_type => $post_type_data) {
            if (in_array($post_type, ['post', 'page', 'attachment'], true)) {
                continue;
            }
            $custom[$post_type] = [
                'label' => $post_type_data['label'],
                'restBase' => $post_type_data['restBase'],
                'items' => $this->content_items($post_type, min(8, $limit)),
            ];
        }

        $metrics = $this->connection_metrics();
        $feature_groups = $this->feature_group_metrics($windows);
        $auth = $this->bridge_auth_payload();
        $plugins = $this->plugin_payload();
        $api_routes = $this->api_route_summary();
        $menus = $this->menu_items_payload(true);
        $shortcode_items = $this->all_shortcode_items();

        return rest_ensure_response(
            [
                'ok' => true,
                'source' => 'wordpress-plugin-v0map-npc-gallery-feature-suite',
                'generatedAt' => current_time('mysql'),
                'site' => [
                    'url' => home_url(),
                    'name' => get_bloginfo('name'),
                    'description' => get_bloginfo('description'),
                    'language' => get_bloginfo('language'),
                    'timezone' => wp_timezone_string(),
                    'adminUrl' => admin_url(),
                    'frontPageId' => (int) get_option('page_on_front'),
                    'postsPageId' => (int) get_option('page_for_posts'),
                    'restUrl' => rest_url(),
                    'homePath' => wp_parse_url(home_url('/'), PHP_URL_PATH),
                ],
                'plugin' => [
                    'name' => 'V0Map NPC Gallery',
                    'version' => V0MAP_NPC_GALLERY_VERSION,
                    'dashboardUrl' => admin_url('admin.php?page=v0map-npc-gallery'),
                    'settings' => [
                        'appUrl' => $this->options()['app_url'],
                        'localhostWorldUrl' => $this->options()['localhost_world_url'],
                        'defaultDomain' => $this->options()['default_domain'],
                        'authSync' => $this->options()['auth_sync'] === '1',
                        'npcSync' => $this->options()['npc_sync'] === '1',
                        'liveConnection' => $this->options()['live_connection'] === '1',
                        'autoCreatePages' => $this->options()['auto_create_pages'] === '1',
                        'apiAuthRequired' => $this->options()['api_auth_required'] === '1',
                    ],
                ],
                'connection' => [
                    'ok' => true,
                    'basicAuthUser' => is_user_logged_in() ? wp_get_current_user()->user_login : '',
                    'auth' => [
                        'restBase' => $auth['restBase'],
                        'windowsUrl' => $auth['windowsUrl'],
                        'renderUrl' => $auth['renderUrl'],
                        'authUrl' => $auth['authUrl'],
                        'user' => $auth['user'],
                        'expires' => $auth['expires'],
                    ],
                    'routes' => $api_routes,
                ],
                'metrics' => [
                    'npcWindows' => count($windows),
                    'approvedShortcodes' => count($shortcode_items),
                    'registeredShortcodes' => count($metrics['registered_tags']),
                    'matchedShortcodes' => $metrics['matched'],
                    'missingShortcodes' => $metrics['missing'],
                    'pages' => count($pages),
                    'posts' => count($posts),
                    'media' => count($media),
                    'customPostTypes' => count($custom),
                    'taxonomies' => count($this->public_rest_taxonomies()),
                    'menus' => count($menus),
                    'activePlugins' => count(array_filter($plugins, static fn($plugin) => !empty($plugin['active']))),
                    'totalPlugins' => count($plugins),
                    'apiRoutes' => count($api_routes),
                    'featureGroups' => count($feature_groups),
                    'themeSupports' => count($this->theme_payload()['supports']),
                    'diagnosticReadinessScore' => $this->diagnostics_payload($shortcode_items, $source_windows)['readinessScore'],
                ],
                'features' => [
                    'windows' => $windows,
                    'shortcodes' => $shortcode_items,
                    'shortcodeProviders' => $this->shortcode_provider_groups($shortcode_items),
                    'dashboardPages' => $this->rest_page_payload(),
                    'pages' => $pages,
                    'posts' => $posts,
                    'media' => $media,
                    'customContent' => $custom,
                    'postTypes' => array_values($this->public_rest_post_types()),
                    'taxonomies' => array_values($this->public_rest_taxonomies()),
                    'menus' => $menus,
                    'theme' => $this->theme_payload(),
                    'plugins' => $plugins,
                    'sidebars' => $this->widget_sidebars_payload(),
                    'comments' => $this->recent_comments_payload(min(10, $limit)),
                    'apiRoutes' => $api_routes,
                    'featureGroups' => $feature_groups,
                    'diagnostics' => $this->diagnostics_payload($shortcode_items, $source_windows),
                    'commandCenter' => [
                        'brand' => $this->rest_window_payload(['title' => 'Brand GPT', 'team' => 'Pinned Brand UI', 'shortcode' => '[bsp_app]'], 0, false),
                        'operatorPanels' => [
                            ['title' => 'Brand GPT', 'shortcode' => '[bsp_app]', 'route' => rest_url(self::REST_NAMESPACE . '/render-url?tag=bsp_app')],
                            ['title' => 'Diagnostics', 'shortcode' => '[v0map_npc_api_dashboard]', 'route' => rest_url(self::REST_NAMESPACE . '/diagnostics')],
                            ['title' => 'Shortcodes', 'shortcode' => '[v0map_shortcode_dashboard]', 'route' => rest_url(self::REST_NAMESPACE . '/shortcodes?limit=300')],
                        ],
                    ],
                    'health' => [
                        'styledIframeRender' => true,
                        'oneWindowAtATime' => true,
                        'pinnedShortcode' => '[bsp_app]',
                        'iframeCookieFix' => function_exists('header_register_callback'),
                        'srcDocDisabledForLiveWindows' => true,
                        'serverSideBasicAuthProxy' => true,
                        'allowedFrameAncestors' => [
                            home_url(),
                            $this->options()['localhost_world_url'],
                            $this->options()['app_url'],
                        ],
                    ],
                ],
            ]
        );
    }

    public function rest_diagnostics(WP_REST_Request $request) {
        $metrics = $this->connection_metrics();
        $shortcodes = $this->all_shortcode_items();
        $windows = $this->unique_windows_by_shortcode($this->parse_npc_windows());
        $diagnostics = $this->diagnostics_payload($shortcodes, $windows);

        return rest_ensure_response(
            [
                'ok' => true,
                'source' => 'wordpress-plugin-v0map-npc-gallery-diagnostics',
                'generatedAt' => current_time('mysql'),
                'site' => [
                    'url' => home_url(),
                    'name' => get_bloginfo('name'),
                    'restUrl' => rest_url(),
                    'timezone' => wp_timezone_string(),
                ],
                'plugin' => [
                    'name' => 'V0Map NPC Gallery',
                    'version' => V0MAP_NPC_GALLERY_VERSION,
                    'dashboardUrl' => admin_url('admin.php?page=v0map-npc-gallery'),
                ],
                'connection' => [
                    'basicAuthUser' => is_user_logged_in() ? wp_get_current_user()->user_login : '',
                    'server' => [
                        'php' => PHP_VERSION,
                        'wp' => get_bloginfo('version'),
                        'https' => is_ssl(),
                        'permalinks' => (bool) get_option('permalink_structure'),
                    ],
                    'headers' => [
                        'frameAncestors' => true,
                        'cookieRewriteCallback' => function_exists('header_register_callback'),
                        'restCors' => true,
                    ],
                ],
                'metrics' => $metrics,
                'diagnostics' => $diagnostics,
                'routes' => $this->api_route_summary(),
                'quickTests' => [
                    ['label' => 'Application Password ping', 'url' => rest_url(self::FAPC_REST_NAMESPACE . '/ping'), 'expected' => '200 with Basic Auth'],
                    ['label' => 'Shortcode window pull', 'url' => rest_url(self::REST_NAMESPACE . '/windows?render=0&limit=30'), 'expected' => 'JSON windows list'],
                    ['label' => 'Styled Brand GPT render', 'url' => add_query_arg(['v0map_shortcode_tag' => 'bsp_app', 'v0map_embed' => '1', 'v0map_full_assets' => '1'], home_url('/v0map-npc-gallery/')), 'expected' => 'Styled iframe page'],
                    ['label' => 'Feature suite', 'url' => rest_url(self::REST_NAMESPACE . '/feature-suite?limit=60'), 'expected' => 'WordPress API feature payload'],
                ],
            ]
        );
    }

    public function rest_command_center(WP_REST_Request $request) {
        $limit = max(1, min(160, absint($request->get_param('limit') ?: 60)));
        $windows = array_slice($this->unique_windows_by_shortcode($this->parse_npc_windows()), 0, $limit);
        $shortcodes = $this->all_shortcode_items();
        $window_payload = [];

        foreach ($windows as $index => $window) {
            $window_payload[] = $this->rest_window_payload($window, $index, false);
        }

        $brand = $this->rest_window_payload(['title' => 'Brand GPT', 'team' => 'Pinned Brand UI', 'shortcode' => '[bsp_app]'], 0, false);
        $groups = $this->shortcode_provider_groups($shortcodes);

        return rest_ensure_response(
            [
                'ok' => true,
                'source' => 'wordpress-plugin-v0map-npc-gallery-command-center',
                'generatedAt' => current_time('mysql'),
                'brand' => $brand,
                'site' => [
                    'url' => home_url(),
                    'name' => get_bloginfo('name'),
                    'adminUrl' => admin_url(),
                ],
                'plugin' => [
                    'version' => V0MAP_NPC_GALLERY_VERSION,
                    'dashboardUrl' => admin_url('admin.php?page=v0map-npc-gallery'),
                ],
                'operatorPanels' => [
                    ['title' => 'Brand GPT Window', 'shortcode' => '[bsp_app]', 'url' => $brand['liveUrl'], 'priority' => 'pinned'],
                    ['title' => 'NPC Shortcode Windows', 'shortcode' => '[v0map_npc_windows]', 'url' => rest_url(self::REST_NAMESPACE . '/windows?render=0&limit=' . $limit), 'priority' => 'live-api'],
                    ['title' => 'API Feature Suite', 'shortcode' => '[v0map_npc_api_dashboard]', 'url' => rest_url(self::REST_NAMESPACE . '/feature-suite?limit=' . $limit), 'priority' => 'diagnostics'],
                    ['title' => 'Shortcode Discovery', 'shortcode' => '[v0map_shortcode_dashboard]', 'url' => rest_url(self::REST_NAMESPACE . '/shortcodes?limit=300'), 'priority' => 'inventory'],
                ],
                'shortcodeGroups' => $groups,
                'windows' => $window_payload,
                'pages' => $this->rest_page_payload(),
                'actions' => [
                    ['label' => 'Open styled Brand GPT iframe', 'href' => $brand['liveUrl']],
                    ['label' => 'Open plugin settings', 'href' => admin_url('admin.php?page=v0map-npc-gallery')],
                    ['label' => 'Open REST feature suite', 'href' => rest_url(self::REST_NAMESPACE . '/feature-suite?limit=' . $limit)],
                    ['label' => 'Open REST diagnostics', 'href' => rest_url(self::REST_NAMESPACE . '/diagnostics')],
                ],
            ]
        );
    }

    public function rest_search(WP_REST_Request $request) {
        $query = sanitize_text_field((string) ($request->get_param('q') ?: ''));
        $limit = max(1, min(60, absint($request->get_param('limit') ?: 20)));
        $shortcode_matches = [];

        foreach ($this->all_shortcode_items() as $item) {
            $haystack = strtolower(trim(($item['title'] ?? '') . ' ' . ($item['team'] ?? '') . ' ' . ($item['shortcode'] ?? '') . ' ' . ($item['tag'] ?? '')));
            if ($query === '' || strpos($haystack, strtolower($query)) !== false) {
                $shortcode_matches[] = $item;
            }
        }

        $content_matches = [];
        if ($query !== '') {
            $types = array_keys($this->public_rest_post_types());
            $wp_query = new WP_Query([
                's' => $query,
                'post_type' => $types,
                'post_status' => ['publish', 'inherit'],
                'posts_per_page' => $limit,
                'orderby' => 'modified',
                'order' => 'DESC',
                'no_found_rows' => true,
            ]);

            foreach ($wp_query->posts as $post) {
                if ($post instanceof WP_Post) {
                    $content_matches[] = $post->post_type === 'attachment' ? $this->media_payload($post) : $this->post_payload($post);
                }
            }
        }

        return rest_ensure_response([
            'ok' => true,
            'query' => $query,
            'limit' => $limit,
            'matches' => [
                'shortcodes' => array_slice($shortcode_matches, 0, $limit),
                'content' => $content_matches,
            ],
            'metrics' => [
                'shortcodes' => count($shortcode_matches),
                'content' => count($content_matches),
            ],
        ]);
    }

    public function rest_render_url(WP_REST_Request $request) {
        $tag = sanitize_text_field((string) ($request->get_param('tag') ?: ''));
        $shortcode = trim((string) ($request->get_param('shortcode') ?: ''));

        if ($tag === '' && $shortcode !== '') {
            $tag = $this->extract_shortcode_tag($shortcode);
        }
        if ($shortcode === '' && $tag !== '') {
            $shortcode = '[' . $tag . ']';
        }

        if ($tag === '') {
            return new WP_Error('v0map_missing_shortcode_tag', __('Missing shortcode tag or shortcode.', 'v0map-npc-gallery'), ['status' => 400]);
        }

        $payload = $this->rest_window_payload(['title' => '[' . $tag . ']', 'team' => 'WordPress Render', 'shortcode' => $shortcode], 0, false);
        $payload['ok'] = true;
        $payload['renderMode'] = 'styled-wordpress-iframe-url';
        $payload['instructions'] = __('Load liveUrl in an iframe for real WordPress CSS/JS. Do not use srcDoc for live plugin shortcodes.', 'v0map-npc-gallery');

        return rest_ensure_response($payload);
    }

    public function send_rest_cors_headers($served, $result, $request, $server) {
        if (!$request instanceof WP_REST_Request || (strpos($request->get_route(), '/' . self::REST_NAMESPACE . '/') !== 0 && strpos($request->get_route(), '/' . self::FAPC_REST_NAMESPACE . '/') !== 0)) {
            return $served;
        }

        $options = $this->options();
        $allowed = [
            untrailingslashit((string) $options['localhost_world_url']),
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3006',
            'http://127.0.0.1:3006',
            'https://' . $options['default_domain'],
            untrailingslashit((string) $options['app_url']),
        ];
        $origin = get_http_origin();

        if ($origin && in_array(untrailingslashit($origin), array_unique($allowed), true)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce, X-V0Map-Token');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        }

        return $served;
    }


    public function send_iframe_parent_headers(): void {
        $options = $this->options();
        $allowed = [
            "'self'",
            'https://' . $options['default_domain'],
            'https://www.' . $options['default_domain'],
            untrailingslashit((string) $options['app_url']),
            untrailingslashit((string) $options['localhost_world_url']),
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3006',
            'http://localhost:5173',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3006',
            'http://127.0.0.1:5173',
        ];

        $allowed = array_values(array_unique(array_filter($allowed)));
        header_remove('X-Frame-Options');
        header('Content-Security-Policy: frame-ancestors ' . implode(' ', $allowed) . ';');
    }

    public function register_iframe_cookie_callback(): void {
        if (!function_exists('header_register_callback')) {
            return;
        }

        header_register_callback(function (): void {
            $headers = headers_list();
            $has_cookie = false;

            foreach ($headers as $header) {
                if (stripos($header, 'Set-Cookie:') === 0) {
                    $has_cookie = true;
                    break;
                }
            }

            if (!$has_cookie) {
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
    }

    private function build_app_url(string $url): string {
        $options = $this->options();
        $url = $url !== '' ? $url : $options['app_url'];

        if ($options['persist_local_session'] !== '1' && $options['auth_sync'] !== '1' && $options['npc_sync'] !== '1') {
            return $url;
        }

        $host = wp_parse_url($url, PHP_URL_HOST);
        $is_local = in_array($host, ['localhost', '127.0.0.1', '::1'], true);

        if (!$is_local && $options['auth_sync'] !== '1' && $options['npc_sync'] !== '1') {
            return $url;
        }

        $auth_payload = $this->bridge_auth_payload();
        $session_payload = [
            'site' => home_url(),
            'user' => get_current_user_id(),
            'time' => time(),
            'domain' => $options['default_domain'],
            'localWorldUrl' => $options['localhost_world_url'],
            'authSync' => $options['auth_sync'] === '1',
            'npcSync' => $options['npc_sync'] === '1',
            'windows' => count($this->parse_npc_windows()),
            'api' => $auth_payload,
            'pages' => $this->rest_page_payload(),
        ];

        return add_query_arg(
            [
                'v0map_wp' => '1',
                'v0map_wp_user' => get_current_user_id(),
                'v0map_wp_session' => wp_create_nonce('v0map_localhost_session_' . get_current_user_id()),
                'v0map_rest_nonce' => $auth_payload['nonce'],
                'v0map_rest_base' => rawurlencode($auth_payload['restBase']),
                'v0map_bridge_user' => $auth_payload['user'],
                'v0map_bridge_expires' => $auth_payload['expires'],
                'v0map_bridge_token' => $auth_payload['token'],
                'v0map_wp_context' => rawurlencode(wp_json_encode($session_payload)),
                'v0map_domain' => rawurlencode((string) $options['default_domain']),
                'v0map_auth_sync' => $options['auth_sync'],
                'v0map_npc_sync' => $options['npc_sync'],
            ],
            $url
        );
    }

    private function extract_shortcode_tag(string $shortcode): string {
        if (preg_match('/^\[\s*([A-Za-z0-9_-]+)/', trim($shortcode), $matches)) {
            return (string) $matches[1];
        }

        return '';
    }

    private function safe_do_shortcode(string $shortcode): array {
        $shortcode = trim($shortcode);
        $tag = $this->extract_shortcode_tag($shortcode);

        if ($shortcode === '') {
            return [
                'html' => '',
                'error' => '',
            ];
        }

        try {
            return [
                'html' => do_shortcode($shortcode),
                'error' => '',
            ];
        } catch (Throwable $error) {
            return [
                'html' => sprintf(
                    '<div class="v0map-shortcode-error"><strong>%1$s</strong><p>%2$s</p><code>[%3$s]</code></div>',
                    esc_html__('WordPress shortcode render error', 'v0map-npc-gallery'),
                    esc_html($error->getMessage()),
                    esc_html($tag)
                ),
                'error' => $error->getMessage(),
            ];
        }
    }

    private function connection_metrics(): array {
        global $shortcode_tags;

        $registered = array_keys((array) $shortcode_tags);
        $registered_lookup = array_fill_keys($registered, true);
        $windows = $this->parse_npc_windows();
        $matched = 0;
        $missing = 0;

        foreach ($windows as $window) {
            $tag = $this->extract_shortcode_tag((string) ($window['shortcode'] ?? ''));
            if ($tag !== '' && isset($registered_lookup[$tag])) {
                $matched++;
            } else {
                $missing++;
            }
        }

        return [
            'windows' => count($windows),
            'registered' => count($registered),
            'matched' => $matched,
            'missing' => $missing,
            'registered_tags' => $registered,
        ];
    }

    private function render_connection_panel(string $context = 'dashboard'): string {
        $options = $this->options();

        if ($options['live_connection'] !== '1') {
            return '';
        }

        $metrics = $this->connection_metrics();
        $app_url = $this->build_app_url((string) $options['app_url']);
        $world_url = $this->build_app_url((string) $options['localhost_world_url']);
        $auth_payload = $this->bridge_auth_payload();

        ob_start();
        ?>
        <section
            class="v0map-live-panel"
            data-v0map-live-panel
            data-v0map-live-context="<?php echo esc_attr($context); ?>"
            data-v0map-live-url="<?php echo esc_url($app_url); ?>"
            data-v0map-world-url="<?php echo esc_url($world_url); ?>"
            data-v0map-domain="<?php echo esc_attr((string) $options['default_domain']); ?>"
            data-v0map-auth-sync="<?php echo esc_attr((string) $options['auth_sync']); ?>"
            data-v0map-npc-sync="<?php echo esc_attr((string) $options['npc_sync']); ?>"
            data-v0map-user="<?php echo esc_attr((string) get_current_user_id()); ?>"
            data-v0map-rest-base="<?php echo esc_url($auth_payload['restBase']); ?>"
            data-v0map-windows-url="<?php echo esc_url($auth_payload['windowsUrl']); ?>"
            data-v0map-bridge-token="<?php echo esc_attr($auth_payload['token']); ?>"
            data-v0map-bridge-expires="<?php echo esc_attr((string) $auth_payload['expires']); ?>"
            data-v0map-rest-nonce="<?php echo esc_attr($auth_payload['nonce']); ?>"
        >
            <div class="v0map-live-panel__main">
                <div>
                    <h3><?php echo esc_html($options['connection_title']); ?></h3>
                    <p>
                        <?php
                        printf(
                            esc_html__('Domain: %1$s | Local world: %2$s', 'v0map-npc-gallery'),
                            esc_html((string) $options['default_domain']),
                            esc_html((string) $options['localhost_world_url'])
                        );
                        ?>
                    </p>
                </div>
                <div class="v0map-live-panel__status">
                    <span class="v0map-live-pill" data-v0map-live-status="app"><?php esc_html_e('Checking app', 'v0map-npc-gallery'); ?></span>
                    <span class="v0map-live-pill" data-v0map-live-status="world"><?php esc_html_e('Checking localhost', 'v0map-npc-gallery'); ?></span>
                </div>
            </div>
            <div class="v0map-live-panel__metrics">
                <div><strong><?php echo esc_html((string) $metrics['windows']); ?></strong><span><?php esc_html_e('NPC windows', 'v0map-npc-gallery'); ?></span></div>
                <div><strong><?php echo esc_html((string) $metrics['matched']); ?></strong><span><?php esc_html_e('registered NPC shortcodes', 'v0map-npc-gallery'); ?></span></div>
                <div><strong><?php echo esc_html((string) $metrics['missing']); ?></strong><span><?php esc_html_e('missing handlers', 'v0map-npc-gallery'); ?></span></div>
                <div><strong><?php echo $options['auth_sync'] === '1' ? esc_html__('On', 'v0map-npc-gallery') : esc_html__('Off', 'v0map-npc-gallery'); ?></strong><span><?php esc_html_e('auth sync', 'v0map-npc-gallery'); ?></span></div>
            </div>
        </section>
        <?php
        return (string) ob_get_clean();
    }

    private function registered_shortcode_tags(): array {
        global $shortcode_tags;

        return array_values(array_unique(array_map('strval', array_keys((array) $shortcode_tags))));
    }

    private function unique_windows_by_shortcode(array $windows): array {
        $seen = [];
        $unique = [];

        foreach ($windows as $window) {
            $tag = (string) ($window['tag'] ?? $this->extract_shortcode_tag((string) ($window['shortcode'] ?? '')));
            $key = !empty($window['agentNo']) ? 'agent-' . (int) $window['agentNo'] : ($tag !== '' ? $tag : md5((string) ($window['title'] ?? '') . (string) ($window['primaryLink'] ?? '')));
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $unique[] = $window;
        }

        return $unique;
    }

    private function all_shortcode_items(): array {
        $configured = [];

        foreach ($this->parse_npc_windows() as $index => $window) {
            $tabs = is_array($window['tabs'] ?? null) ? $window['tabs'] : [];
            $tab_list = !empty($tabs) ? $tabs : [['tag' => (string) ($window['tag'] ?? ''), 'shortcode' => (string) ($window['shortcode'] ?? '')]];
            foreach ($tab_list as $tab) {
                $tag = (string) ($tab['tag'] ?? $this->extract_shortcode_tag((string) ($tab['shortcode'] ?? '')));
                if ($tag === '') {
                    continue;
                }
                $configured[$tag] = [
                    'id' => 'npc-window-' . (int) ($window['agentNo'] ?? ($index + 1)) . '-' . sanitize_title($tag),
                    'index' => $index,
                    'npcId' => (int) ($window['agentNo'] ?? ($index + 1)),
                    'agentNo' => (int) ($window['agentNo'] ?? ($index + 1)),
                    'title' => sanitize_text_field((string) ($window['title'] ?? $tag)),
                    'team' => sanitize_text_field((string) ($window['team'] ?? __('WordPress', 'v0map-npc-gallery'))),
                    'tag' => $tag,
                    'shortcode' => (string) ($tab['shortcode'] ?? ('[' . $tag . ']')),
                    'registered' => shortcode_exists($tag),
                    'pageUrl' => add_query_arg(['v0map_shortcode_tag' => $tag, 'v0map_embed' => '1', 'v0map_full_assets' => '1'], home_url('/v0map-npc-gallery/')),
                    'liveUrl' => add_query_arg(['v0map_shortcode_tag' => $tag, 'v0map_shortcode' => $shortcode, 'v0map_embed' => '1', 'v0map_full_assets' => '1'], home_url('/v0map-npc-gallery/')),
                    'wordpressUrl' => add_query_arg(['v0map_shortcode_tag' => $tag, 'v0map_embed' => '1', 'v0map_full_assets' => '1'], home_url('/v0map-npc-gallery/')),
                    'editUrl' => admin_url('admin.php?page=v0map-npc-gallery'),
                ];
            }
        }

        return array_values($configured);
    }

    private function content_items(string $post_type, int $limit = 20): array {
        $items = get_posts(
            [
                'post_type' => $post_type,
                'post_status' => $post_type === 'attachment' ? 'inherit' : 'publish',
                'numberposts' => $limit,
                'orderby' => 'modified',
                'order' => 'DESC',
                'suppress_filters' => false,
            ]
        );

        return array_values(array_map([$this, 'post_payload'], $items));
    }

    private function media_items(int $limit = 20): array {
        $items = get_posts(
            [
                'post_type' => 'attachment',
                'post_status' => 'inherit',
                'numberposts' => $limit,
                'orderby' => 'modified',
                'order' => 'DESC',
                'suppress_filters' => false,
            ]
        );

        return array_values(array_map([$this, 'media_payload'], $items));
    }

    private function post_payload(WP_Post $post): array {
        return [
            'id' => (int) $post->ID,
            'type' => $post->post_type,
            'title' => get_the_title($post),
            'slug' => $post->post_name,
            'link' => get_permalink($post),
            'modified' => get_post_modified_time('c', true, $post),
            'date' => get_post_time('c', true, $post),
            'status' => $post->post_status,
            'excerpt' => wp_strip_all_tags(get_the_excerpt($post)),
            'editUrl' => current_user_can('edit_post', $post->ID) ? get_edit_post_link($post->ID, '') : '',
        ];
    }

    private function media_payload(WP_Post $post): array {
        $payload = $this->post_payload($post);
        $payload['id'] = (int) $post->ID;
        $payload['ID'] = (int) $post->ID;
        $payload['wpId'] = (int) $post->ID;
        $payload['databaseId'] = (int) $post->ID;
        $payload['sourceUrl'] = wp_get_attachment_url($post->ID);
        $payload['source_url'] = $payload['sourceUrl'];
        $payload['mimeType'] = get_post_mime_type($post->ID);
        $payload['mime_type'] = $payload['mimeType'];
        $payload['mediaType'] = wp_attachment_is_image($post->ID) ? 'image' : 'file';
        $payload['media_type'] = $payload['mediaType'];
        $payload['thumbnailUrl'] = wp_get_attachment_image_url($post->ID, 'medium') ?: $payload['sourceUrl'];
        $payload['stableKey'] = 'wp-media-' . (int) $post->ID;
        return $payload;
    }

    private function public_rest_post_types(): array {
        $objects = get_post_types(['show_in_rest' => true], 'objects');
        $payload = [];

        foreach ($objects as $name => $object) {
            $payload[$name] = [
                'name' => $name,
                'label' => $object->label,
                'singularLabel' => $object->labels->singular_name ?? $object->label,
                'restBase' => $object->rest_base ?: $name,
                'hierarchical' => (bool) $object->hierarchical,
                'public' => (bool) $object->public,
                'hasArchive' => (bool) $object->has_archive,
            ];
        }

        return $payload;
    }

    private function public_rest_taxonomies(): array {
        $objects = get_taxonomies(['show_in_rest' => true], 'objects');
        $payload = [];

        foreach ($objects as $name => $object) {
            $payload[$name] = [
                'name' => $name,
                'label' => $object->label,
                'restBase' => $object->rest_base ?: $name,
                'hierarchical' => (bool) $object->hierarchical,
                'public' => (bool) $object->public,
            ];
        }

        return $payload;
    }

    private function menu_items_payload(bool $include_items = false): array {
        $menus = function_exists('wp_get_nav_menus') ? wp_get_nav_menus() : [];
        $locations = function_exists('get_nav_menu_locations') ? get_nav_menu_locations() : [];
        $location_lookup = [];

        foreach ($locations as $location => $menu_id) {
            $location_lookup[(int) $menu_id][] = (string) $location;
        }

        $payload = [];
        foreach ($menus as $menu) {
            $menu_id = (int) $menu->term_id;
            $entry = [
                'id' => $menu_id,
                'name' => $menu->name,
                'slug' => $menu->slug,
                'count' => (int) $menu->count,
                'locations' => $location_lookup[$menu_id] ?? [],
            ];

            if ($include_items) {
                $items = wp_get_nav_menu_items($menu_id) ?: [];
                $entry['items'] = array_values(array_map(static function ($item) {
                    return [
                        'id' => (int) $item->ID,
                        'title' => $item->title,
                        'url' => $item->url,
                        'type' => $item->type,
                        'object' => $item->object,
                        'parent' => (int) $item->menu_item_parent,
                    ];
                }, $items));
            }

            $payload[] = $entry;
        }

        return $payload;
    }

    private function feature_group_metrics(array $windows): array {
        $groups = [];

        foreach ($windows as $window) {
            $team = sanitize_text_field((string) ($window['team'] ?? 'WordPress'));
            if (!isset($groups[$team])) {
                $groups[$team] = [
                    'team' => $team,
                    'total' => 0,
                    'registered' => 0,
                    'missing' => 0,
                    'shortcodes' => [],
                ];
            }

            $groups[$team]['total']++;
            if (!empty($window['registered'])) {
                $groups[$team]['registered']++;
            } else {
                $groups[$team]['missing']++;
            }
            $groups[$team]['shortcodes'][] = '[' . sanitize_text_field((string) ($window['tag'] ?? '')) . ']';
        }

        return array_values($groups);
    }


    private function diagnostics_payload(array $shortcodes, array $windows): array {
        $registered = $this->registered_shortcode_tags();
        $registered_lookup = array_fill_keys($registered, true);
        $configured_tags = [];
        $duplicates = [];
        $seen = [];

        foreach ($windows as $window) {
            $tag = $this->extract_shortcode_tag((string) ($window['shortcode'] ?? ''));
            if ($tag === '') {
                continue;
            }
            $configured_tags[] = $tag;
            if (isset($seen[strtolower($tag)])) {
                $duplicates[] = $tag;
            }
            $seen[strtolower($tag)] = true;
        }

        $missing = [];
        $matched = [];
        foreach ($shortcodes as $item) {
            $tag = (string) ($item['tag'] ?? '');
            if ($tag === '') {
                continue;
            }
            if (isset($registered_lookup[$tag])) {
                $matched[] = $tag;
            } else {
                $missing[] = $tag;
            }
        }

        $critical = ['bsp_app', 'aisc_dashboard', 'agent_workflow_chat', 'fluentform', 'ultimatemember_login'];
        $critical_checks = [];
        foreach ($critical as $tag) {
            $critical_checks[] = [
                'tag' => $tag,
                'shortcode' => (string) ($tab['shortcode'] ?? ('[' . $tag . ']')),
                'registered' => isset($registered_lookup[$tag]),
                'liveUrl' => add_query_arg(['v0map_shortcode_tag' => $tag, 'v0map_shortcode' => $shortcode, 'v0map_embed' => '1', 'v0map_full_assets' => '1'], home_url('/v0map-npc-gallery/')),
            ];
        }

        $score = 0;
        $score += is_ssl() ? 20 : 0;
        $score += function_exists('header_register_callback') ? 20 : 0;
        $score += shortcode_exists('bsp_app') ? 25 : 0;
        $score += count($matched) > 0 ? 20 : 0;
        $score += empty($duplicates) ? 15 : 0;

        return [
            'readinessScore' => min(100, $score),
            'mode' => 'live-wordpress-api-styled-shortcode-iframes',
            'brandPinned' => shortcode_exists('bsp_app'),
            'duplicateConfiguredTags' => array_values(array_unique($duplicates)),
            'configuredTags' => array_values(array_unique($configured_tags)),
            'registeredTagsCount' => count($registered),
            'matchedTags' => array_values(array_unique($matched)),
            'missingTags' => array_values(array_unique($missing)),
            'criticalChecks' => $critical_checks,
            'repairHints' => [
                'Install/activate the plugin that owns any missing shortcode before expecting it to render.',
                'Keep [bsp_app] installed and registered for the pinned Brand GPT UI window.',
                'Use the styled render URL with v0map_full_assets=1 for real CSS and JavaScript.',
                'Use server-side Next API routes for Basic Auth. Do not expose Application Passwords in browser code.',
                'If WordPress login forms show cookie errors inside iframes, keep HTTPS on and keep the iframe cookie/header fix enabled.',
            ],
        ];
    }


    private function api_route_summary(): array {
        return [
            'ping' => rest_url(self::REST_NAMESPACE . '/ping'),
            'fapcPing' => rest_url(self::FAPC_REST_NAMESPACE . '/ping'),
            'health' => rest_url(self::REST_NAMESPACE . '/health'),
            'features' => rest_url(self::REST_NAMESPACE . '/features'),
            'featureSuite' => rest_url(self::REST_NAMESPACE . '/feature-suite'),
            'apiMap' => rest_url(self::REST_NAMESPACE . '/api-map'),
            'diagnostics' => rest_url(self::REST_NAMESPACE . '/diagnostics'),
            'commandCenter' => rest_url(self::REST_NAMESPACE . '/command-center'),
            'search' => rest_url(self::REST_NAMESPACE . '/search'),
            'renderUrl' => rest_url(self::REST_NAMESPACE . '/render-url'),
                    'liveVoiceOptions' => rest_url(self::REST_NAMESPACE . '/live-voice-options'),
                    'projectTemplates' => rest_url(self::REST_NAMESPACE . '/project-templates'),
            'voiceCommandSuite' => rest_url(self::REST_NAMESPACE . '/voice-command-suite'),
            'projectManagerSuite' => rest_url(self::REST_NAMESPACE . '/project-manager-suite'),
            'npcMovementPlaybook' => rest_url(self::REST_NAMESPACE . '/npc-movement-playbook'),
            'windows' => rest_url(self::REST_NAMESPACE . '/windows'),
            'shortcodes' => rest_url(self::REST_NAMESPACE . '/shortcodes'),
            'render' => rest_url(self::REST_NAMESPACE . '/render'),
            'content' => rest_url(self::REST_NAMESPACE . '/content'),
        ];
    }

    private function theme_payload(): array {
        $theme = wp_get_theme();
        $parent = $theme->parent();
        $supports = [];
        foreach (['post-thumbnails', 'title-tag', 'custom-logo', 'custom-header', 'custom-background', 'menus', 'widgets', 'html5', 'align-wide', 'responsive-embeds', 'editor-styles', 'wp-block-styles'] as $feature) {
            if (current_theme_supports($feature)) {
                $supports[] = $feature;
            }
        }

        return [
            'name' => $theme->get('Name'),
            'version' => $theme->get('Version'),
            'template' => get_template(),
            'stylesheet' => get_stylesheet(),
            'parent' => $parent ? $parent->get('Name') : '',
            'supports' => $supports,
        ];
    }

    private function plugin_payload(): array {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugins = function_exists('get_plugins') ? get_plugins() : [];
        $active = array_fill_keys((array) get_option('active_plugins', []), true);
        $payload = [];

        foreach ($plugins as $file => $data) {
            $payload[] = [
                'file' => $file,
                'name' => $data['Name'] ?? $file,
                'version' => $data['Version'] ?? '',
                'textDomain' => $data['TextDomain'] ?? '',
                'active' => isset($active[$file]) || is_plugin_active_for_network($file),
            ];
        }

        usort($payload, static function ($a, $b) {
            return strcasecmp((string) $a['name'], (string) $b['name']);
        });

        return $payload;
    }

    private function shortcode_provider_groups(array $shortcodes): array {
        $groups = [];
        foreach ($shortcodes as $item) {
            $team = sanitize_text_field((string) ($item['team'] ?? 'WordPress'));
            if (!isset($groups[$team])) {
                $groups[$team] = [
                    'team' => $team,
                    'total' => 0,
                    'registered' => 0,
                    'missing' => 0,
                    'items' => [],
                ];
            }
            $groups[$team]['total']++;
            if (!empty($item['registered'])) {
                $groups[$team]['registered']++;
            } else {
                $groups[$team]['missing']++;
            }
            $groups[$team]['items'][] = [
                'title' => $item['title'] ?? '',
                'tag' => $item['tag'] ?? '',
                'shortcode' => $item['shortcode'] ?? '',
                'registered' => !empty($item['registered']),
                'liveUrl' => $item['liveUrl'] ?? '',
            ];
        }

        return array_values($groups);
    }

    private function widget_sidebars_payload(): array {
        global $wp_registered_sidebars;
        $payload = [];

        foreach ((array) $wp_registered_sidebars as $id => $sidebar) {
            $payload[] = [
                'id' => $id,
                'name' => $sidebar['name'] ?? $id,
                'description' => isset($sidebar['description']) ? wp_strip_all_tags((string) $sidebar['description']) : '',
            ];
        }

        return $payload;
    }

    private function recent_comments_payload(int $limit = 10): array {
        $comments = get_comments([
            'number' => $limit,
            'status' => 'approve',
            'orderby' => 'comment_date_gmt',
            'order' => 'DESC',
        ]);

        return array_values(array_map(static function ($comment) {
            return [
                'id' => (int) $comment->comment_ID,
                'postId' => (int) $comment->comment_post_ID,
                'author' => get_comment_author($comment),
                'date' => get_comment_date('c', $comment),
                'excerpt' => wp_trim_words(wp_strip_all_tags((string) $comment->comment_content), 24),
                'link' => get_comment_link($comment),
            ];
        }, $comments));
    }

    private function stable_shuffle(array $items, string $seed): array {
        $items = array_values($items);
        $state = absint(sprintf('%u', crc32($seed !== '' ? $seed : 'v0map')));

        for ($i = count($items) - 1; $i > 0; $i--) {
            $state = (int) (($state * 1664525 + 1013904223) % 4294967296);
            $j = $state % ($i + 1);
            $tmp = $items[$i];
            $items[$i] = $items[$j];
            $items[$j] = $tmp;
        }

        return $items;
    }


    private function known_history_shortcode_candidates(int $agent_no, string $title): array {
        $map = [
            1 => ['matrix_crm', 'matrix_crm_clients', 'matrix_crm_pipeline', 'matrix_crm_projects', 'matrix_crm_forms', 'matrix_crm_form_builder', 'matrix_crm_team', 'matrix_crm_tags', 'matrix_crm_custom_fields', 'matrix_crm_sheets'],
            9 => ['matrix_crm', 'matrix_crm_clients', 'matrix_crm_pipeline', 'matrix_crm_projects', 'matrix_crm_forms', 'matrix_crm_form_builder', 'matrix_crm_team', 'matrix_crm_tags', 'matrix_crm_custom_fields', 'matrix_crm_sheets'],
            30 => ['cap_clients', 'cap_tradelines', 'cap_cards', 'cap_letters', 'cap_reminders', 'cap_ai', 'cap_settings'],
            41 => ['linkedin_metrix'],
            54 => ['wpve_dashboard'],
            56 => ['aier_admin_dashboard'],
            62 => ['mobile_agent_hub', 'ai_agent_command_hub', 'agent_voice_hub'],
        ];

        $normalized = strtolower($title);
        if (strpos($normalized, 'credit') !== false) {
            $map[$agent_no] = array_values(array_unique(array_merge($map[$agent_no] ?? [], ['cap_credit_ai_pro', 'cap_clients', 'cap_tradelines', 'cap_cards', 'cap_letters', 'cap_reminders', 'cap_ai', 'cap_settings'])));
        }

        return $map[$agent_no] ?? [];
    }

    private function augment_tabs_with_registered_history(int $agent_no, string $title, array $tabs): array {
        $seen = [];
        foreach ($tabs as $tab) {
            if (!empty($tab['tag'])) {
                $seen[(string) $tab['tag']] = true;
            }
        }

        foreach ($this->known_history_shortcode_candidates($agent_no, $title) as $tag) {
            $tag = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $tag);
            if ($tag === '' || isset($seen[$tag]) || !shortcode_exists($tag)) {
                continue;
            }
            $shortcode = '[' . $tag . ']';
            $tabs[] = [
                'title' => $title . ' History ' . count($tabs),
                'tag' => $tag,
                'shortcode' => $shortcode,
                'source' => 'history-registered',
                'liveUrl' => add_query_arg(['v0map_shortcode_tag' => $tag, 'v0map_shortcode' => $shortcode, 'v0map_embed' => '1', 'v0map_full_assets' => '1'], home_url('/v0map-npc-gallery/')),
            ];
            $seen[$tag] = true;
        }

        return $tabs;
    }

    private function parse_npc_windows(?string $raw = null): array {
        $options = $this->options();
        $raw = $raw ?? (string) $options['npc_windows'];
        $lines = preg_split('/\r\n|\r|\n/', $raw);
        $windows = [];

        foreach ($lines as $index => $line) {
            $line = trim((string) $line);
            if ($line === '') {
                continue;
            }

            $parts = array_map('trim', explode('|', $line, 5));
            $title = $parts[0] ?? sprintf(__('NPC Window %d', 'v0map-npc-gallery'), $index + 1);
            $team = $parts[1] ?? __('General', 'v0map-npc-gallery');
            $shortcode_blob = $parts[2] ?? '';
            $primary_link = $parts[3] ?? '';
            $agent_no = isset($parts[4]) ? absint($parts[4]) : ($index + 1);
            preg_match_all('/\[[^\]]+\]/', $shortcode_blob, $matches);
            $tabs = [];

            foreach (($matches[0] ?? []) as $tab_index => $shortcode) {
                $tag = $this->extract_shortcode_tag($shortcode);
                if ($tag !== '') {
                    $tabs[] = [
                        'title' => $title . ($tab_index > 0 ? ' Tab ' . ($tab_index + 1) : ''),
                        'tag' => $tag,
                        'shortcode' => $shortcode,
                        'source' => 'provided',
                        'liveUrl' => add_query_arg(['v0map_shortcode_tag' => $tag, 'v0map_shortcode' => $shortcode, 'v0map_embed' => '1', 'v0map_full_assets' => '1'], home_url('/v0map-npc-gallery/')),
                    ];
                }
            }

            $tabs = $this->augment_tabs_with_registered_history($agent_no, $title, $tabs);
            $has_real_shortcode = !empty($tabs);

            if (!$has_real_shortcode) {
                $wrapper_shortcode = '[v0map_agent_dashboard agent_no="' . $agent_no . '"]';
                $tabs[] = [
                    'title' => $title . ' Dashboard',
                    'tag' => 'v0map_agent_dashboard',
                    'shortcode' => $wrapper_shortcode,
                    'source' => 'v0map-wrapper',
                    'primaryLink' => esc_url_raw($primary_link),
                    'liveUrl' => add_query_arg(['v0map_shortcode_tag' => 'v0map_agent_dashboard', 'v0map_shortcode' => $wrapper_shortcode, 'v0map_embed' => '1', 'v0map_full_assets' => '1'], home_url('/v0map-npc-gallery/')),
                ];
            }

            $primary_shortcode = $tabs[0]['shortcode'] ?? '';
            $primary_tag = $tabs[0]['tag'] ?? '';
            $windows[] = [
                'id' => 'npc-window-' . $agent_no,
                'title' => $title,
                'team' => $team,
                'shortcode' => $primary_shortcode,
                'tag' => $primary_tag,
                'tabs' => $tabs,
                'primaryLink' => $primary_link,
                'agentNo' => $agent_no,
                'category' => $team,
                'windowType' => $has_real_shortcode && !empty($primary_link) ? 'hybrid' : ($has_real_shortcode ? 'shortcode' : 'link-wrapper'),
                'shortcodeSource' => $has_real_shortcode ? 'provided' : 'v0map-wrapper',
                'isWrapper' => !$has_real_shortcode,
            ];
        }

        return $windows;
    }

    private function render_npc_window_card(array $window, int $index = 0): string {
        $title = sanitize_text_field($window['title'] ?? __('NPC Window', 'v0map-npc-gallery'));
        $team = sanitize_text_field($window['team'] ?? __('General', 'v0map-npc-gallery'));
        $shortcode = trim((string) ($window['shortcode'] ?? ''));
        $tag = $this->extract_shortcode_tag($shortcode);
        $registered = $tag !== '' && shortcode_exists($tag);
        $rendered = $this->safe_do_shortcode($shortcode);
        $content = $shortcode !== '' ? $rendered['html'] : '<p>' . esc_html__('No shortcode configured for this NPC window.', 'v0map-npc-gallery') . '</p>';

        ob_start();
        ?>
        <article
            class="v0map-npc-window <?php echo $registered ? 'is-registered' : 'is-missing'; ?>"
            data-v0map-npc-window
            data-v0map-window-index="<?php echo esc_attr((string) $index); ?>"
            data-v0map-shortcode-tag="<?php echo esc_attr($tag); ?>"
            data-v0map-shortcode-registered="<?php echo $registered ? '1' : '0'; ?>"
        >
            <header class="v0map-npc-window__header">
                <div class="v0map-npc-window__avatar" aria-hidden="true"><?php echo esc_html(strtoupper(substr($title, 0, 1))); ?></div>
                <div class="v0map-npc-window__meta">
                    <h3 class="v0map-npc-window__title"><?php echo esc_html($title); ?></h3>
                    <p class="v0map-npc-window__team">
                        <?php echo esc_html($team); ?>
                        <?php if ($tag !== '') : ?>
                            <span class="v0map-npc-window__tag">[<?php echo esc_html($tag); ?>]</span>
                        <?php endif; ?>
                    </p>
                </div>
                <div class="v0map-npc-window__actions">
                    <span class="v0map-npc-window__badge"><?php echo $registered ? esc_html__('Live', 'v0map-npc-gallery') : esc_html__('Missing', 'v0map-npc-gallery'); ?></span>
                    <button class="v0map-npc-window__toggle" type="button" data-v0map-window-toggle>
                        <?php esc_html_e('Minimize', 'v0map-npc-gallery'); ?>
                    </button>
                </div>
            </header>
            <div class="v0map-npc-window__body">
                <?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
            </div>
        </article>
        <?php
        return (string) ob_get_clean();
    }

    public function render_agent_dashboard_shortcode(array $atts = []): string {
        $atts = shortcode_atts(
            [
                'agent_no' => '0',
                'url' => '',
                'title' => '',
                'height' => '760',
            ],
            $atts,
            'v0map_agent_dashboard'
        );

        $agent_no = absint($atts['agent_no']);
        $url = esc_url_raw((string) $atts['url']);
        $title = sanitize_text_field((string) $atts['title']);
        $agent = null;

        foreach ($this->parse_npc_windows() as $window) {
            if ((int) ($window['agentNo'] ?? 0) === $agent_no) {
                $agent = $window;
                break;
            }
        }

        if ($agent) {
            $url = $url ?: esc_url_raw((string) ($agent['primaryLink'] ?? ''));
            $title = $title ?: sanitize_text_field((string) ($agent['title'] ?? __('Agent Dashboard', 'v0map-npc-gallery')));
        }

        $height = max(420, min(1800, absint($atts['height'])));
        $host = $url ? wp_parse_url($url, PHP_URL_HOST) : '';
        $same_site = !$host || $host === wp_parse_url(home_url(), PHP_URL_HOST);

        ob_start();
        ?>
        <section class="v0map-agent-dashboard-shortcode" data-v0map-agent-dashboard-shortcode data-agent-no="<?php echo esc_attr((string) $agent_no); ?>">
            <header class="v0map-agent-dashboard-shortcode__header">
                <div>
                    <strong><?php echo esc_html($title ?: __('Agent Dashboard', 'v0map-npc-gallery')); ?></strong>
                    <span><?php esc_html_e('V0Map frontend dashboard wrapper', 'v0map-npc-gallery'); ?></span>
                </div>
                <?php if ($url) : ?>
                    <a class="v0map-agent-dashboard-shortcode__open" href="<?php echo esc_url($url); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Open full dashboard', 'v0map-npc-gallery'); ?></a>
                <?php endif; ?>
            </header>
            <?php if ($url) : ?>
                <iframe
                    class="v0map-agent-dashboard-shortcode__frame"
                    title="<?php echo esc_attr($title ?: __('Agent Dashboard', 'v0map-npc-gallery')); ?>"
                    src="<?php echo esc_url($url); ?>"
                    loading="lazy"
                    style="width:100%;height:<?php echo esc_attr((string) $height); ?>px;border:0;background:#fff;border-radius:18px;"
                    sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
                    allow="clipboard-read; clipboard-write; fullscreen; payment; autoplay; microphone"
                    allowfullscreen
                ></iframe>
                <?php if (!$same_site) : ?>
                    <p class="v0map-agent-dashboard-shortcode__note"><?php esc_html_e('External dashboard opened through a safe iframe wrapper. Use Open full dashboard if the remote site blocks iframe display.', 'v0map-npc-gallery'); ?></p>
                <?php endif; ?>
            <?php else : ?>
                <div class="v0map-agent-dashboard-shortcode__empty">
                    <?php esc_html_e('No working shortcode or dashboard link is configured for this agent yet.', 'v0map-npc-gallery'); ?>
                </div>
            <?php endif; ?>
        </section>
        <?php
        return (string) ob_get_clean();
    }

    public function render_gallery_shortcode(array $atts = []): string {
        $options = $this->options();
        $atts = shortcode_atts(
            [
                'url' => $options['app_url'],
                'height' => $options['iframe_height'],
                'title' => $options['title'],
                'description' => $options['description'],
                'toolbar' => $options['show_toolbar'],
                'open_button' => $options['open_new_tab'],
            ],
            $atts,
            'v0map_gallery'
        );

        $url = esc_url($this->build_app_url((string) $atts['url']));
        $height = max(320, min(1600, absint($atts['height'])));
        $title = sanitize_text_field($atts['title']);
        $description = sanitize_textarea_field($atts['description']);
        $show_toolbar = $atts['toolbar'] !== '0';
        $show_open_button = $atts['open_button'] !== '0';
        $allow = $options['allow_fullscreen'] === '1' ? ' allowfullscreen' : '';
        $auth_payload = $this->bridge_auth_payload();

        wp_enqueue_style('v0map-npc-gallery');
        wp_enqueue_script('v0map-npc-gallery');

        ob_start();
        ?>
        <section
            class="v0map-npc-gallery"
            data-v0map-gallery
            data-v0map-persist="<?php echo esc_attr($options['persist_local_session']); ?>"
            data-v0map-app-url="<?php echo esc_url($url); ?>"
            data-v0map-world-url="<?php echo esc_url($this->build_app_url((string) $options['localhost_world_url'])); ?>"
            data-v0map-domain="<?php echo esc_attr((string) $options['default_domain']); ?>"
            data-v0map-auth-sync="<?php echo esc_attr((string) $options['auth_sync']); ?>"
            data-v0map-npc-sync="<?php echo esc_attr((string) $options['npc_sync']); ?>"
            data-v0map-user="<?php echo esc_attr((string) get_current_user_id()); ?>"
            data-v0map-rest-base="<?php echo esc_url($auth_payload['restBase']); ?>"
            data-v0map-windows-url="<?php echo esc_url($auth_payload['windowsUrl']); ?>"
            data-v0map-bridge-token="<?php echo esc_attr($auth_payload['token']); ?>"
            data-v0map-bridge-expires="<?php echo esc_attr((string) $auth_payload['expires']); ?>"
            data-v0map-rest-nonce="<?php echo esc_attr($auth_payload['nonce']); ?>"
        >
            <?php if ($show_toolbar) : ?>
                <div class="v0map-npc-gallery__toolbar">
                    <div>
                        <h2 class="v0map-npc-gallery__title"><?php echo esc_html($title); ?></h2>
                        <?php if ($description !== '') : ?>
                            <p class="v0map-npc-gallery__description"><?php echo esc_html($description); ?></p>
                        <?php endif; ?>
                    </div>
                    <div class="v0map-npc-gallery__actions">
                        <?php if ($show_open_button) : ?>
                            <a class="v0map-npc-gallery__button" href="<?php echo esc_url($url); ?>" target="_blank" rel="noopener noreferrer">
                                <?php esc_html_e('Open Full App', 'v0map-npc-gallery'); ?>
                            </a>
                        <?php endif; ?>
                        <button class="v0map-npc-gallery__button" type="button" data-v0map-refresh>
                            <?php esc_html_e('Refresh', 'v0map-npc-gallery'); ?>
                        </button>
                    </div>
                </div>
            <?php endif; ?>
            <div class="v0map-npc-gallery__frameWrap" style="--v0map-frame-height: <?php echo esc_attr((string) $height); ?>px;">
                <iframe
                    class="v0map-npc-gallery__frame"
                    src="<?php echo esc_url($url); ?>"
                    title="<?php echo esc_attr($title); ?>"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    <?php echo $allow; ?>
                ></iframe>
            </div>
            <?php echo $this->render_connection_panel('gallery'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
        </section>
        <?php
        return (string) ob_get_clean();
    }

    public function render_launcher_shortcode(array $atts = []): string {
        $options = $this->options();
        $atts = shortcode_atts(
            [
                'url' => $options['app_url'],
                'label' => __('Launch V0Map NPC Gallery', 'v0map-npc-gallery'),
            ],
            $atts,
            'v0map_npc_launcher'
        );

        wp_enqueue_style('v0map-npc-gallery');

        return sprintf(
            '<a class="v0map-npc-gallery__launcher" href="%1$s" target="_blank" rel="noopener noreferrer">%2$s</a>',
            esc_url($atts['url']),
            esc_html($atts['label'])
        );
    }

    public function render_npc_window_shortcode(array $atts = [], ?string $content = null): string {
        $atts = shortcode_atts(
            [
                'title' => __('NPC Window', 'v0map-npc-gallery'),
                'team' => __('WordPress', 'v0map-npc-gallery'),
                'shortcode' => '',
            ],
            $atts,
            'v0map_npc_window'
        );

        wp_enqueue_style('v0map-npc-gallery');
        wp_enqueue_script('v0map-npc-gallery');

        $shortcode = (string) $atts['shortcode'];
        if ($shortcode === '' && $content !== null) {
            $shortcode = $content;
        }

        return $this->render_npc_window_card(
            [
                'title' => $atts['title'],
                'team' => $atts['team'],
                'shortcode' => $shortcode,
            ],
            0
        );
    }

    public function render_npc_windows_shortcode(array $atts = []): string {
        $options = $this->options();
        $atts = shortcode_atts(
            [
                'title' => $options['npc_windows_title'],
                'source' => 'settings',
            ],
            $atts,
            'v0map_npc_windows'
        );

        wp_enqueue_style('v0map-npc-gallery');
        wp_enqueue_script('v0map-npc-gallery');

        $windows = $this->parse_npc_windows();
        $title = sanitize_text_field($atts['title']);

        ob_start();
        ?>
        <section class="v0map-npc-dashboard" data-v0map-npc-dashboard>
            <header class="v0map-npc-dashboard__header">
                <div>
                    <h2 class="v0map-npc-dashboard__title"><?php echo esc_html($title); ?></h2>
                    <p class="v0map-npc-dashboard__description"><?php esc_html_e('Every configured WordPress shortcode rendered as a synced NPC window.', 'v0map-npc-gallery'); ?></p>
                </div>
                <button class="v0map-npc-gallery__button" type="button" data-v0map-expand-windows>
                    <?php esc_html_e('Expand All', 'v0map-npc-gallery'); ?>
                </button>
            </header>
            <?php echo $this->render_connection_panel('npc-windows'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
            <div class="v0map-npc-dashboard__grid">
                <?php
                foreach ($windows as $index => $window) {
                    echo $this->render_npc_window_card($window, $index); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                }
                ?>
            </div>
        </section>
        <?php
        return (string) ob_get_clean();
    }

    public function render_shortcode_dashboard_shortcode(array $atts = []): string {
        global $shortcode_tags;

        $atts = shortcode_atts(
            [
                'limit' => '40',
                'render' => '0',
            ],
            $atts,
            'v0map_shortcode_dashboard'
        );

        wp_enqueue_style('v0map-npc-gallery');

        $limit = max(1, min(120, absint($atts['limit'])));
        $render = $atts['render'] === '1';
        $configured_tags = array_values(array_filter(array_map(
            fn (array $window): string => $this->extract_shortcode_tag((string) ($window['shortcode'] ?? '')),
            $this->parse_npc_windows()
        )));
        $shortcodes = array_values(array_unique($configured_tags));
        $shortcodes = array_slice($shortcodes, 0, $limit);

        ob_start();
        ?>
        <section class="v0map-shortcode-dashboard">
            <header class="v0map-shortcode-dashboard__header">
                <h2><?php esc_html_e('WordPress Shortcode Dashboard', 'v0map-npc-gallery'); ?></h2>
                <p><?php esc_html_e('Detected shortcodes that can be copied into NPC windows.', 'v0map-npc-gallery'); ?></p>
            </header>
            <div class="v0map-shortcode-dashboard__list">
                <?php foreach ($shortcodes as $tag) : ?>
                    <?php $registered = shortcode_exists($tag); ?>
                    <div class="v0map-shortcode-dashboard__item <?php echo $registered ? 'is-registered' : 'is-missing'; ?>">
                        <code>[<?php echo esc_html($tag); ?>]</code>
                        <span><?php echo $registered ? esc_html__('registered', 'v0map-npc-gallery') : esc_html__('missing', 'v0map-npc-gallery'); ?></span>
                        <?php if ($render) : ?>
                            <div class="v0map-shortcode-dashboard__preview">
                                <?php
                                $preview = $this->safe_do_shortcode('[' . $tag . ']');
                                echo $preview['html']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                                ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>
        <?php
        return (string) ob_get_clean();
    }

    public function render_live_dashboard_shortcode(array $atts = []): string {
        $options = $this->options();
        $atts = shortcode_atts(
            [
                'title' => $options['connection_title'],
                'show_windows' => '1',
            ],
            $atts,
            'v0map_npc_live_dashboard'
        );

        wp_enqueue_style('v0map-npc-gallery');
        wp_enqueue_script('v0map-npc-gallery');

        $metrics = $this->connection_metrics();

        ob_start();
        ?>
        <section class="v0map-live-dashboard">
            <header class="v0map-live-dashboard__header">
                <h2><?php echo esc_html((string) $atts['title']); ?></h2>
                <p><?php esc_html_e('Live WordPress-to-localhost bridge metrics for NPC shortcode windows, auth sync, and the 3D world connection.', 'v0map-npc-gallery'); ?></p>
            </header>
            <?php echo $this->render_connection_panel('live-dashboard'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
            <div class="v0map-live-dashboard__summary">
                <div><strong><?php echo esc_html((string) $metrics['registered']); ?></strong><span><?php esc_html_e('WordPress shortcodes detected', 'v0map-npc-gallery'); ?></span></div>
                <div><strong><?php echo esc_html((string) $metrics['windows']); ?></strong><span><?php esc_html_e('NPC shortcode windows configured', 'v0map-npc-gallery'); ?></span></div>
                <div><strong><?php echo esc_html((string) get_current_user_id()); ?></strong><span><?php esc_html_e('synced WordPress user id', 'v0map-npc-gallery'); ?></span></div>
                <div><strong><?php echo esc_html((string) $options['default_domain']); ?></strong><span><?php esc_html_e('default domain', 'v0map-npc-gallery'); ?></span></div>
            </div>
            <?php if ($atts['show_windows'] !== '0') : ?>
                <div class="v0map-live-dashboard__windows">
                    <?php
                    foreach ($this->parse_npc_windows() as $index => $window) {
                        $tag = $this->extract_shortcode_tag((string) ($window['shortcode'] ?? ''));
                        $registered = shortcode_exists($tag);
                        echo '<div class="v0map-live-dashboard__row">';
                        echo '<strong>' . esc_html((string) ($window['title'] ?? 'NPC Window')) . '</strong>';
                        echo '<code>[' . esc_html($tag) . ']</code>';
                        echo '<span class="' . ($registered ? 'is-live' : 'is-missing') . '">' . ($registered ? esc_html__('registered', 'v0map-npc-gallery') : esc_html__('missing', 'v0map-npc-gallery')) . '</span>';
                        echo '</div>';
                    }
                    ?>
                </div>
            <?php endif; ?>
        </section>
        <?php
        return (string) ob_get_clean();
    }

    public function render_api_dashboard_shortcode(array $atts = []): string {
        $options = $this->options();
        $auth = $this->bridge_auth_payload();
        $pages = $this->rest_page_payload();

        wp_enqueue_style('v0map-npc-gallery');
        wp_enqueue_script('v0map-npc-gallery');

        ob_start();
        ?>
        <section class="v0map-api-dashboard">
            <header class="v0map-live-dashboard__header">
                <h2><?php esc_html_e('NPC API Auth Dashboard', 'v0map-npc-gallery'); ?></h2>
                <p><?php esc_html_e('Authenticated REST connection details for WordPress shortcode NPCs and the localhost 3D world.', 'v0map-npc-gallery'); ?></p>
            </header>
            <?php echo $this->render_connection_panel('api-dashboard'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
            <div class="v0map-api-dashboard__grid">
                <div>
                    <h3><?php esc_html_e('API Endpoints', 'v0map-npc-gallery'); ?></h3>
                    <p><strong><?php esc_html_e('REST Base', 'v0map-npc-gallery'); ?></strong><br><code><?php echo esc_html($auth['restBase']); ?></code></p>
                    <p><strong><?php esc_html_e('Windows', 'v0map-npc-gallery'); ?></strong><br><code><?php echo esc_html($auth['windowsUrl']); ?></code></p>
                    <p><strong><?php esc_html_e('Render', 'v0map-npc-gallery'); ?></strong><br><code><?php echo esc_html($auth['renderUrl']); ?></code></p>
                </div>
                <div>
                    <h3><?php esc_html_e('Auth Sync', 'v0map-npc-gallery'); ?></h3>
                    <p><strong><?php esc_html_e('User ID', 'v0map-npc-gallery'); ?></strong><br><code><?php echo esc_html((string) $auth['user']); ?></code></p>
                    <p><strong><?php esc_html_e('Expires', 'v0map-npc-gallery'); ?></strong><br><code><?php echo esc_html(gmdate('c', (int) $auth['expires'])); ?></code></p>
                    <p><strong><?php esc_html_e('Token', 'v0map-npc-gallery'); ?></strong><br><code><?php echo esc_html(substr((string) $auth['token'], 0, 14)); ?>...</code></p>
                    <p><strong><?php esc_html_e('API Auth Required', 'v0map-npc-gallery'); ?></strong><br><code><?php echo $options['api_auth_required'] === '1' ? esc_html__('yes', 'v0map-npc-gallery') : esc_html__('no', 'v0map-npc-gallery'); ?></code></p>
                </div>
                <div>
                    <h3><?php esc_html_e('Dashboard Pages', 'v0map-npc-gallery'); ?></h3>
                    <ul class="v0map-api-dashboard__pages">
                        <?php foreach ($pages as $page) : ?>
                            <li>
                                <strong><?php echo esc_html((string) $page['title']); ?></strong>
                                <?php if (!empty($page['url'])) : ?>
                                    <a href="<?php echo esc_url((string) $page['url']); ?>"><?php esc_html_e('Open', 'v0map-npc-gallery'); ?></a>
                                <?php else : ?>
                                    <span><?php esc_html_e('Not created', 'v0map-npc-gallery'); ?></span>
                                <?php endif; ?>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            </div>
        </section>
        <?php
        return (string) ob_get_clean();
    }

    public function render_admin_page(): void {
        if (!current_user_can('manage_options')) {
            return;
        }

        $options = $this->options();
        if ($options['auto_create_pages'] === '1') {
            self::create_dashboard_pages();
        }
        $pages = $this->rest_page_payload();
        ?>
        <div class="wrap v0map-npc-gallery-admin">
            <h1><?php esc_html_e('V0Map NPC Gallery', 'v0map-npc-gallery'); ?></h1>
            <p><?php esc_html_e('Embed the upgraded NPC gallery app, expose WordPress shortcodes as NPC windows, and sync auth context to the localhost 3D world.', 'v0map-npc-gallery'); ?></p>

            <?php echo $this->render_connection_panel('admin'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>

            <div style="display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:24px;align-items:start;">
                <form method="post" action="options.php" style="background:#fff;border:1px solid #dcdcde;padding:20px;">
                    <?php
                    settings_fields('v0map_npc_gallery_settings');
                    do_settings_sections('v0map-npc-gallery');
                    submit_button();
                    ?>
                </form>

                <aside style="background:#fff;border:1px solid #dcdcde;padding:20px;">
                    <h2><?php esc_html_e('Shortcodes', 'v0map-npc-gallery'); ?></h2>
                    <p><strong><?php esc_html_e('Full embed:', 'v0map-npc-gallery'); ?></strong></p>
                    <code>[v0map_gallery]</code>

                    <p><strong><?php esc_html_e('Custom height:', 'v0map-npc-gallery'); ?></strong></p>
                    <code>[v0map_gallery height="900"]</code>

                    <p><strong><?php esc_html_e('Launcher button:', 'v0map-npc-gallery'); ?></strong></p>
                    <code>[v0map_npc_launcher]</code>

                    <p><strong><?php esc_html_e('NPC windows dashboard:', 'v0map-npc-gallery'); ?></strong></p>
                    <code>[v0map_npc_windows]</code>

                    <p><strong><?php esc_html_e('Single NPC shortcode window:', 'v0map-npc-gallery'); ?></strong></p>
                    <code>[v0map_npc_window title="Agent Window" team="WP" shortcode="[your_shortcode]"]</code>

                    <p><strong><?php esc_html_e('Shortcode discovery dashboard:', 'v0map-npc-gallery'); ?></strong></p>
                    <code>[v0map_shortcode_dashboard]</code>

                    <p><strong><?php esc_html_e('Live NPC connection dashboard:', 'v0map-npc-gallery'); ?></strong></p>
                    <code>[v0map_npc_live_dashboard]</code>

                    <p><strong><?php esc_html_e('API auth dashboard:', 'v0map-npc-gallery'); ?></strong></p>
                    <code>[v0map_npc_api_dashboard]</code>

                    <h2><?php esc_html_e('Current App URL', 'v0map-npc-gallery'); ?></h2>
                    <p><a href="<?php echo esc_url($options['app_url']); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html($options['app_url']); ?></a></p>

                    <h2><?php esc_html_e('Localhost World URL', 'v0map-npc-gallery'); ?></h2>
                    <p><a href="<?php echo esc_url($options['localhost_world_url']); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html($options['localhost_world_url']); ?></a></p>

                    <h2><?php esc_html_e('Recommended Workflow', 'v0map-npc-gallery'); ?></h2>
                    <ol>
                        <li><?php esc_html_e('Use https://entremotivator.com as the public domain target.', 'v0map-npc-gallery'); ?></li>
                        <li><?php esc_html_e('Run the 3D world locally at http://localhost:3000 during development.', 'v0map-npc-gallery'); ?></li>
                        <li><?php esc_html_e('Place [v0map_npc_windows] or [v0map_npc_live_dashboard] on a WordPress page.', 'v0map-npc-gallery'); ?></li>
                        <li><?php esc_html_e('Use the live panel to confirm auth sync, NPC windows, and shortcode handler status.', 'v0map-npc-gallery'); ?></li>
                    </ol>

                    <h2><?php esc_html_e('Auto-created Pages', 'v0map-npc-gallery'); ?></h2>
                    <ul>
                        <?php foreach ($pages as $page) : ?>
                            <li>
                                <?php echo esc_html((string) $page['title']); ?>:
                                <?php if (!empty($page['url'])) : ?>
                                    <a href="<?php echo esc_url((string) $page['url']); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('Open', 'v0map-npc-gallery'); ?></a>
                                <?php else : ?>
                                    <?php esc_html_e('not created', 'v0map-npc-gallery'); ?>
                                <?php endif; ?>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </aside>
            </div>

            <div style="margin-top:24px;background:#fff;border:1px solid #dcdcde;padding:20px;">
                <h2><?php esc_html_e('Detected WordPress Shortcodes', 'v0map-npc-gallery'); ?></h2>
                <p><?php esc_html_e('Use these tags in the NPC Window Shortcodes field above. Format: Title|Team|[shortcode]', 'v0map-npc-gallery'); ?></p>
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
                    <?php
                    global $shortcode_tags;
                    $configured_tags = array_values(array_filter(array_map(
                        fn (array $window): string => $this->extract_shortcode_tag((string) ($window['shortcode'] ?? '')),
                        $this->parse_npc_windows()
                    )));
                    $admin_tags = array_slice(array_values(array_unique($configured_tags)), 0, 120);
                    foreach ($admin_tags as $tag) {
                        $status = shortcode_exists($tag) ? 'live' : 'missing';
                        echo '<code title="' . esc_attr($status) . '">[' . esc_html($tag) . '] ' . esc_html($status) . '</code>';
                    }
                    ?>
                </div>

                <h2><?php esc_html_e('NPC Team Import Notes', 'v0map-npc-gallery'); ?></h2>
                <p><?php esc_html_e('The upgraded app includes JSON samples for importing teams. Upload them from the NPC Controls panel inside the app.', 'v0map-npc-gallery'); ?></p>
                <ul>
                    <li><code>public/npc-teams.sample.json</code></li>
                    <li><code>public/npc-teams.extended.sample.json</code></li>
                    <li><code>UPGRADED_APP_MANUAL.md</code></li>
                </ul>
            </div>
        </div>
        <?php
    }
}

register_activation_hook(__FILE__, ['V0Map_NPC_Gallery_Plugin', 'activate']);
register_uninstall_hook(__FILE__, ['V0Map_NPC_Gallery_Plugin', 'uninstall']);

V0Map_NPC_Gallery_Plugin::instance();
