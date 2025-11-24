"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Save, Plus, Trash2, Moon, Sun } from 'lucide-react';
import { useSettings, ApiKeys } from './SettingsContext';
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export function ApiKeySettings() {
    const { apiKeys, setApiKey, customProviders, addCustomProvider, removeCustomProvider, fetchModels } = useSettings();
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [localKeys, setLocalKeys] = useState<ApiKeys>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { theme, setTheme } = useTheme();

    // Custom Provider State
    const [newProviderName, setNewProviderName] = useState('');
    const [newProviderUrl, setNewProviderUrl] = useState('');
    const [newProviderKey, setNewProviderKey] = useState('');

    // Initialize local keys from context
    useEffect(() => {
        setLocalKeys({
            google: apiKeys.google || '',
            openai: apiKeys.openai || '',
            groq: apiKeys.groq || ''
        });
    }, [apiKeys]);

    // Initialize local keys from context
    useEffect(() => {
        setLocalKeys({
            google: apiKeys.google || '',
            openai: apiKeys.openai || '',
            groq: apiKeys.groq || ''
        });
    }, [apiKeys]);

    const toggleShowKey = (provider: string) => {
        setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
    };

    const handleLocalKeyChange = (provider: keyof ApiKeys, value: string) => {
        setLocalKeys(prev => ({ ...prev, [provider]: value }));
        setHasChanges(true);
    };

    const handleSaveKeys = async () => {
        setIsSaving(true);
        try {
            // Save to backend
            const response = await fetch('http://127.0.0.1:8000/api/save-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localKeys)
            });

            if (response.ok) {
                // Update context
                if (localKeys.google !== undefined) setApiKey('google', localKeys.google);
                if (localKeys.openai !== undefined) setApiKey('openai', localKeys.openai);
                if (localKeys.groq !== undefined) setApiKey('groq', localKeys.groq);
                setHasChanges(false);

                // Trigger model fetch
                await fetchModels();
            } else {
                console.error('Failed to save keys to backend');
            }
        } catch (error) {
            console.error('Failed to save keys:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddCustomProvider = () => {
        if (newProviderName && newProviderUrl) {
            addCustomProvider({
                name: newProviderName,
                baseUrl: newProviderUrl,
                apiKey: newProviderKey,
                models: [] // Models are fetched dynamically
            });
            setNewProviderName('');
            setNewProviderUrl('');
            setNewProviderKey('');
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                            <Label htmlFor="dark-mode">Dark Mode</Label>
                        </div>
                        <Switch
                            id="dark-mode"
                            checked={theme === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                        Manage your API keys for different LLM providers. Keys are stored locally in your browser.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Standard Providers */}
                    {['google', 'openai', 'groq'].map((provider) => (
                        <div key={provider} className="space-y-2">
                            <Label htmlFor={`${provider}-key`} className="capitalize">{provider} API Key</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id={`${provider}-key`}
                                        type={showKeys[provider] ? "text" : "password"}
                                        placeholder={`Enter ${provider} API key`}
                                        value={localKeys[provider as keyof ApiKeys] || ''}
                                        onChange={(e) => handleLocalKeyChange(provider as keyof ApiKeys, e.target.value)}
                                        className="pr-10"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => toggleShowKey(provider)}
                                    >
                                        {showKeys[provider] ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSaveKeys}
                            disabled={!hasChanges || isSaving}
                        >
                            {isSaving ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save API Keys
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Custom Providers</CardTitle>
                    <CardDescription>Add OpenAI-compatible providers (e.g., LocalAI, vLLM).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="provider-name">Name</Label>
                            <Input
                                id="provider-name"
                                placeholder="e.g., LocalAI"
                                value={newProviderName}
                                onChange={(e) => setNewProviderName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="provider-url">Base URL</Label>
                            <Input
                                id="provider-url"
                                placeholder="e.g., http://localhost:8080/v1"
                                value={newProviderUrl}
                                onChange={(e) => setNewProviderUrl(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="provider-key">API Key (Optional)</Label>
                            <Input
                                id="provider-key"
                                type="password"
                                placeholder="Enter API key if required"
                                value={newProviderKey}
                                onChange={(e) => setNewProviderKey(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleAddCustomProvider}
                            disabled={!newProviderName || !newProviderUrl}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Provider
                        </Button>
                    </div>

                    {customProviders.length > 0 && (
                        <div className="space-y-2 mt-4">
                            <Label>Configured Providers</Label>
                            {customProviders.map((provider) => (
                                <div key={provider.id} className="flex items-center justify-between p-3 border rounded-md">
                                    <div>
                                        <div className="font-medium">{provider.name}</div>
                                        <div className="text-xs text-muted-foreground">{provider.baseUrl}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeCustomProvider(provider.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
