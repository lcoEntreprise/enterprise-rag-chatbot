"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Upload, FileText } from 'lucide-react';
import { useSpaces } from './SpacesContext';
import { ScrollArea } from '@/components/ui/scroll-area';

import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';

export function SpaceSettings() {
    const { activeSpace, updateSpaceType, addDocumentToSpace, deleteSpace } = useSpaces();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    if (!activeSpace) return null;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Create FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('space_id', activeSpace.id);
            formData.append('add_to_space', 'true');

            try {
                const response = await fetch('http://127.0.0.1:8000/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    // Update local state via context
                    addDocumentToSpace(activeSpace.id, {
                        id: Date.now().toString(),
                        name: file.name,
                        size: `${(file.size / 1024).toFixed(1)} KB`,
                        uploadDate: new Date()
                    });
                } else {
                    console.error("Upload failed");
                }
            } catch (error) {
                console.error("Error uploading file:", error);
            }

            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Space Settings: {activeSpace.name}</DialogTitle>
                    <DialogDescription>
                        Configure RAG settings and manage knowledge base.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium leading-none">RAG Configuration</h3>
                        <RadioGroup
                            value={activeSpace.type}
                            onValueChange={(val: string) => updateSpaceType(activeSpace.id, val as 'simple' | 'graph')}
                            className="grid grid-cols-2 gap-4"
                        >
                            <div>
                                <RadioGroupItem value="simple" id="simple" className="peer sr-only" />
                                <Label
                                    htmlFor="simple"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    <span className="mb-2 text-lg font-semibold">Simple RAG</span>
                                    <span className="text-center text-sm text-muted-foreground">
                                        Standard vector database retrieval. Fast and efficient for direct queries.
                                    </span>
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="graph" id="graph" className="peer sr-only" />
                                <Label
                                    htmlFor="graph"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                >
                                    <span className="mb-2 text-lg font-semibold">GraphRAG</span>
                                    <span className="text-center text-sm text-muted-foreground">
                                        Knowledge graph enhanced retrieval. Better for complex relationships and reasoning.
                                    </span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium leading-none">Knowledge Base</h3>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Document
                            </Button>
                        </div>
                        <div className="rounded-md border">
                            <ScrollArea className="h-[200px] p-4">
                                {activeSpace.documents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                                        <FileText className="h-8 w-8 mb-2 opacity-50" />
                                        No documents uploaded yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {activeSpace.documents.map((doc, i) => (
                                            <div key={i} className="flex items-center p-2 rounded-md bg-muted/50">
                                                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                                <span className="text-sm flex-1">{doc.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>

                    <div className="pt-6 border-t">
                        <h3 className="text-sm font-medium text-destructive mb-2">Danger Zone</h3>
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            Delete Space
                        </Button>
                    </div>
                </div>

                <DeleteConfirmationDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onConfirm={() => {
                        deleteSpace(activeSpace.id);
                        setIsDeleteDialogOpen(false);
                    }}
                    title="Delete Space"
                    description={`Are you sure you want to delete "${activeSpace.name}"? This will permanently delete all conversations and documents within this space.`}
                />
            </DialogContent>
        </Dialog>
    );
}
