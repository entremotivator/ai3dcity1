# V27 No-Fake-Shortcodes + Realistic NPC Movement

- Removed generated fake shortcode tags like `[agent_2_ecom_hub]`.
- Agents without a provided or registered historical shortcode now use the real plugin wrapper shortcode `[v0map_agent_dashboard agent_no="ID"]`.
- The WordPress plugin registers `[v0map_agent_dashboard]` and renders the agent Primary Link as a frontend dashboard iframe/card.
- The plugin only appends history shortcodes when `shortcode_exists()` confirms they are registered on the live WordPress site.
- Realtime Voice Agent minimized state moves to the top-right and uses pointer-event passthrough so it no longer blocks movement controls.
- NPC summons now walk through Yuka-style waypoints instead of teleporting.
- Window labels show `V0Map dashboard wrapper` or the real shortcode tag; fake generated tags are not displayed.
