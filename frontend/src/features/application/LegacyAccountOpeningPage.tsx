import { useLayoutEffect } from 'react';

// @ts-expect-error The legacy application lives in the sibling workspace and is mounted here for same-port navigation.
import LegacyAccountOpeningApp from '../../../../src/App.jsx';
import '../../../../src/styles.css';

function applyLegacyLightTheme() {
  const html = document.documentElement;
  const body = document.body;
  const shell = document.querySelector<HTMLElement>('.application-shell');

  body.classList.add('legacy-application-route', 'customer-account-route');
  body.classList.remove('kyc-fabric-route', 'admin-route');

  html.classList.remove('dark');
  html.classList.add('light');
  html.dataset.theme = 'light';
  html.style.background = '#f7fbff';

  body.style.background = '#f7fbff';
  body.style.color = '#091a44';
  body.style.colorScheme = 'light';

  shell?.classList.remove('kyc-fabric-shell', 'admin-shell');
  shell?.classList.add('customer-account-shell', 'corporate-light-shell', 'legacy-light-shell');
}

export function LegacyAccountOpeningPage() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousTheme = html.dataset.theme;
    const hadDarkClass = html.classList.contains('dark');
    const hadLightClass = html.classList.contains('light');
    const previousHtmlBackground = html.style.background;
    const previousBodyBackground = body.style.background;
    const previousBodyColor = body.style.color;
    const previousBodyColorScheme = body.style.colorScheme;

    applyLegacyLightTheme();

    const observerTarget = document.getElementById('root');
    const observer = observerTarget
      ? new MutationObserver(() => applyLegacyLightTheme())
      : null;
    observer?.observe(observerTarget, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true,
    });
    const animationFrameId = window.requestAnimationFrame(applyLegacyLightTheme);

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(animationFrameId);

      body.classList.remove('legacy-application-route', 'customer-account-route');
      body.style.background = previousBodyBackground;
      body.style.color = previousBodyColor;
      body.style.colorScheme = previousBodyColorScheme;
      html.style.background = previousHtmlBackground;
      html.classList.remove('dark', 'light');

      if (hadDarkClass) {
        html.classList.add('dark');
      }

      if (hadLightClass) {
        html.classList.add('light');
      }

      if (previousTheme) {
        html.dataset.theme = previousTheme;
      } else {
        delete html.dataset.theme;
      }
    };
  }, []);

  return <LegacyAccountOpeningApp forceStandaloneShell />;
}
