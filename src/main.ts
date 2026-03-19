export {};
type SwfQuality = 'low' | 'medium' | 'high';
type SwfAudioType = 'webaudio' | 'webmedia' | 'html5' | 'audio';

type FlashVars = Record<string, string | number | boolean>;

interface Swf2JsOptions {
  tagId: string;
  width?: number;
  height?: number;
  callback?: () => void;
  FlashVars?: FlashVars;
  quality?: SwfQuality;
  audioType?: SwfAudioType;
  bgcolor?: string;
  autoStart?: boolean;
  debug?: boolean;
}

interface SwfController {
  play(): void;
  stop(): void;
  step(): void;
  showInfo(): void;
  showDebug(): void;
}

interface Swf2JsGlobal {
  load(path: string, options?: Swf2JsOptions): SwfController;
}

declare global {
  interface Window {
    swf2js?: Swf2JsGlobal;
  }
}

const form = document.querySelector<HTMLFormElement>('#swf-form');
const fileInput = document.querySelector<HTMLInputElement>('#swf-file');
const urlInput = document.querySelector<HTMLInputElement>('#swf-url');
const widthInput = document.querySelector<HTMLInputElement>('#swf-width');
const heightInput = document.querySelector<HTMLInputElement>('#swf-height');
const qualitySelect = document.querySelector<HTMLSelectElement>('#swf-quality');
const audioTypeSelect = document.querySelector<HTMLSelectElement>('#swf-audio-type');
const autoStartCheckbox = document.querySelector<HTMLInputElement>('#swf-autostart');
const debugCheckbox = document.querySelector<HTMLInputElement>('#swf-debug');
const backgroundInput = document.querySelector<HTMLInputElement>('#swf-bgcolor');
const flashVarsInput = document.querySelector<HTMLTextAreaElement>('#swf-flashvars');
const resetButton = document.querySelector<HTMLButtonElement>('#reset-button');
const target = document.querySelector<HTMLDivElement>('#swf-target');
const statusMessage = document.querySelector<HTMLParagraphElement>('#status-message');
const controlButtons = document.querySelectorAll<HTMLButtonElement>('[data-action]');

if (
  !form ||
  !fileInput ||
  !urlInput ||
  !widthInput ||
  !heightInput ||
  !qualitySelect ||
  !audioTypeSelect ||
  !autoStartCheckbox ||
  !debugCheckbox ||
  !backgroundInput ||
  !flashVarsInput ||
  !resetButton ||
  !target ||
  !statusMessage
) {
  throw new Error('Required UI elements are missing.');
}

let currentSwf: SwfController | null = null;
let activeObjectUrl: string | null = null;

const setStatus = (message: string): void => {
  statusMessage.textContent = message;
};

const revokeObjectUrl = (): void => {
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
};

const clearViewer = (): void => {
  target.innerHTML = '';
};

const parseFlashVars = (): FlashVars | undefined => {
  const raw = flashVarsInput.value.trim();
  if (!raw) {
    return undefined;
  }

  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('FlashVars must be a JSON object.');
  }

  const flashVars = parsed as Record<string, unknown>;
  for (const [key, value] of Object.entries(flashVars)) {
    const valueType = typeof value;
    if (!['string', 'number', 'boolean'].includes(valueType)) {
      throw new Error(`FlashVars value for "${key}" must be a string, number, or boolean.`);
    }
  }

  return flashVars as FlashVars;
};

const getSource = (): string => {
  const file = fileInput.files?.[0];
  const url = urlInput.value.trim();

  if (file) {
    revokeObjectUrl();
    activeObjectUrl = URL.createObjectURL(file);
    return activeObjectUrl;
  }

  if (url) {
    revokeObjectUrl();
    return url;
  }

  throw new Error('Select a local SWF file or provide a SWF URL.');
};

const loadSwf = (): void => {
  const swf2js = window.swf2js;
  if (!swf2js) {
    throw new Error('swf2js.js is not loaded.');
  }

  clearViewer();
  const source = getSource();
  const options: Swf2JsOptions = {
    tagId: 'swf-target',
    width: Number(widthInput.value) || undefined,
    height: Number(heightInput.value) || undefined,
    quality: qualitySelect.value as SwfQuality,
    audioType: audioTypeSelect.value as SwfAudioType,
    autoStart: autoStartCheckbox.checked,
    bgcolor: backgroundInput.value.trim() || undefined,
    debug: debugCheckbox.checked,
    FlashVars: parseFlashVars(),
    callback: () => setStatus(`Loaded: ${source}`)
  };

  currentSwf = swf2js.load(source, options);
  setStatus(`Loading: ${source}`);
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  try {
    loadSwf();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Unknown loading error.');
  }
});

resetButton.addEventListener('click', () => {
  form.reset();
  widthInput.value = '800';
  heightInput.value = '600';
  qualitySelect.value = 'medium';
  audioTypeSelect.value = 'webaudio';
  backgroundInput.value = '#111827';
  autoStartCheckbox.checked = true;
  debugCheckbox.checked = false;
  flashVarsInput.value = '';
  urlInput.value = '';
  fileInput.value = '';
  currentSwf = null;
  revokeObjectUrl();
  clearViewer();
  setStatus('Form reset. Choose a SWF source and press “Load SWF”.');
});

controlButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!currentSwf) {
      setStatus('Load a SWF before using the playback controls.');
      return;
    }

    const action = button.dataset.action;
    if (!action) {
      return;
    }

    try {
      switch (action) {
        case 'play':
          currentSwf.play();
          setStatus('Playback started.');
          break;
        case 'stop':
          currentSwf.stop();
          setStatus('Playback stopped.');
          break;
        case 'step':
          currentSwf.step();
          setStatus('Advanced by one frame.');
          break;
        case 'info':
          currentSwf.showInfo();
          setStatus('Displayed SWF info in the page.');
          break;
        case 'debug':
          currentSwf.showDebug();
          setStatus('Displayed SWF debug output in the page.');
          break;
        default:
          setStatus(`Unknown action: ${action}`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unknown playback error.');
    }
  });
});

setStatus('Choose a SWF source and press “Load SWF”.');
