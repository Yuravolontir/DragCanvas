import { useEffect, useState } from 'react';

import AuthPromptModal from './Components/AuthPromptModal';
import GenerationOverlay from './Components/GenerationOverlay.jsx';
import { consumePendingPrompt } from './Components/Home/promptHandoff.js';
import { useAiSiteGenerator } from './useAiSiteGenerator.js';
import { useUserContext } from './userContext.js';
import { stageLabel } from './utils/generationProgress.js';
import {
  ApplyButton,
  CheckboxLabel,
  ErrorText,
  GenerateButton,
  HistoryItem,
  HistoryList,
  LockedBadge,
  OptionsLabel,
  OptionsRow,
  Panel,
  PanelHeader,
  PanelIcon,
  PanelTitle,
  PromptInput,
  RefineHeader,
  RefineInput,
  RefineNote,
  RefineSection,
  RefineTitle,
  Row,
  StyleButton,
} from './AIAssistant.styles.js';

/** How far the model may stray from the safe, conventional answer. */
const CREATIVITY_OPTIONS = [
  { key: 'low', label: 'Safe' },
  { key: 'balanced', label: 'Balanced' },
  { key: 'bold', label: 'Bold' },
];

const SIGN_UP_MESSAGE = 'The AI generator writes a whole site from one sentence, and it runs on our'
  + ' servers rather than in your browser - so it needs a free account. Everything else in this'
  + ' editor works without one.';

/**
 * The "keep talking to the page" box, shown once a site exists on the canvas.
 *
 * It owns the sentence being typed; the parent only says what to do with a
 * finished one.
 *
 * @param {boolean} loading                                  a request is in flight
 * @param {string[]} history                                 what has been asked so far
 * @param {(instruction: string) => Promise<boolean>} onApply true when the canvas changed
 */
function RefinePanel({ loading, history, onApply }) {
  const [instruction, setInstruction] = useState('');
  const nothingTyped = !instruction.trim();

  const apply = async () => {
    const applied = await onApply(instruction);
    if (applied) setInstruction('');
  };

  // The first entry is the original prompt, which is already shown in the box
  // above; the rest are the changes asked for since.
  const previousChanges = history.slice(1);

  return (
    <RefineSection>
      <RefineHeader>
        <span className="material-symbols-outlined">tune</span>
        <RefineTitle>Refine this site</RefineTitle>
      </RefineHeader>

      <Row>
        <RefineInput
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !loading) apply(); }}
          placeholder="Make it darker · Add a pricing section · Remove the map"
        />
        <ApplyButton onClick={apply} disabled={loading || nothingTyped}>
          {loading ? 'Wait...' : 'Apply'}
        </ApplyButton>
      </Row>

      {previousChanges.length > 0 && (
        <HistoryList>
          {previousChanges.map((change, index) => (
            <HistoryItem key={index}>· {change}</HistoryItem>
          ))}
        </HistoryList>
      )}

      <RefineNote>
        Refines the current saved or generated site, including changes you made by hand
        in the editor.
      </RefineNote>
    </RefineSection>
  );
}

/**
 * The panel above the canvas that turns a sentence into a website.
 *
 * All the requests live in `useAiSiteGenerator`; this component draws the box,
 * collects what the user typed, and guards the one feature a signed-out visitor
 * cannot have.
 */
