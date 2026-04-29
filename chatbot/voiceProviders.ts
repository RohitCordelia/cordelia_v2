/**
 * Pluggable Voice Provider System for Nyra
 *
 * To switch voice providers, change the ACTIVE_VOICE_PROVIDER constant below.
 * To add a new provider, implement the VoiceProvider interface and register it.
 */

// ============ CONFIGURATION ============

// Change this to switch voice providers: 'browser' | 'sarvam'
export const ACTIVE_VOICE_PROVIDER: VoiceProviderName = 'browser';

// ============ INTERFACE ============

export type VoiceProviderName = 'browser' | 'sarvam';

export interface VoiceProvider {
    name: string;
    speak: (text: string) => Promise<void>;
    stop: () => void;
    isSupported: () => boolean;
}

// ============ UTILITY ============

function stripForSpeech(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, '')
        .replace(/•/g, ',')
        .replace(/\n+/g, '. ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function selectBestBrowserVoice(voices: SpeechSynthesisVoice[], language = 'en-IN'): SpeechSynthesisVoice | null {
    const preferredVoiceNames = [
        'Google UK English Female',
        'Google US English',
        'Microsoft Zira Desktop',
        'Microsoft Heera Desktop',
        'Microsoft Kalpana Desktop',
    ];

    // Preferred voice by name (any English locale)
    const preferred = voices.find(v => preferredVoiceNames.includes(v.name) && v.lang.startsWith('en'));
    if (preferred) return preferred;

    const languageMatch = voices.find(v => v.lang.startsWith(language));
    if (languageMatch) return languageMatch;

    const enMatch = voices.find(v => v.lang.startsWith('en'));
    return enMatch || voices[0] || null;
}

async function getBestBrowserVoice(language = 'en-IN'): Promise<SpeechSynthesisVoice | null> {
    const synth = window.speechSynthesis;
    let voices = synth.getVoices();

    if (!voices.length) {
        await new Promise<void>((resolve) => {
            const onVoicesChanged = () => {
                voices = synth.getVoices();
                synth.removeEventListener('voiceschanged', onVoicesChanged);
                resolve();
            };
            synth.addEventListener('voiceschanged', onVoicesChanged);
        });
    }

    return selectBestBrowserVoice(voices, language);
}

// ============ BROWSER TTS PROVIDER ============

const browserProvider: VoiceProvider = {
    name: 'Browser TTS',

    speak: async (text: string) => {
        const synth = window.speechSynthesis;
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(stripForSpeech(text));
        utterance.lang = 'en-IN';
        utterance.rate = 1;
        utterance.pitch = 1.05;
        utterance.volume = 1;

        const voice = await getBestBrowserVoice('en-IN');
        if (voice) {
            utterance.voice = voice;
        }

        synth.speak(utterance);
    },

    stop: () => {
        window.speechSynthesis.cancel();
    },

    isSupported: () => {
        return 'speechSynthesis' in window;
    },
};

// ============ SARVAM AI TTS PROVIDER ============

// Sarvam Configuration — change these to customize the voice
const SARVAM_CONFIG = {
    apiKey: (process.env.REACT_APP_SARVAM_API_KEY || '').trim(),
    model: 'bulbul:v3',                    // 'bulbul:v3' or 'bulbul:v2'
    speaker: 'simran',                    // Use a smoother voice for natural speech
    language: 'en-IN',                     // BCP-47 language code
    pace: 1.1,                             // Speed: 0.5 (slow) to 2.0 (fast), default 1.0
    // pitch: 0.0,                            // Pitch: -0.75 (deep) to 0.75 (sharp), default 0.0
    temperature: 0.8,                      // Expressiveness: 0.01-2.0, default 0.6

    /*
    Available v3 speakers:
    Male:   shubh, aditya, rahul, rohan, amit, dev, ratan, varun, manan, sumit, kabir, aayan,
            ashutosh, advait, anand, tarun, sunny, mani, gokul, vijay, mohit, rehan, soham
    Female: ritu, priya, neha, pooja, simran, kavya, ishita, shreya, roopa, amelia, sophia,
            tanya, shruti, suhani, kavitha, rupali

    Available v2 speakers:
    Male:   abhilash, karun, hitesh
    Female: anushka, manisha, vidya, arya
    */
};

let currentAudio: HTMLAudioElement | null = null;

const sarvamProvider: VoiceProvider = {
    name: 'Sarvam AI',

    speak: async (text: string) => {
        // Stop any ongoing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        if (!SARVAM_CONFIG.apiKey) {
            console.warn('Sarvam API key not configured. Falling back to browser TTS.');
            return browserProvider.speak(text);
        }

        const cleanText = stripForSpeech(text);
        if (!cleanText) return;

        // Sarvam has a 2500 char limit for v3
        const truncatedText = cleanText.substring(0, 2500);

        try {
            const response = await fetch('https://api.sarvam.ai/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': SARVAM_CONFIG.apiKey,
                },
                body: JSON.stringify({
                    inputs: [truncatedText],
                    target_language_code: SARVAM_CONFIG.language,
                    model: SARVAM_CONFIG.model,
                    speaker: SARVAM_CONFIG.speaker,
                    pace: SARVAM_CONFIG.pace,
                    // pitch: SARVAM_CONFIG.pitch,
                    temperature: SARVAM_CONFIG.temperature,
                    enable_preprocessing: true,
                }),
            });

            if (!response.ok) {
                console.error('Sarvam TTS error:', response.status, await response.text());
                return browserProvider.speak(text);
            }

            const data = await response.json();
            const audioBase64 =
                typeof data?.audios === 'string' ? data.audios :
                Array.isArray(data?.audios) && typeof data.audios[0] === 'string' ? data.audios[0] :
                Array.isArray(data?.audios) && typeof data.audios[0]?.audio === 'string' ? data.audios[0].audio :
                typeof data?.audio === 'string' ? data.audio :
                typeof data?.output?.audio === 'string' ? data.output.audio :
                typeof data?.data?.[0]?.audio === 'string' ? data.data[0].audio :
                null;

            if (!audioBase64) {
                console.error('Sarvam TTS: No audio in response', data);
                return browserProvider.speak(text);
            }

            // Play the base64 audio
            const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
            currentAudio = audio;
            await audio.play();
        } catch (error) {
            console.error('Sarvam TTS failed, falling back to browser:', error);
            return browserProvider.speak(text);
        }
    },

    stop: () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
    },

    isSupported: () => {
        return true; // Falls back to browser if API key missing
    },
};

// ============ PROVIDER REGISTRY ============

const providers: Record<VoiceProviderName, VoiceProvider> = {
    browser: browserProvider,
    sarvam: sarvamProvider,
};

/**
 * Get the currently active voice provider.
 */
export function getVoiceProvider(): VoiceProvider {
    const provider = providers[ACTIVE_VOICE_PROVIDER] || providers.browser;
    console.info(`Using voice provider: ${provider.name} (${ACTIVE_VOICE_PROVIDER})`, {
        apiKeyLoaded: !!SARVAM_CONFIG.apiKey,
        providerNames: Object.keys(providers),
    });
    return provider;
}

/**
 * Get a specific voice provider by name.
 */
export function getVoiceProviderByName(name: VoiceProviderName): VoiceProvider {
    return providers[name] || providers.browser;
}
