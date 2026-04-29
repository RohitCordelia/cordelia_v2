import React from 'react';
import { ChatMessage } from '../../types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import Button from '../../../../components/UI/Button';
const GRADIENT = 'linear-gradient(135deg, #92278F 0%, #D1527D 50%, #EA725B 100%)';

/* ── Welcome screen shortcuts ─────────────────────────────────────────────── */

const WELCOME_SHORTCUTS = [
    {
        label: 'Find a cruise',
        query: 'Find a cruise',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 010 8h-1" />
                <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
        ),
    },
    {
        label: 'General FAQs',
        query: 'What are the most common questions about Cordelia Cruises?',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
            </svg>
        ),
    },
    {
        label: 'Connect to support',
        query: 'I need to connect to support',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
        ),
    },
] as const;

/* ── Props ───────────────────────────────────────────────────────────────── */

interface ChatWindowProps {
    messages: ChatMessage[];
    isTyping: boolean;
    isListening: boolean;
    voiceEnabled: boolean;
    inputValue: string;
    onInputChange: (value: string) => void;
    onSend: (text?: string) => void;
    onStartListening: () => void;
    onStopListening: () => void;
    onToggleVoice: () => void;
    onNewChat: () => void;
    onClose: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    inputRef: React.RefObject<HTMLInputElement>;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function ChatWindow({
    messages,
    isTyping,
    isListening,
    voiceEnabled,
    inputValue,
    onInputChange,
    onSend,
    onStartListening,
    onStopListening,
    onToggleVoice,
    onNewChat,
    onClose,
    messagesEndRef,
    inputRef,
}: ChatWindowProps) {
    // Welcome screen = only the initial bot greeting, user hasn't sent anything yet
    const isWelcomeScreen = messages.length <= 1;

    return (
        <div className="chatbot-panel bg-white">
            {isWelcomeScreen
                ? <WelcomeScreen
                    greetingText={messages[0]?.text ?? ''}
                    onSend={onSend}
                    onClose={onClose}
                    inputValue={inputValue}
                    onInputChange={onInputChange}
                    isTyping={isTyping}
                    isListening={isListening}
                    onStartListening={onStartListening}
                    onStopListening={onStopListening}
                    inputRef={inputRef}
                />
                : <ChatScreen
                    messages={messages}
                    isTyping={isTyping}
                    isListening={isListening}
                    voiceEnabled={voiceEnabled}
                    inputValue={inputValue}
                    onInputChange={onInputChange}
                    onSend={onSend}
                    onStartListening={onStartListening}
                    onStopListening={onStopListening}
                    onToggleVoice={onToggleVoice}
                    onNewChat={onNewChat}
                    onClose={onClose}
                    messagesEndRef={messagesEndRef}
                    inputRef={inputRef}
                />
            }
        </div>
    );
}

/* ── Welcome screen ──────────────────────────────────────────────────────── */

interface WelcomeScreenProps {
    greetingText: string;
    onSend: (text?: string) => void;
    onClose: () => void;
    inputValue: string;
    onInputChange: (value: string) => void;
    isTyping: boolean;
    isListening: boolean;
    onStartListening: () => void;
    onStopListening: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

function WelcomeScreen({
    greetingText,
    onSend,
    onClose,
    inputValue,
    onInputChange,
    isTyping,
    isListening,
    onStartListening,
    onStopListening,
    inputRef,
}: WelcomeScreenProps) {
    return (
        <>
            {/* Tall gradient header */}
            <div className="chatbot-header px-5 pt-12 pb-16">
                {/* Close button */}
                <button
                    className="absolute top-4 right-4 w-7 h-7 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    onClick={onClose}
                    aria-label="Close chat"
                >
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                        <path d="M18.3 5.71a1 1 0 00-1.42 0L12 10.59 7.12 5.71a1 1 0 00-1.42 1.42L10.59 12l-4.89 4.88a1 1 0 101.42 1.42L12 13.41l4.88 4.89a1 1 0 001.42-1.42L13.41 12l4.89-4.88a1 1 0 000-1.41z" />
                    </svg>
                </button>

                {/* Avatar + Greeting */}
                <div className="flex flex-col items-center gap-3.5 mt-1">
                    <div className="w-16 h-16 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        N
                    </div>
                    <div className="text-white text-center">
                        <p className="text-2xl font-bold leading-tight">Hello! I'm Nyra</p>
                        <p className="text-sm text-white/80 mt-0.5">How can I help you today?</p>
                    </div>
                </div>
            </div>

            {/* White body — rounded top, overlaps the header gradient */}
            <div className="flex-1 bg-white rounded-t-2xl -mt-6 flex flex-col min-h-0">
                <div className="flex-1 px-4 pt-5 pb-2 flex flex-col gap-3 overflow-y-auto">

                    {/* Bot greeting bubble */}
                    <div className="flex items-end gap-2">
                        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: GRADIENT }}>
                            A
                        </div>
                        <div className="max-w-[80%] bg-white shadow-allSide rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] text-gray-800 leading-relaxed whitespace-pre-line">
                            {greetingText}
                        </div>
                    </div>