export default function AIAssistant() {
  const { currentUser } = useUserContext();
  const {
    loading,
    stage,
    elapsed,
    error,
    history,
    canRefine,
    generateSite,
    refineSite,
    saveDraftLocally,
  } = useAiSiteGenerator();

  const [prompt, setPrompt] = useState('');
  const [creativity, setCreativity] = useState('balanced');
  const [multiPage, setMultiPage] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  /*
   * The generator is the one part of this editor a visitor cannot have.
   *
   * Everything else on this page works signed out - drag things around, load a
   * template, look at the result - and that is deliberate: somebody has to be
   * able to try the product. Generating is different because it spends money on
   * a provider per press, so `/api/ai/*` has always required a token. What it
   * did not have was a way of saying so: an anonymous press came back "Missing
   * authentication token", which is a sentence written for a developer reading
   * a log.
   */
  const locked = !currentUser;

  /**
   * Pick up a prompt typed on the landing page.
   *
   * Someone who described their site in the hero was sent here through
   * registration; arriving at an empty box would make that invitation a bait.
   * Read in an effect rather than in a useState initialiser because the read
   * consumes the value, and StrictMode invokes initialisers twice - the second
   * call would find it already gone.
   */
  useEffect(() => {
    const pendingPrompt = consumePendingPrompt();
    // Reading the handoff is the "subscribe to an external system once" case
    // the rule below allows for: it happens on mount only, and sessionStorage
    // cannot be read while rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pendingPrompt) setPrompt(pendingPrompt);
  }, []);

  const askToSignUp = () => {
    // The prompt promises their design will still be here afterwards.
    saveDraftLocally();
    setShowAuthPrompt(true);
  };

  /** True when the caller must stop, because this needs an account. */
  const needsAnAccount = () => {
    if (!locked) return false;
    askToSignUp();
    return true;
  };

  const handleGenerate = async () => {
    if (needsAnAccount()) return;
    if (!prompt.trim()) return;

    const generated = await generateSite({ prompt, creativity, multiPage });
    if (generated) setPrompt('');
  };

  const handleRefine = async (instruction) => {
    if (needsAnAccount()) return false;
    if (!instruction.trim()) return false;
    return refineSite(instruction);
  };

  return (
    <>
      <AuthPromptModal
        show={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Sign up to use the AI generator"
        message={SIGN_UP_MESSAGE}
      />

      {loading && <GenerationOverlay stage={stage} elapsed={elapsed} />}

      <Panel>
        <PanelHeader>
          <PanelIcon className="material-symbols-outlined">auto_awesome</PanelIcon>
          <PanelTitle>AI Generator</PanelTitle>

          {/*
            * Says what the panel is before it is pressed. The alternative was
            * leaving it looking ready and answering with a modal, which reads
            * as a page that changed its mind about what it offers.
            */}
          {locked && (
            <LockedBadge>
              <span className="material-symbols-outlined" aria-hidden="true">lock</span>
              Account required
            </LockedBadge>
          )}
        </PanelHeader>

        <Row>
          <PromptInput
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={locked ? 'Sign in to describe your website...' : 'Describe your website...'}
            rows={1}
            $locked={locked}
            /*
             * readOnly rather than disabled: a disabled field takes no clicks
             * and no focus, so the one moment the visitor asks what this is
             * would be the one moment nothing answers. It is opened on a press
             * and on a keystroke - not on focus, which would reopen itself the
             * instant the modal handed focus back.
             */
            readOnly={locked}
            onMouseDown={locked ? askToSignUp : undefined}
            onKeyDown={locked ? (event) => { if (event.key.length === 1) askToSignUp(); } : undefined}
          />

          {/*
            * Not disabled when locked, only dimmed: a disabled button swallows
            * the press, and the press is the question being answered.
            */}
          <GenerateButton onClick={handleGenerate} disabled={loading} $locked={locked}>
            <span className="material-symbols-outlined">auto_awesome</span>
            {loading ? stageLabel(stage) : 'Generate'}
          </GenerateButton>
        </Row>

        <OptionsRow>
          <OptionsLabel>Style:</OptionsLabel>

          {CREATIVITY_OPTIONS.map((option) => (
            <StyleButton
              key={option.key}
              $selected={creativity === option.key}
              disabled={loading}
              onClick={() => setCreativity(option.key)}
            >
              {option.label}
            </StyleButton>
          ))}

          <CheckboxLabel $disabled={loading}>
            <input
              type="checkbox"
              checked={multiPage}
              disabled={loading}
              onChange={(event) => setMultiPage(event.target.checked)}
            />
            Multi-page site
          </CheckboxLabel>
        </OptionsRow>

        {canRefine && (
          <RefinePanel loading={loading} history={history} onApply={handleRefine} />
        )}

        {error && <ErrorText>{error}</ErrorText>}
      </Panel>
    </>
  );
}
