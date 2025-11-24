"use client";

import React, { useState } from 'react';
import { Box, Settings, MessageSquare, Network, Plus, Trash2, Search, ChevronRight, MoreVertical, Pin, PinOff, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSpaces } from '@/components/spaces/SpacesContext';
import { CreateSpaceModal } from '@/components/spaces/CreateSpaceModal';
import { CreateChatModal } from '@/components/chat/CreateChatModal';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { RenameChatModal } from '@/components/chat/RenameChatModal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const {
        spaces,
        activeSpaceId,
        selectSpace,
        activeSpace,
        selectConversation,
        deleteConversation,
        togglePin,
        renameChat
    } = useSpaces();

    const [searchQuery, setSearchQuery] = useState('');
    const [chatToDelete, setChatToDelete] = useState<{ spaceId: string, chatId: string } | null>(null);
    const [chatToRename, setChatToRename] = useState<{ spaceId: string, chatId: string, currentTitle: string } | null>(null);

    // Global Search Logic
    const searchResults = React.useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();
        return spaces.map(space => {
            const matchingConversations = space.conversations.filter(c => {
                const titleMatch = c.title.toLowerCase().includes(query);
                const contentMatch = c.messages.some(m => m.content.toLowerCase().includes(query));
                return titleMatch || contentMatch;
            });
            return {
                space,
                conversations: matchingConversations
            };
        }).filter(group => group.conversations.length > 0);
    }, [spaces, searchQuery]);

    const handleSelectSearchResult = (spaceId: string, conversationId: string) => {
        selectSpace(spaceId);
        // We need to wait for the space switch to happen before selecting the conversation?
        // In this synchronous context implementation, it should be fine to call sequentially.
        // However, selectConversation relies on the state being updated if it uses `activeSpaceId` internally?
        // Let's look at SpacesContext. selectConversation takes (spaceId, conversationId).
        // So it updates the specific space.
        selectConversation(spaceId, conversationId);
        setSearchQuery(''); // Clear search after selection
    };

    return (
        <div className={cn("pb-12 w-64 border-r bg-muted/20", className)}>
            <div className="space-y-4 py-4 flex flex-col h-full">
                {/* Global Search Bar */}
                <div className="px-3">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search all chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-9 bg-background"
                        />
                    </div>
                </div>

                {searchQuery ? (
                    // Search Results View
                    <ScrollArea className="flex-1 px-1">
                        <div className="space-y-4 p-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                                Search Results
                            </h3>
                            {searchResults.length === 0 ? (
                                <p className="text-sm text-muted-foreground px-2">No matches found.</p>
                            ) : (
                                searchResults.map((group) => (
                                    <div key={group.space.id} className="space-y-1">
                                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded">
                                            {group.space.type === 'graph' ? <Network className="h-3 w-3" /> : <Box className="h-3 w-3" />}
                                            {group.space.name}
                                        </div>
                                        {group.conversations.map(conversation => (
                                            <Button
                                                key={conversation.id}
                                                variant="ghost"
                                                className="w-full justify-start font-normal h-auto py-2"
                                                onClick={() => handleSelectSearchResult(group.space.id, conversation.id)}
                                            >
                                                <div className="flex flex-col items-start gap-1 w-full overflow-hidden">
                                                    <div className="flex items-center gap-2 w-full">
                                                        <MessageSquare className="h-3 w-3 shrink-0" />
                                                        <span className="truncate font-medium">{conversation.title}</span>
                                                    </div>
                                                    {/* Optional: Show snippet of matching content? */}
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                ) : (
                    // Normal View
                    <>
                        <div className="px-3 py-2">
                            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                                Spaces
                            </h2>
                            <div className="px-2 mb-4">
                                <Select value={activeSpaceId || ''} onValueChange={selectSpace}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a space" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {spaces.map(space => (
                                            <SelectItem key={space.id} value={space.id}>
                                                <div className="flex items-center gap-2">
                                                    {space.type === 'graph' ? <Network className="h-4 w-4" /> : <Box className="h-4 w-4" />}
                                                    {space.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="px-2">
                                <CreateSpaceModal />
                            </div>
                        </div>

                        {activeSpace && (
                            <div className="px-3 py-2 flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between px-4 mb-2">
                                    <h2 className="text-lg font-semibold tracking-tight">
                                        Chats
                                    </h2>
                                    <CreateChatModal />
                                </div>
                                <ScrollArea className="flex-1 px-1">
                                    <div className="space-y-1 p-2">
                                        {[...activeSpace.conversations]
                                            .sort((a, b) => {
                                                if (a.isPinned && !b.isPinned) return -1;
                                                if (!a.isPinned && b.isPinned) return 1;
                                                // Sort by last message or creation date
                                                const lastMsgA = a.messages[a.messages.length - 1]?.timestamp || a.createdAt;
                                                const lastMsgB = b.messages[b.messages.length - 1]?.timestamp || b.createdAt;
                                                return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
                                            })
                                            .map((conversation) => (
                                                <div key={conversation.id} className="group flex items-center gap-1">
                                                    <Button
                                                        variant={activeSpace.activeConversationId === conversation.id ? "secondary" : "ghost"}
                                                        className="flex-1 min-w-0 justify-start font-normal"
                                                        onClick={() => selectConversation(activeSpace.id, conversation.id)}
                                                    >
                                                        <div className="flex items-center w-full overflow-hidden">
                                                            {conversation.isPinned ? (
                                                                <Pin className="mr-2 h-3 w-3 shrink-0 rotate-45" />
                                                            ) : (
                                                                <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                                                            )}
                                                            <span className="truncate">{conversation.title}</span>
                                                        </div>
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    togglePin(activeSpace.id, conversation.id);
                                                                }}
                                                            >
                                                                {conversation.isPinned ? (
                                                                    <>
                                                                        <PinOff className="mr-2 h-4 w-4" />
                                                                        Unpin
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Pin className="mr-2 h-4 w-4" />
                                                                        Pin
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setChatToRename({
                                                                        spaceId: activeSpace.id,
                                                                        chatId: conversation.id,
                                                                        currentTitle: conversation.title
                                                                    });
                                                                }}
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Rename
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setChatToDelete({ spaceId: activeSpace.id, chatId: conversation.id });
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            ))}
                                        {activeSpace.conversations.length === 0 && (
                                            <p className="text-sm text-muted-foreground px-4 py-2">
                                                No conversations yet.
                                            </p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        <div className="px-3 py-2 mt-auto">
                            <SettingsDialog />
                        </div>
                    </>
                )}
            </div>

            <DeleteConfirmationDialog
                open={!!chatToDelete}
                onOpenChange={(open) => !open && setChatToDelete(null)}
                onConfirm={() => {
                    if (chatToDelete) {
                        deleteConversation(chatToDelete.spaceId, chatToDelete.chatId);
                        setChatToDelete(null);
                    }
                }}
                title="Delete Chat"
                description="Are you sure you want to delete this chat? This action cannot be undone."
            />

            {chatToRename && (
                <RenameChatModal
                    isOpen={!!chatToRename}
                    onClose={() => setChatToRename(null)}
                    onConfirm={(newTitle) => {
                        renameChat(chatToRename.spaceId, chatToRename.chatId, newTitle);
                    }}
                    currentTitle={chatToRename.currentTitle}
                />
            )}
        </div>
    );
}
