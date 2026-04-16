import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePlatformStore } from '@/store';

const speeds = [1, 2, 4];

function formatSyncTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function DemoControlBar() {
  const dataSource = usePlatformStore((state) => state.dataSource);
  const autoplay = usePlatformStore((state) => state.autoplay);
  const mode = usePlatformStore((state) => state.mode);
  const currentStep = usePlatformStore((state) => state.currentStep);
  const timelineLength = usePlatformStore((state) => state.timeline.length);
  const speedMultiplier = usePlatformStore((state) => state.speedMultiplier);
  const hydrationStatus = usePlatformStore((state) => state.hydrationStatus);
  const loadError = usePlatformStore((state) => state.loadError);
  const lastSyncAt = usePlatformStore((state) => state.lastSyncAt);
  const setDemoMode = usePlatformStore((state) => state.setDemoMode);
  const toggleAutoplay = usePlatformStore((state) => state.toggleAutoplay);
  const stepTimeline = usePlatformStore((state) => state.stepTimeline);
  const resetTimeline = usePlatformStore((state) => state.resetTimeline);
  const setSpeedMultiplier = usePlatformStore((state) => state.setSpeedMultiplier);
  const refreshPlatform = usePlatformStore((state) => state.refreshPlatform);
  const setDataSource = usePlatformStore((state) => state.setDataSource);
  const liveMode = dataSource === 'live';
  const lastSyncLabel = formatSyncTime(lastSyncAt);

  return (
    <div className="border-b border-[var(--border)] px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-3 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 shadow-[var(--shadow-soft)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={liveMode ? 'info' : 'default'}>
            {liveMode ? 'Live data' : 'Demo engine'}
          </Badge>
          {liveMode ? (
            <Button
              variant={hydrationStatus === 'loading' ? 'primary' : 'secondary'}
              onClick={() => void refreshPlatform()}
              className="min-w-[124px]"
              disabled={hydrationStatus === 'loading'}
            >
              {hydrationStatus === 'loading' ? 'Syncing…' : 'Refresh live'}
            </Button>
          ) : (
            <>
              <Button
                variant={autoplay ? 'primary' : 'secondary'}
                onClick={toggleAutoplay}
                className="min-w-[124px]"
              >
                {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {autoplay ? 'Pause autoplay' : 'Start autoplay'}
              </Button>
              <Button variant="secondary" onClick={stepTimeline}>
                <SkipForward className="h-4 w-4" />
                Step
              </Button>
              <Button variant="ghost" onClick={resetTimeline}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-[var(--border)] p-1">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm ${dataSource === 'demo' ? 'bg-[var(--surface-accent)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}
              onClick={() => setDataSource('demo')}
            >
              Demo
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm ${dataSource === 'live' ? 'bg-[var(--surface-info)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}
              onClick={() => setDataSource('live')}
            >
              Live
            </button>
          </div>
          {!liveMode && (
            <>
              <div className="inline-flex rounded-full border border-[var(--border)] p-1">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm ${mode === 'autoplay' ? 'bg-[var(--surface-accent)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}
                  onClick={() => setDemoMode('autoplay')}
                >
                  Autoplay
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm ${mode === 'interactive' ? 'bg-[var(--surface-info)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}
                  onClick={() => setDemoMode('interactive')}
                >
                  Interactive
                </button>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] p-1">
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-sm ${speedMultiplier === speed ? 'bg-[var(--surface-accent)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}
                    onClick={() => setSpeedMultiplier(speed)}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="text-sm text-[var(--muted-foreground)]">
            {liveMode
              ? hydrationStatus === 'loading'
                ? 'Syncing live snapshot'
                : lastSyncLabel
                  ? `Last sync ${lastSyncLabel}`
                  : 'Live mode ready'
              : `Event ${currentStep} of ${timelineLength}`}
          </div>
        </div>
      </div>
      {loadError && (
        <div className="mx-auto mt-2 w-full max-w-[1700px] text-sm text-[var(--warning)]">
          {loadError}
        </div>
      )}
    </div>
  );
}
