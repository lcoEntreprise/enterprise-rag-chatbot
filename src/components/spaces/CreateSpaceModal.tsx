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
import { useSpaces } from './SpacesContext';

export function CreateSpaceModal() {
    const { createSpace } = useSpaces();
    const [name, setName] = useState('');
    const [open, setOpen] = useState(false);

    const handleCreate = () => {
        if (name.trim()) {
            createSpace(name);
            setName('');
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    New Space
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Space</DialogTitle>
                    <DialogDescription>
                        Create a new space to organize your documents and chats.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g., Engineering Docs"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate}>Create Space</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
