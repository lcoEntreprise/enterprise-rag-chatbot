"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Plus } from 'lucide-react';

interface MessageInputProps {
    onSend: (message: string) => void;
    onFileSelect: (files: File[]) => void;
    disabled?: boolean;
}

export function MessageInput({ onSend, onFileSelect, disabled }: MessageInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (input.trim()) {
            onSend(input);
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(Array.from(e.target.files));
            // Reset input so the same file can be selected again if needed
            e.target.value = '';
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'inherit';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    return (
        <div className="relative flex items-end gap-2 p-4 border-t bg-background">
            <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
            >
                <Plus className="h-5 w-5" />
                <span className="sr-only">Add files</span>
            </Button>
            <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="min-h-[40px] max-h-[200px] resize-none py-2"
                disabled={disabled}
            />
            <Button
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
                onClick={handleSend}
                disabled={!input.trim() || disabled}
            >
                <SendHorizontal className="h-4 w-4" />
                <span className="sr-only">Send</span>
            </Button>
        </div>
    );
}
