// @ts-expect-error The legacy application lives in the sibling workspace and is mounted here for same-port navigation.
import LegacyAccountOpeningApp from '../../../../src/App.jsx';
import '../../../../src/styles.css';

export function LegacyAccountOpeningPage() {
  return <LegacyAccountOpeningApp />;
}
