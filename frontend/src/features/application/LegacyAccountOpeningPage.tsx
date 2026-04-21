import { useEffect } from 'react';

// @ts-expect-error The legacy application lives in the sibling workspace and is mounted here for same-port navigation.
import LegacyAccountOpeningApp from '../../../../src/App.jsx';
import '../../../../src/styles.css';

export function LegacyAccountOpeningPage() {
  useEffect(() => {
    document.body.classList.add('legacy-application-route');

    return () => {
      document.body.classList.remove('legacy-application-route');
    };
  }, []);

  return <LegacyAccountOpeningApp />;
}
