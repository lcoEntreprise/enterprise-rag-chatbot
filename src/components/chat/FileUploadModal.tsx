"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: File[];
    onConfirm: (files: File[], filesToAddToSpace: Set<string>) => void;
}

export function FileUploadModal({ isOpen, onClose, files, onConfirm }: FileUploadModalProps) {
    const [filesToAddToSpace, setFilesToAddToSpace] = useState<string[]>([]);

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setFilesToAddToSpace([]);
        }
    }, [isOpen]);

    const toggleFile = (fileName: string) => {
        setFilesToAddToSpace(prev => {
            if (prev.includes(fileName)) {
                return prev.filter(f => f !== fileName);
            } else {
                return [...prev, fileName];
            }
        });
    };

    const toggleAll = () => {
        if (filesToAddToSpace.length === files.length) {
            setFilesToAddToSpace([]);
        } else {
            setFilesToAddToSpace(files.map(f => f.name));
        }
    };

    const handleConfirm = () => {
        onConfirm(files, new Set(filesToAddToSpace));
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                        Select files to add to the Space knowledge base. Unchecked files will only be added to this chat.
                    </p>
                    <div className="flex items-center justify-between mb-2 px-2">
                        <span className="text-sm font-medium">{files.length} files selected</span>
                        <Button variant="ghost" size="sm" onClick={toggleAll} className="h-auto py-1">
                            {filesToAddToSpace.length === files.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    </div>
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                        <div className="space-y-2">
                            {files.map((file) => (
                                <div key={file.name} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md">
                                    <Checkbox
                                        id={`file-${file.name}`}
                                        checked={filesToAddToSpace.includes(file.name)}
                                        onCheckedChange={() => toggleFile(file.name)}
                                    />
                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <div className="flex flex-col min-w-0">
                                            <label
                                                htmlFor={`file-${file.name}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate cursor-pointer"
                                            >
                                                {file.name}
                                            </label>
                                            <span className="text-xs text-muted-foreground">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirm}>Add Files</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
