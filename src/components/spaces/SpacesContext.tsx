"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Attachment {
    id: string;
    name: string;
    size: number;
    type: string;
    file?: File;
}

export interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
    attachments?: Attachment[];
}

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    isPinned?: boolean;
}

export interface Document {
    id: string;
    name: string;
    size: number;
    type: string;
    path: string;
}

export interface Space {
    id: string;
    name: string;
    type: 'simple' | 'graph';
    documents: Document[];
    conversations: Conversation[];
    activeConversationId: string | null;
}

interface SpacesContextType {
    spaces: Space[];
    activeSpaceId: string | null;
    activeSpace: Space | undefined;
    activeConversation: Conversation | undefined;
    createSpace: (name: string) => void;
    selectSpace: (id: string) => void;
    updateSpaceType: (id: string, type: 'simple' | 'graph') => void;
    addDocumentToSpace: (spaceId: string, doc: Document) => void;
    createConversation: (spaceId: string, title?: string) => void;
    selectConversation: (spaceId: string, conversationId: string) => void;
    addMessageToConversation: (spaceId: string, conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string;
    updateMessageContent: (spaceId: string, conversationId: string, messageId: string, content: string) => void;
    deleteConversation: (spaceId: string, conversationId: string) => void;
    deleteSpace: (spaceId: string) => void;
    togglePin: (spaceId: string, conversationId: string) => void;
    renameChat: (spaceId: string, conversationId: string, newTitle: string) => void;
}



const SpacesContext = createContext<SpacesContextType | undefined>(undefined);

export function SpacesProvider({ children }: { children: ReactNode }) {
    const [spaces, setSpaces] = useState<Space[]>([
        {
            id: '1',
            name: 'Engineering Docs',
            type: 'simple',
            documents: [],
            conversations: [
                {
                    id: 'c1',
                    title: 'Architecture Review',
                    createdAt: new Date(),
                    messages: [
                        { id: 'm1', role: 'ai', content: 'Hello! How can I help you with the engineering docs today?', timestamp: new Date() }
                    ]
                }
            ],
            activeConversationId: 'c1'
        },
        {
            id: '2',
            name: 'HR Policies',
            type: 'graph',
            documents: [],
            conversations: [],
            activeConversationId: null
        }
    ]);
    const [activeSpaceId, setActiveSpaceId] = useState<string | null>('1');

    const activeSpace = spaces.find(s => s.id === activeSpaceId);
    const activeConversation = activeSpace?.conversations.find(c => c.id === activeSpace.activeConversationId);

    const createSpace = (name: string) => {
        const newSpace: Space = {
            id: Date.now().toString(),
            name,
            type: 'simple',
            documents: [],
            conversations: [],
            activeConversationId: null
        };
        setSpaces([...spaces, newSpace]);
        setActiveSpaceId(newSpace.id);
    };

    const selectSpace = (id: string) => {
        // When switching spaces, we want to show the dashboard (no active conversation)
        // unless we want to persist the last active one. User requested dashboard by default.
        setSpaces(spaces.map(s => {
            if (s.id === id) {
                return { ...s, activeConversationId: null };
            }
            return s;
        }));
        setActiveSpaceId(id);
    };

    const updateSpaceType = (id: string, type: 'simple' | 'graph') => {
        setSpaces(spaces.map(s => s.id === id ? { ...s, type } : s));
    };

    const addDocumentToSpace = (spaceId: string, doc: Document) => {
        setSpaces(spaces.map(s => s.id === spaceId ? { ...s, documents: [...s.documents, doc] } : s));
    };

    const createConversation = (spaceId: string, title: string = 'New Chat') => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title,
            messages: [{ id: Date.now().toString() + '_init', role: 'ai', content: 'New conversation started. How can I help?', timestamp: new Date() }],
            createdAt: new Date()
        };

