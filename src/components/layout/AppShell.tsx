import React from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar className="hidden md:block" />
            <main className="flex-1 overflow-y-auto border-l">
                {children}
            </main>
        </div>
    );
}
