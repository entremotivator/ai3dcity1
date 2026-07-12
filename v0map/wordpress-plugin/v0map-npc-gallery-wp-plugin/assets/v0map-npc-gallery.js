(function () {
  var STORAGE_KEY = 'v0mapNpcGallerySession';

  function persistSession(root) {
    if (!root || root.getAttribute('data-v0map-persist') !== '1') return;

    var payload = {
      appUrl: root.getAttribute('data-v0map-app-url') || '',
      worldUrl: root.getAttribute('data-v0map-world-url') || '',
      domain: root.getAttribute('data-v0map-domain') || '',
      restBase: root.getAttribute('data-v0map-rest-base') || '',
      windowsUrl: root.getAttribute('data-v0map-windows-url') || '',
      bridgeToken: root.getAttribute('data-v0map-bridge-token') || '',
      bridgeExpires: root.getAttribute('data-v0map-bridge-expires') || '',
      restNonce: root.getAttribute('data-v0map-rest-nonce') || '',
      authSync: root.getAttribute('data-v0map-auth-sync') === '1',
      npcSync: root.getAttribute('data-v0map-npc-sync') === '1',
      user: root.getAttribute('data-v0map-user') || '0',
      updatedAt: Date.now()
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {}
  }

  function refreshGallery(button) {
    var root = button.closest('[data-v0map-gallery]');
    if (!root) return;

    var frame = root.querySelector('.v0map-npc-gallery__frame');
    if (!frame) return;

    try {
      var url = new URL(frame.src);
      url.searchParams.set('v0map_refresh', Date.now().toString());
      frame.src = url.toString();
    } catch (error) {
      frame.src = frame.src;
    }
  }

  function setLiveStatus(panel, target, state, label) {
    var badge = panel.querySelector('[data-v0map-live-status="' + target + '"]');
    if (!badge) return;

    badge.classList.remove('is-checking', 'is-live', 'is-offline');
    badge.classList.add('is-' + state);
    badge.textContent = label;
  }

  function pingUrl(panel, target, url) {
    if (!url) {
      setLiveStatus(panel, target, 'offline', target === 'app' ? 'App URL missing' : 'Localhost missing');
      return;
    }

    setLiveStatus(panel, target, 'checking', target === 'app' ? 'Checking app' : 'Checking localhost');

    var controller = window.AbortController ? new AbortController() : null;
    var timeout = controller ? window.setTimeout(function () {
      controller.abort();
    }, 5000) : null;

    fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'include',
      signal: controller ? controller.signal : undefined
    }).then(function () {
      setLiveStatus(panel, target, 'live', target === 'app' ? 'App connected' : 'Localhost connected');
    }).catch(function () {
      setLiveStatus(panel, target, 'offline', target === 'app' ? 'App unavailable' : 'Localhost offline');
    }).finally(function () {
      if (timeout) window.clearTimeout(timeout);
    });
  }

  function syncFrame(root) {
    var frame = root.querySelector('.v0map-npc-gallery__frame');
    if (!frame || !frame.contentWindow) return;

    var payload = {
      type: 'v0map:wp-auth-sync',
      appUrl: root.getAttribute('data-v0map-app-url') || '',
      worldUrl: root.getAttribute('data-v0map-world-url') || '',
      domain: root.getAttribute('data-v0map-domain') || '',
      user: root.getAttribute('data-v0map-user') || '0',
      restBase: root.getAttribute('data-v0map-rest-base') || '',
      windowsUrl: root.getAttribute('data-v0map-windows-url') || '',
      bridgeToken: root.getAttribute('data-v0map-bridge-token') || '',
      bridgeExpires: root.getAttribute('data-v0map-bridge-expires') || '',
      restNonce: root.getAttribute('data-v0map-rest-nonce') || '',
      authSync: root.getAttribute('data-v0map-auth-sync') === '1',
      npcSync: root.getAttribute('data-v0map-npc-sync') === '1',
      updatedAt: Date.now()
    };

    try {
      frame.contentWindow.postMessage(payload, '*');
    } catch (error) {}
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-v0map-refresh]');
    if (button) {
      event.preventDefault();
      refreshGallery(button);
      return;
    }

    var toggle = event.target.closest('[data-v0map-window-toggle]');
    if (toggle) {
      event.preventDefault();
      var windowCard = toggle.closest('[data-v0map-npc-window]');
      if (!windowCard) return;
      windowCard.classList.toggle('is-minimized');
      toggle.textContent = windowCard.classList.contains('is-minimized') ? 'Expand' : 'Minimize';
      return;
    }

    var expand = event.target.closest('[data-v0map-expand-windows]');
    if (expand) {
      event.preventDefault();
      var dashboard = expand.closest('[data-v0map-npc-dashboard]');
      if (!dashboard) return;
      dashboard.querySelectorAll('[data-v0map-npc-window]').forEach(function (card) {
        card.classList.remove('is-minimized');
        var cardToggle = card.querySelector('[data-v0map-window-toggle]');
        if (cardToggle) cardToggle.textContent = 'Minimize';
      });
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-v0map-gallery]').forEach(function (root) {
      persistSession(root);
      var frame = root.querySelector('.v0map-npc-gallery__frame');
      if (frame) {
        frame.addEventListener('load', function () {
          syncFrame(root);
        });
      }
    });

    document.querySelectorAll('[data-v0map-live-panel]').forEach(function (panel) {
      var appUrl = panel.getAttribute('data-v0map-live-url') || '';
      var worldUrl = panel.getAttribute('data-v0map-world-url') || '';

      pingUrl(panel, 'app', appUrl);
      pingUrl(panel, 'world', worldUrl);

      window.setInterval(function () {
        pingUrl(panel, 'app', appUrl);
        pingUrl(panel, 'world', worldUrl);
      }, 30000);
    });
  });
})();
