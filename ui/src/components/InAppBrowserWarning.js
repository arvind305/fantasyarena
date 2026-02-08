/**
 * InAppBrowserWarning.js
 *
 * Detects in-app browsers (Facebook, Instagram, WhatsApp, etc.)
 * and prompts users to open in their default browser for best experience.
 */

import React, { useState, useEffect } from 'react';

function detectInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  // Common in-app browser signatures
  const inAppPatterns = [
    'FBAN',           // Facebook App
    'FBAV',           // Facebook App
    'Instagram',      // Instagram
    'Twitter',        // Twitter/X
    'Line/',          // Line
    'KAKAOTALK',      // KakaoTalk
    'WhatsApp',       // WhatsApp (rare, usually opens external)
    'Snapchat',       // Snapchat
    'Pinterest',      // Pinterest
    'LinkedIn',       // LinkedIn
    'MicroMessenger', // WeChat
    'WebView',        // Generic Android WebView
    'wv)',            // Android WebView
  ];

  for (const pattern of inAppPatterns) {
    if (ua.includes(pattern)) {
      return true;
    }
  }

  // iOS WebView detection (UIWebView or WKWebView without Safari)
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua);
  const isChrome = /CriOS/.test(ua);
  const isFirefox = /FxiOS/.test(ua);

  if (isIOS && !isSafari && !isChrome && !isFirefox) {
    return true;
  }

  return false;
}

function getOpenInBrowserUrl() {
  const url = window.location.href;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  if (isIOS) {
    // iOS: Use x-safari-https scheme or just provide URL to copy
    return url;
  } else {
    // Android: intent:// scheme can work for Chrome
    return `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
  }
}

export default function InAppBrowserWarning() {
  const [isInApp, setIsInApp] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsInApp(detectInAppBrowser());
    // Check if user already dismissed
    const wasDismissed = sessionStorage.getItem('inapp_warning_dismissed');
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('inapp_warning_dismissed', 'true');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isInApp || dismissed) return null;

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl mb-3">🌐</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Open in {isIOS ? 'Safari' : 'Chrome'}
          </h2>
          <p className="text-gray-600 mb-4">
            For the best experience and to keep your bets saved, please open this site in your {isIOS ? 'Safari' : 'Chrome'} browser.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
            <strong>Why?</strong> In-app browsers don't save your data properly. Your previous bets may not appear here.
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCopyLink}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              {copied ? '✓ Link Copied!' : 'Copy Link to Open in Browser'}
            </button>

            <p className="text-xs text-gray-500">
              {isIOS
                ? 'Tap the ••• menu above and select "Open in Safari"'
                : 'Tap the ⋮ menu and select "Open in Chrome"'}
            </p>

            <button
              onClick={handleDismiss}
              className="w-full text-gray-500 py-2 text-sm hover:text-gray-700"
            >
              Continue anyway (not recommended)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
