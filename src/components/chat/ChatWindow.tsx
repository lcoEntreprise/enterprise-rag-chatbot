"use client";

import React, { useState, useCallback } from 'react';
import { ModelSelector } from './ModelSelector';
import { MessageInput } from './MessageInput';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, User, Network, Box, MessageSquarePlus, FileText, Upload, MessageSquare } from 'lucide-react';
import { useSpaces } from '@/components/spaces/SpacesContext';
import { CreateChatModal } from './CreateChatModal';
import { FileUploadModal } from './FileUploadModal';
import { cn } from '@/lib/utils';

import { useSettings } from '@/components/settings/SettingsContext';

export function ChatWindow() {
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const { activeSpace, activeConversation, addMessageToConversation, updateMessageContent, createConversation, addDocumentToSpace, selectConversation } = useSpaces();

    // File Upload State
    const [isDragOver, setIsDragOver] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const { apiKeys, customProviders, availableModels } = useSettings();

    // Auto-select first available model when API keys or available models change
    React.useEffect(() => {
        // Only auto-select if no model is currently selected
        if (selectedModel) return;

        if (apiKeys.google && availableModels.google.length > 0) {
            setSelectedModel(`google/${availableModels.google[0]}`);
        } else if (apiKeys.openai && availableModels.openai.length > 0) {
            setSelectedModel(`openai/${availableModels.openai[0]}`);
        } else if (apiKeys.groq && availableModels.groq.length > 0) {
            setSelectedModel(`groq/${availableModels.groq[0]}`);
        } else if (customProviders.length > 0) {
            setSelectedModel(`custom/${customProviders[0].id}/${customProviders[0].models[0]}`);
        }
    }, [apiKeys.google, apiKeys.openai, apiKeys.groq, customProviders, availableModels]);

    const handleSend = async (content: string) => {
        if (!activeSpace || !activeConversation) return;

        if (!selectedModel) {
            addMessageToConversation(activeSpace.id, activeConversation.id, {
                role: 'ai',
                content: "Please select a model from the dropdown menu above to start chatting."
            });
            return;
        }

        // Add user message
        addMessageToConversation(activeSpace.id, activeConversation.id, {
            role: 'user',
            content: content
        });

        setIsLoading(true);

        try {
            // Determine provider and model
            let providerName = "";
            let modelName = "";
            let apiKey = "";
            let baseUrl = undefined;

            if (selectedModel.startsWith('custom/')) {
                const [_, providerId, model] = selectedModel.split('/');
                const customProvider = customProviders.find(p => p.id === providerId);
                if (customProvider) {
                    providerName = "custom";
                    modelName = model;
                    apiKey = customProvider.apiKey;
                    baseUrl = customProvider.baseUrl;
                }
            } else {
                const [p, m] = selectedModel.split('/');
                providerName = p;
                modelName = m;
                // @ts-ignore
                apiKey = apiKeys[p] || "";
            }

            if (!apiKey) {
                addMessageToConversation(activeSpace.id, activeConversation.id, {
                    role: 'ai',
                    content: `Error: No API key found for ${providerName}. Please configure it in settings.`
                });
                setIsLoading(false);
                return;
            }

            // Create placeholder for AI response
            const aiMessageId = addMessageToConversation(activeSpace.id, activeConversation.id, {
                role: 'ai',
                content: ''
            });

            const requestBody = {
                messages: [...activeConversation.messages, { role: 'user', content }].map(m => ({
                    role: m.role,
                    content: m.content
                })),
                provider: providerName,
                model: modelName,
                apiKey: apiKey,
                baseUrl: baseUrl
            };

            const response = await fetch('http://127.0.0.1:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
            }
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiMessageContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                aiMessageContent += chunk;
                updateMessageContent(activeSpace.id, activeConversation.id, aiMessageId, aiMessageContent);
            }

        } catch (error) {
            addMessageToConversation(activeSpace.id, activeConversation.id, {
                role: 'ai',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (files: File[], filesToAddToSpace: Set<string>) => {
        if (!activeSpace || !activeConversation?.id) return;

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('space_id', activeSpace.id);
            formData.append('chat_id', activeConversation.id);
            formData.append('add_to_space', filesToAddToSpace.has(file.name).toString());

            try {
                await fetch('http://127.0.0.1:8000/api/upload', {
                    method: 'POST',
                    body: formData
                });
            } catch (error) {
                console.error('Upload failed for', file.name, error);
            }
        }
    };

    const handleFileConfirm = async (files: File[], filesToAddToSpace: Set<string>) => {
        if (!activeSpace || !activeConversation) return;

        setIsLoading(true);

        // Perform the actual upload to the backend
        await handleUpload(files, filesToAddToSpace);

        // 1. Process files to add to Space (UI update)
        files.forEach(file => {
            if (filesToAddToSpace.has(file.name)) {
                addDocumentToSpace(activeSpace.id, {
                    id: Date.now().toString() + Math.random(),
                    name: file.name,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    uploadDate: new Date()
                });
            }
        });

        // 2. Create a message with attachments
        const attachments = files.map(f => ({
            id: Date.now().toString() + Math.random(),
            name: f.name,
            size: f.size,
            type: f.type,
            file: f
        }));

        addMessageToConversation(activeSpace.id, activeConversation.id, {
            role: 'user',
            content: `Uploaded ${files.length} file(s): ${files.map(f => f.name).join(', ')}`,
            attachments: attachments
        });

        // Trigger AI response acknowledging files
        setIsLoading(true);
        setTimeout(() => {
            addMessageToConversation(activeSpace.id, activeConversation.id, {
                role: 'ai',
                content: `I've received your files. ${filesToAddToSpace.size > 0 ? `${filesToAddToSpace.size} file(s) have been added to the ${activeSpace.name} knowledge base.` : 'These files are available in this chat context.'}`
            });
            setIsLoading(false);
        }, 1000);
    };

    const handleFileSelect = (files: File[]) => {
        setPendingFiles(files);
        setIsUploadModalOpen(true);
    };

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!activeConversation) return;
        setIsDragOver(true);
    }, [activeConversation]);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!activeConversation) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(Array.from(e.dataTransfer.files));
        }
    }, [activeConversation]);

    if (!activeSpace) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a space to start chatting
            </div>
        );
    }

    if (!activeConversation) {
        // Sort conversations by last message timestamp or creation date
        const recentConversations = [...activeSpace.conversations]
            .sort((a, b) => {
                const lastMsgA = a.messages[a.messages.length - 1]?.timestamp || a.createdAt;
                const lastMsgB = b.messages[b.messages.length - 1]?.timestamp || b.createdAt;
                return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
            })
            .slice(0, 3);

        return (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-8 p-8">
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-semibold text-foreground">Welcome to {activeSpace.name}</h3>
                    <p>Select a recent discussion or start a new one.</p>
                </div>

                {recentConversations.length > 0 && (
                    <div className="w-full max-w-md space-y-4">
                        <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Recent Discussions</h4>
                        <div className="grid gap-3">
                            {recentConversations.map(conversation => {
                                const lastMessage = conversation.messages[conversation.messages.length - 1];
                                return (
                                    <Card
                                        key={conversation.id}
                                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-3 group"
                                        onClick={() => selectConversation(activeSpace.id, conversation.id)}
                                    >
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <MessageSquare className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h5 className="font-medium text-foreground truncate">{conversation.title}</h5>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                    {lastMessage?.timestamp.toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {lastMessage?.content || "No messages yet"}
                                            </p>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                <CreateChatModal trigger={
                    <Button className="gap-2 mt-4" size="lg">
                        <MessageSquarePlus className="h-5 w-5" />
                        Start New Chat
                    </Button>
                } />
            </div>
        );
    }

    return (
        <div
            className="flex-1 flex flex-col h-full relative"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Drag Overlay */}
            {isDragOver && (
                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-primary m-4 rounded-lg">
                    <div className="flex flex-col items-center gap-4 text-primary animate-bounce">
                        <Upload className="h-12 w-12" />
                        <p className="text-xl font-semibold">Drop files here to upload</p>
                    </div>
                </div>
            )}

            <FileUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                files={pendingFiles}
                onConfirm={handleFileConfirm}
            />

            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-3">
                    {activeSpace.type === 'graph' ? (
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    ) : (
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Box className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    )}
                    <div>
                        <h2 className="font-semibold">{activeSpace.name}</h2>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{activeSpace.type} RAG</span>
                            <span>•</span>
                            <span>{activeConversation.title}</span>
                        </div>
                    </div>
                </div>
                <ModelSelector value={selectedModel} onValueChange={setSelectedModel} />
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6 max-w-3xl mx-auto">
                    {activeConversation.messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            <p>Start a conversation in {activeSpace.name}</p>
                        </div>
                    ) : (
                        activeConversation.messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <Avatar className="h-8 w-8">
                                    {message.role === 'ai' ? (
                                        <>
                                            <AvatarImage src="/bot-avatar.png" />
                                            <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                                        </>
                                    ) : (
                                        <>
                                            <AvatarImage src="/user-avatar.png" />
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                        </>
                                    )}
                                </Avatar>
                                <div className={`flex flex-col gap-2 max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <Card className={`p-4 ${message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    </Card>

                                    {/* Attachments Display */}
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {message.attachments.map(att => (
                                                <div key={att.id} className="flex items-center gap-2 p-2 bg-muted/50 border rounded text-xs text-muted-foreground">
                                                    <FileText className="h-3 w-3" />
                                                    <span className="max-w-[150px] truncate">{att.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1 h-10 px-3 bg-muted rounded-lg">
                                <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-background">
                <div className="max-w-3xl mx-auto">
                    <MessageInput
                        onSend={handleSend}
                        onFileSelect={handleFileSelect}
                        disabled={isLoading}
                    />
                    <p className="text-xs text-center text-muted-foreground mt-2">
                        AI can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    );
}
