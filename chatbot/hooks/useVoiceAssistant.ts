import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { getVoiceProvider } from '../voiceProviders';

const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export interface UseVoiceAssistantOptions {
    onTranscript: (text: string) => void;
    onInterimResult: (text: string) => void;
    onError: (message: string) => void;
}

export function useVoiceAssistant({ onTranscript, onInterimResult, onError }: UseVoiceAssistantOptions) {
    const voiceProvider = useMemo(() => getVoiceProvider(), []);
    const [isListening, setIsListening] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef('');

    const onTranscriptRef = useRef(onTranscript);
    onTranscriptRef.current = onTranscript;
    const onInterimResultRef = useRef(onInterimResult);
    onInterimResultRef.current = onInterimResult;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
            voiceProvider.stop();
        };
    }, [voiceProvider]);

    const stopSpeaking = useCallback(() => {
        voiceProvider.stop();
    }, [voiceProvider]);

    const speakText = useCallback((text: string) => {
        if (!voiceEnabled) return;
        voiceProvider.speak(text);
    }, [voiceEnabled, voiceProvider]);

    const toggleVoice = useCallback(() => {
        setVoiceEnabled(prev => !prev);
        voiceProvider.stop();
    }, [voiceProvider]);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            onErrorRef.current('Sorry, voice input is not supported in your browser. Please try Chrome or Safari.');
            return;
        }
        voiceProvider.stop();
        finalTranscriptRef.current = '';

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }
            if (final) finalTranscriptRef.current = final;
            onInterimResultRef.current(final || interim);
        };

        recognition.onend = () => {
            setIsListening(false);
            const transcript = finalTranscriptRef.current.trim();
            if (transcript) {
                finalTranscriptRef.current = '';
                setTimeout(() => onTranscriptRef.current(transcript), 100);
            }
        };

        recognition.onerror = (event: any) => {
            setIsListening(false);
            if (event.error === 'not-allowed') {
                onErrorRef.current('Microphone access denied. Please allow microphone permission and try again.');
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [voiceProvider]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    return {
        isListening,
        voiceEnabled,
        speakText,
        toggleVoice,
        startListening,
        stopListening,
        stopSpeaking,
    };
}
