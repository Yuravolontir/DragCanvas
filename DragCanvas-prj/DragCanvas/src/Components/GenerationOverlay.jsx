import { stageLabel, stageProgress } from '../utils/generationProgress.js';

/**
 * The full-screen wait shown while the AI builds a site.
 *
 * It says which step is running and how far along it is, because a spinner
 * turning for fifty seconds looks exactly like a frozen one.
 *
 * @param {object|null} stage  the current step, as useAiSiteGenerator sets it
 * @param {number} elapsed     milliseconds since the run started
 */
export default function GenerationOverlay({ stage, elapsed }) {
  const label = stageLabel(stage);
  const progress = stageProgress(stage, elapsed);
  const stepSuffix = progress.step ? ` · ${progress.step}` : '';

  return (
    <div
      className="ai-generation-backdrop"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="ai-generation-modal">
        <div className="ai-generation-spinner" aria-hidden="true" />

        <strong>{label}</strong>

        <div
          className="ai-generation-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
        >
          <div
            className="ai-generation-progress-fill"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <span className="ai-generation-step">
          {progress.percent}%{stepSuffix}
        </span>

        <span>AI is building your site. This can take a little while.</span>
      </div>
    </div>
  );
}
