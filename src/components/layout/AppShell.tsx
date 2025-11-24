"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('./Sidebar').then(mod => mod.Sidebar), { ssr: false });
import { ChatWindow } from '../chat/ChatWindow';

export function AppShell() {
    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <ChatWindow />
            </main>
        </div>
    );
}
