"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeySettings } from './ApiKeySettings';
import { SpaceSettings } from '../spaces/SpaceSettings';

export function SettingsDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Manage your application preferences and workspace settings.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General & API Keys</TabsTrigger>
                        <TabsTrigger value="space">Space Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general" className="mt-4">
                        <ApiKeySettings />
                    </TabsContent>
                    <TabsContent value="space" className="mt-4">
                        <SpaceSettings />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
