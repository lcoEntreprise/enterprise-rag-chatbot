import React from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Bot, Sparkles, Zap, AlertCircle, Server } from 'lucide-react';
import { useSettings } from '@/components/settings/SettingsContext';

export type ModelProvider = 'google' | 'openai' | 'groq';

interface ModelSelectorProps {
    value: string;
    onValueChange: (value: string) => void;
}

export function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
    const { apiKeys, customProviders, availableModels } = useSettings();

    const hasAnyKey = apiKeys.google || apiKeys.openai || apiKeys.groq || customProviders.length > 0;

    // Helper to format model names for display
    const formatModelName = (modelId: string): string => {
        // Remove provider prefix if present
        const name = modelId.replace(/^models\//, '');
        // Convert to title case and clean up
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-[280px]">
                <SelectValue placeholder={hasAnyKey ? "Select a model" : "Configure API Keys first"} />
            </SelectTrigger>
            <SelectContent>
                {!hasAnyKey && (
                    <div className="p-2 text-sm text-muted-foreground flex items-center justify-center">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        No API keys configured
                    </div>
                )}

                {apiKeys.google && availableModels.google.length > 0 && (
                    <SelectGroup>
                        <SelectLabel className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500" /> Google
                        </SelectLabel>
                        {availableModels.google.map((model) => (
                            <SelectItem key={model} value={`google/${model}`}>
                                {formatModelName(model)}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                )}

                {apiKeys.openai && availableModels.openai.length > 0 && (
                    <SelectGroup>
                        <SelectLabel className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-green-500" /> OpenAI
                        </SelectLabel>
                        {availableModels.openai.map((model) => (
                            <SelectItem key={model} value={`openai/${model}`}>
                                {formatModelName(model)}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                )}

                {apiKeys.groq && availableModels.groq.length > 0 && (
                    <SelectGroup>
                        <SelectLabel className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-orange-500" /> Groq (Open Source)
                        </SelectLabel>
                        {availableModels.groq.map((model) => (
                            <SelectItem key={model} value={`groq/${model}`}>
                                {formatModelName(model)}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                )}

                {customProviders.map((provider) => {
                    // Get models for this provider from availableModels.custom
                    const providerModels = availableModels.custom[provider.id] || provider.models;

                    return (
                        <SelectGroup key={provider.id}>
                            <SelectLabel className="flex items-center gap-2">
                                <Server className="h-4 w-4 text-purple-500" /> {provider.name}
                            </SelectLabel>
                            {providerModels.map((model) => (
                                <SelectItem key={model} value={`custom/${provider.id}/${model}`}>
                                    {model}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