                    {/* Shortcut buttons as a second bot bubble */}
                    <div className="flex items-end gap-2">
                        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: GRADIENT }}>
                            A
                        </div>
                        <div className="flex flex-col gap-2 items-start">
                            {WELCOME_SHORTCUTS.map(shortcut => (
                                <Button
                                    key={shortcut.label}
                                    type='secondary'
                                    disabled={isTyping}
                                    handleClick={() => onSend(shortcut.query)}
                                    text={shortcut.label}
                                    className='rounded-full !py-[6px] !px-4 !text-sm !font-medium'
                                    leftIcon={shortcut.icon}
                                />
                            ))}
                        </div>
                    </div>

                </div>

                {/* Input */}
                <ChatInput
                    inputValue={inputValue}
                    isTyping={isTyping}
                    isListening={isListening}
                    onInputChange={onInputChange}
                    onSend={() => onSend()}
                    onStartListening={onStartListening}
                    onStopListening={onStopListening}
                    inputRef={inputRef}
                />
            </div>
        </>
    );
}

/* ── Chat screen ─────────────────────────────────────────────────────────── */

interface ChatScreenProps extends Omit<ChatWindowProps, 'onClose'> {
    onClose: () => void;
}

function ChatScreen({
    messages,
    isTyping,
    isListening,
    voiceEnabled,
    inputValue,
    onInputChange,
    onSend,
    onStartListening,
    onStopListening,
    onToggleVoice,
    onNewChat,
    onClose,
    messagesEndRef,
    inputRef,
}: ChatScreenProps) {
    return (
        <>
            {/* Compact gradient header */}
            <div className="chatbot-header flex items-center justify-between px-4 py-6 rounded-b-xl">
                {/* Left: avatar + name */}
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        N
                    </div>
                    <div>
                        <p className="text-white text-sm font-semibold leading-tight">Nyra</p>
                        <p className="text-white/75 text-[11px]">Your cruise concierge</p>
                    </div>
                </div>

                {/* Right: controls */}
                <div className="flex items-center gap-2">
                    {/* New chat */}
                    <button
                        className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center transition-colors"
                        onClick={onNewChat}
                        aria-label="Start new chat"
                        title="New chat"
                    >
                        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M19 3H5a2 2 0 00-2 2v14l4-4h12a2 2 0 002-2V5a2 2 0 00-2-2zm-7 3a1 1 0 011 1v3h3a1 1 0 010 2h-3v3a1 1 0 01-2 0v-3H8a1 1 0 010-2h3V7a1 1 0 011-1z" />
                        </svg>
                    </button>
                    {/* Voice toggle */}
                    <button
                        className={`w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center transition-colors ${voiceEnabled ? 'hover:bg-white/20' : 'opacity-50 hover:opacity-70'}`}
                        onClick={onToggleVoice}
                        aria-label={voiceEnabled ? 'Mute voice' : 'Enable voice'}
                        title={voiceEnabled ? 'Voice on' : 'Voice off'}
                    >
                        {voiceEnabled ? (
                            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                            </svg>
                        )}
                    </button>
                    {/* Close */}
                    <button
                        className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center transition-colors"
                        onClick={onClose}
                        aria-label="Close chat"
                    >
                        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                            <path d="M18.3 5.71a1 1 0 00-1.42 0L12 10.59 7.12 5.71a1 1 0 00-1.42 1.42L10.59 12l-4.89 4.88a1 1 0 101.42 1.42L12 13.41l4.88 4.89a1 1 0 001.42-1.42L13.41 12l4.89-4.88a1 1 0 000-1.41z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Chat body */}
            <div className="flex-1 bg-gray-50 flex flex-col min-h-0 bg-white">
                <MessageList messages={messages} isTyping={isTyping} messagesEndRef={messagesEndRef} />

                <ChatInput
                    inputValue={inputValue}
                    isTyping={isTyping}
                    isListening={isListening}
                    onInputChange={onInputChange}
                    onSend={() => onSend()}
                    onStartListening={onStartListening}
                    onStopListening={onStopListening}
                    inputRef={inputRef}
                />
            </div>
        </>
    );
}
