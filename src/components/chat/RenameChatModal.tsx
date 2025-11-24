"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newTitle: string) => void;
    currentTitle: string;
}

export function RenameChatModal({ isOpen, onClose, onConfirm, currentTitle }: RenameChatModalProps) {
    const [title, setTitle] = useState(currentTitle);

    useEffect(() => {
        setTitle(currentTitle);
    }, [currentTitle]);

    const handleConfirm = () => {
        if (title.trim()) {
            onConfirm(title.trim());
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rename Chat</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConfirm();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
