import React from 'react';

const GRADIENT = 'linear-gradient(135deg, #92278F 0%, #D1527D 50%, #EA725B 100%)';

interface ChatInputProps {
    inputValue: string;
    isTyping: boolean;
    isListening: boolean;
    onInputChange: (value: string) => void;
    onSend: () => void;
    onStartListening: () => void;
    onStopListening: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

export function ChatInput({
    inputValue,
    isTyping,
    isListening,
    onInputChange,
    onSend,
    onStartListening,
    onStopListening,
    inputRef,
}: ChatInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') onSend();
    };

    return (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t-2 border-gray-400 flex-shrink-0">
            {/* Mic / Stop button */}
            <button
                className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all border-2 ${
                    isListening
                        ? 'bg-[#f9eaef] chatbot-mic-listening border-none'
                        : 'bg-[#f9eaef] border-none'
                }`}
                onClick={isListening ? onStopListening : onStartListening}
                disabled={isTyping}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
                {isListening ? (
                    /* Stop square */
                    <svg className="w-3.5 h-3.5 fill-brand-primary" viewBox="0 0 24 24">
                        <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                ) : (
                    /* Mic */
                    <svg className="w-4 h-4 fill-brand-primary" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                )}
            </button>

            {/* Text input */}
            <input
                ref={inputRef}
                className="flex-1 border-none bg-gray-400 rounded-full px-4 py-2 text-[13px] text-gray-800 placeholder-gray-800 outline-none focus:ring-0 transition-all"
                type="text"
                placeholder={isListening ? 'Listening...' : 'Ask Nyra anything...'}
                value={inputValue}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping || isListening}
            />

            {/* Send button */}
            <button
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: GRADIENT }}
                onClick={onSend}
                disabled={!inputValue.trim() || isTyping}
                aria-label="Send message"
            >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
            </button>
        </div>
    );
}