        setSpaces(spaces.map(s => {
            if (s.id === spaceId) {
                return {
                    ...s,
                    conversations: [newConversation, ...s.conversations],
                    activeConversationId: newConversation.id
                };
            }
            return s;
        }));
    };

    const selectConversation = (spaceId: string, conversationId: string) => {
        setSpaces(spaces.map(s => s.id === spaceId ? { ...s, activeConversationId: conversationId } : s));
    };

    const messageIdCounter = React.useRef(0);

    const addMessageToConversation = (spaceId: string, conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
        messageIdCounter.current += 1;
        const newMessage: Message = {
            ...message,
            id: `${Date.now()}-${messageIdCounter.current}`,
            timestamp: new Date()
        };

        setSpaces(prevSpaces => prevSpaces.map(s => {
            if (s.id === spaceId) {
                return {
                    ...s,
                    conversations: s.conversations.map(c => {
                        if (c.id === conversationId) {
                            return { ...c, messages: [...c.messages, newMessage] };
                        }
                        return c;
                    })
                };
            }
            return s;
        }));
        return newMessage.id; // Return ID so we can update it later
    };

    const updateMessageContent = (spaceId: string, conversationId: string, messageId: string, content: string) => {
        setSpaces(prevSpaces => {
            const newSpaces = prevSpaces.map(s => {
                if (s.id === spaceId) {
                    return {
                        ...s,
                        conversations: s.conversations.map(c => {
                            if (c.id === conversationId) {
                                return {
                                    ...c,
                                    messages: c.messages.map(m =>
                                        m.id === messageId ? { ...m, content } : m
                                    )
                                };
                            }
                            return c;
                        })
                    };
                }
                return s;
            });
            return newSpaces;
        });
    };

    const deleteConversation = async (spaceId: string, conversationId: string) => {
        // Call backend to delete chat folder
        try {
            await fetch(`http://127.0.0.1:8000/api/chats/${conversationId}?space_id=${spaceId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error("Failed to delete chat from backend:", error);
            // Proceed with frontend deletion anyway to keep UI responsive
        }

        setSpaces(prevSpaces => prevSpaces.map(s => {
            if (s.id === spaceId) {
                const newConversations = s.conversations.filter(c => c.id !== conversationId);
                // If we deleted the active conversation, switch to the first one or null
                let newActiveId = s.activeConversationId;
                if (s.activeConversationId === conversationId) {
                    newActiveId = newConversations.length > 0 ? newConversations[0].id : null;
                }
                return {
                    ...s,
                    conversations: newConversations,
                    activeConversationId: newActiveId
                };
            }
            return s;
        }));
    };

    const deleteSpace = async (spaceId: string) => {
        // Call backend to delete space folder
        try {
            await fetch(`http://127.0.0.1:8000/api/spaces/${spaceId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error("Failed to delete space from backend:", error);
        }

        setSpaces(prevSpaces => {
            const newSpaces = prevSpaces.filter(s => s.id !== spaceId);
            // If we deleted the active space, switch to the first available one or null
            if (activeSpaceId === spaceId) {
                const nextSpace = newSpaces.length > 0 ? newSpaces[0] : null;
                setActiveSpaceId(nextSpace ? nextSpace.id : null);
            }
            return newSpaces;
        });
    };

    const togglePin = (spaceId: string, conversationId: string) => {
        setSpaces(prevSpaces => prevSpaces.map(s => {
            if (s.id === spaceId) {
                return {
                    ...s,
                    conversations: s.conversations.map(c =>
                        c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c
                    )
                };
            }
            return s;
        }));
    };

    const renameChat = (spaceId: string, conversationId: string, newTitle: string) => {
        setSpaces(prevSpaces => prevSpaces.map(s => {
            if (s.id === spaceId) {
                return {
                    ...s,
                    conversations: s.conversations.map(c =>
                        c.id === conversationId ? { ...c, title: newTitle } : c
                    )
                };
            }
            return s;
        }));
    };

    return (
        <SpacesContext.Provider value={{
            spaces,
            activeSpaceId,
            activeSpace,
            activeConversation,
            createSpace,
            selectSpace,
            updateSpaceType,
            addDocumentToSpace,
            createConversation,
            selectConversation,
            addMessageToConversation,
            updateMessageContent,
            deleteConversation,
            deleteSpace,
            togglePin,
            renameChat
        }}>
            {children}
        </SpacesContext.Provider>
    );
}

export function useSpaces() {
    const context = useContext(SpacesContext);
    if (context === undefined) {
        throw new Error('useSpaces must be used within a SpacesProvider');
    }
    return context;
}
