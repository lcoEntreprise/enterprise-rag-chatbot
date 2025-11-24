"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ApiKeys {
    google?: string;
    openai?: string;
    groq?: string;
}

export interface AvailableModels {
    google: string[];
    openai: string[];
    groq: string[];
    custom: Record<string, string[]>; // providerId -> array of models
}

export interface CustomProvider {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    models: string[];
}

interface SettingsContextType {
    apiKeys: ApiKeys;
    customProviders: CustomProvider[];
    availableModels: AvailableModels;
    setApiKey: (provider: keyof ApiKeys, key: string) => void;
    removeApiKey: (provider: keyof ApiKeys) => void;
    addCustomProvider: (provider: Omit<CustomProvider, 'id'>) => void;
    removeCustomProvider: (id: string) => void;
    fetchModels: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [apiKeys, setApiKeys] = useState<ApiKeys>({});
    const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);
    const [availableModels, setAvailableModels] = useState<AvailableModels>({
        google: [],
        openai: [],
        groq: [],
        custom: {}
    });

    // Load settings on mount
    useEffect(() => {
        // Load Custom Providers
        const loadProviders = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/load-providers');
                if (response.ok) {
                    const providers = await response.json();
                    setCustomProviders(providers);
                }
            } catch (error) {
                console.error('Failed to load custom providers:', error);
            }
        };

        // Load API Keys
        const loadKeys = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/load-keys');
                if (response.ok) {
                    const keys = await response.json();
                    setApiKeys(prev => ({
                        ...prev,
                        google: keys.google || prev.google,
                        openai: keys.openai || prev.openai,
                        groq: keys.groq || prev.groq
                    }));
                }
            } catch (error) {
                console.error('Failed to load keys from backend:', error);
            }
        };

        loadProviders();
        loadKeys();
    }, []);

    // Save settings to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('api_keys', JSON.stringify(apiKeys));
    }, [apiKeys]);


    const setApiKey = (provider: keyof ApiKeys, key: string) => {
        setApiKeys(prev => ({ ...prev, [provider]: key }));
    };

    const removeApiKey = (provider: keyof ApiKeys) => {
        setApiKeys(prev => {
            const newKeys = { ...prev };
            delete newKeys[provider];
            return newKeys;
        });
    };

    const addCustomProvider = async (provider: Omit<CustomProvider, 'id'>) => {
        const newProvider = { ...provider, id: Date.now().toString() };
        const updatedProviders = [...customProviders, newProvider];
        setCustomProviders(updatedProviders);

        // Persist to backend
        try {
            await fetch('http://127.0.0.1:8000/api/save-providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProviders)
            });
        } catch (error) {
            console.error('Failed to save provider:', error);
        }
    };

    const removeCustomProvider = async (id: string) => {
        const updatedProviders = customProviders.filter(p => p.id !== id);
        setCustomProviders(updatedProviders);

        // Persist to backend
        try {
            await fetch('http://127.0.0.1:8000/api/save-providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProviders)
            });
        } catch (error) {
            console.error('Failed to remove provider:', error);
        }
    };

    const fetchModels = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/list-models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    google: apiKeys.google || null,
                    openai: apiKeys.openai || null,
                    groq: apiKeys.groq || null,
                    custom_providers: customProviders.map(p => ({
                        id: p.id,
                        apiKey: p.apiKey,
                        baseUrl: p.baseUrl
                    }))
                })
            });

            if (response.ok) {
                const models = await response.json();
                setAvailableModels(models);
            } else {
                console.error('Failed to fetch models, status:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
        }
    };

    // Auto-fetch models when API keys or custom providers change
    useEffect(() => {
        // Only fetch if at least one key or provider is present
        if (apiKeys.google || apiKeys.openai || apiKeys.groq || customProviders.length > 0) {
            fetchModels();
        }
    }, [apiKeys, customProviders]);

    return (
        <SettingsContext.Provider value={{
            apiKeys,
            customProviders,
            availableModels,
            setApiKey,
            removeApiKey,
            addCustomProvider,
            removeCustomProvider,
            fetchModels
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
