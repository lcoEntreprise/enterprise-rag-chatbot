"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from 'lucide-react';
import { useSpaces } from '@/components/spaces/SpacesContext';

export function CreateChatModal({ trigger }: { trigger?: React.ReactNode }) {
    const { activeSpace, createConversation } = useSpaces();
    const [title, setTitle] = useState('');
    const [open, setOpen] = useState(false);

    const handleCreate = () => {
        if (activeSpace && title.trim()) {
            createConversation(activeSpace.id, title);
            setTitle('');
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Chat</DialogTitle>
                    <DialogDescription>
                        Start a new conversation in {activeSpace?.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Title
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g., Q3 Planning"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate}>Start Chat</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
