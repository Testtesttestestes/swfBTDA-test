const form = document.querySelector('#swf-form');
const fileInput = document.querySelector('#swf-file');
const urlInput = document.querySelector('#swf-url');
const widthInput = document.querySelector('#swf-width');
const heightInput = document.querySelector('#swf-height');
const qualitySelect = document.querySelector('#swf-quality');
const audioTypeSelect = document.querySelector('#swf-audio-type');
const autoStartCheckbox = document.querySelector('#swf-autostart');
const debugCheckbox = document.querySelector('#swf-debug');
const backgroundInput = document.querySelector('#swf-bgcolor');
const flashVarsInput = document.querySelector('#swf-flashvars');
const resetButton = document.querySelector('#reset-button');
const target = document.querySelector('#swf-target');
const statusMessage = document.querySelector('#status-message');
const controlButtons = document.querySelectorAll('[data-action]');
if (!form ||
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
    !statusMessage) {
    throw new Error('Required UI elements are missing.');
}
let currentSwf = null;
let activeObjectUrl = null;
const setStatus = (message) => {
    statusMessage.textContent = message;
};
const revokeObjectUrl = () => {
    if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
        activeObjectUrl = null;
    }
};
const clearViewer = () => {
    target.innerHTML = '';
};
const parseFlashVars = () => {
    const raw = flashVarsInput.value.trim();
    if (!raw) {
        return undefined;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('FlashVars must be a JSON object.');
    }
    const flashVars = parsed;
    for (const [key, value] of Object.entries(flashVars)) {
        const valueType = typeof value;
        if (!['string', 'number', 'boolean'].includes(valueType)) {
            throw new Error(`FlashVars value for "${key}" must be a string, number, or boolean.`);
        }
    }
    return flashVars;
};
const getSource = () => {
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
const loadSwf = () => {
    const swf2js = window.swf2js;
    if (!swf2js) {
        throw new Error('swf2js.js is not loaded.');
    }
    clearViewer();
    const source = getSource();
    const options = {
        tagId: 'swf-target',
        width: Number(widthInput.value) || undefined,
        height: Number(heightInput.value) || undefined,
        quality: qualitySelect.value,
        audioType: audioTypeSelect.value,
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
    }
    catch (error) {
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
        }
        catch (error) {
            setStatus(error instanceof Error ? error.message : 'Unknown playback error.');
        }
    });
});
setStatus('Choose a SWF source and press “Load SWF”.');
export {};
