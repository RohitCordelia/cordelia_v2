import React from 'react';
import { ChatMessage } from '../../types';

const GRADIENT = 'linear-gradient(135deg, #92278F 0%, #D1527D 50%, #EA725B 100%)';

function parseFormattedText(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    text.split('\n').forEach((line, li) => {
        if (li > 0) nodes.push(<br key={`br-${li}`} />);
        line.split(/(\*\*[^*]+\*\*)/g).forEach((seg, si) => {
            if (seg.startsWith('**') && seg.endsWith('**')) {
                nodes.push(<strong key={`${li}-${si}`}>{seg.slice(2, -2)}</strong>);
            } else if (seg) {
                nodes.push(seg);
            }
        });
    });
    return nodes;
}

/* ── Avatars ─────────────────────────────────────────────────────────────── */

function BotAvatar() {
    return (
        <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold leading-none"
            style={{ background: GRADIENT }}
        >
            A
        </div>
    );
}

function UserAvatar() {
    return (
        <div className="w-7 h-7 rounded-full flex-shrink-0 bg-gray-200 flex items-center justify-center">
            <svg className="w-4 h-4 fill-gray-500" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
        </div>
    );
}

/* ── Typing dots ─────────────────────────────────────────────────────────── */

function TypingDots() {
    return (
        <div className="flex items-end gap-2">
            <BotAvatar />
            <div className="flex items-center gap-1 bg-gray-300 rounded-2xl rounded-bl-sm px-3.5 py-3 shadow-allSide">
                {[0, 150, 300].map(delay => (
                    <div
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-gray-200 chatbot-typing-dot"
                        style={{ animationDelay: `${delay}ms`, animation: 'chatbot-bounce 1.2s infinite ease-in-out' }}
                    />
                ))}
            </div>
        </div>
    );
}

/* ── Message row ─────────────────────────────────────────────────────────── */

interface MessageListProps {
    messages: ChatMessage[];
    isTyping: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({ messages, isTyping, messagesEndRef }: MessageListProps) {
    return (
        <div className="chatbot-messages flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
            {messages.map(msg =>
                msg.sender === 'bot' ? (
                    /* Bot message: avatar left, bubble right of it */
                    <div key={msg.id} className="flex items-end gap-2">
                        <BotAvatar />
                        <div className="max-w-[78%] bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[13px] text-gray-800 leading-relaxed shadow-allSide">
                            {parseFormattedText(msg.text)}
                        </div>
                    </div>
                ) : (
                    /* User message: bubble left of avatar, avatar right */
                    <div key={msg.id} className="flex items-end gap-2 flex-row-reverse">
                        {/* <UserAvatar /> */}
                        <div
                            className="max-w-[78%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-[13px] text-white leading-relaxed"
                            style={{ background: GRADIENT }}
                        >
                            {parseFormattedText(msg.text)}
                        </div>
                    </div>
                )
            )}
            {isTyping && <TypingDots />}
            <div ref={messagesEndRef} />
        </div>
    );
}
