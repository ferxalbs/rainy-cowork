// src/components/agents/AIDocumentPanel.tsx
// AI Document Generation Panel - Premium UI
// Uses HeroUI v3 compound components
// Part of Phase 3 - Rainy Cowork

import { useState } from "react";
import {
  Card,
  Button,
  Label,
  Select,
  ListBox,
  TextArea,
  Spinner,
} from "@heroui/react";
import { FileText, Sparkles, Download, Copy } from "lucide-react";
import { useDocument } from "../../hooks/useDocument";

interface Template {
  id: string;
  name: string;
  description: string;
}

const templates: Template[] = [
  {
    id: "meeting_notes",
    name: "Meeting Notes",
    description: "Meeting notes with attendees and action items",
  },
  {
    id: "project_report",
    name: "Project Report",
    description: "Comprehensive project status report",
  },
  {
    id: "email_draft",
    name: "Email Draft",
    description: "Professional email template",
  },
  {
    id: "quick_note",
    name: "Quick Note",
    description: "Simple note with title and content",
  },
];

export function AIDocumentPanel() {
  const { generateWithAI, generatedDoc, isAiGenerating, error } = useDocument();

  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await generateWithAI(prompt, selectedTemplate || undefined);
  };

  const handleCopy = async () => {
    if (!generatedDoc?.content) return;
    await navigator.clipboard.writeText(generatedDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedDoc?.content) return;
    const blob = new Blob([generatedDoc.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate || "document"}-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            AI Document Generation
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Generate professional documents, reports, and notes instantly.
        </p>
      </div>

      {/* Input Section */}
      <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
        <Card.Content className="p-6 space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Template (Optional)</Label>
            <Select
              className="w-full"
              placeholder="Select a starting template..."
              selectedKey={selectedTemplate || null}
              onSelectionChange={(key) => {
                setSelectedTemplate((key as string) || "");
              }}
            >
              <Select.Trigger className="bg-background/50 border-border/50 h-10">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {templates.map((t) => (
                    <ListBox.Item key={t.id} id={t.id} textValue={t.name}>
                      <div className="py-1">
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.description}
                        </p>
                      </div>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Prompt</Label>
            <TextArea
              placeholder="Describe what you want to create... (e.g., 'Write a summary of the Q3 marketing strategy meeting focusing on social media growth')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isAiGenerating}
              className="w-full bg-background/50 border-border/50 focus:bg-background transition-colors"
              rows={4}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto min-w-[140px] font-medium shadow-md shadow-primary/20"
              onPress={handleGenerate}
              isDisabled={!prompt.trim() || isAiGenerating}
            >
              {isAiGenerating ? (
                <>
                  <Spinner size="sm" color="current" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Generate Document</span>
                </>
              )}
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Generated Document */}
      {generatedDoc && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border/50 shadow-md overflow-hidden">
            <Card.Header className="flex justify-between items-center bg-muted/30 border-b border-border/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span className="font-medium">Generated Content</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={handleCopy}
                  className="hover:bg-background/80"
                >
                  <Copy className="size-4" />
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={handleDownload}
                  className="hover:bg-background/80"
                >
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            </Card.Header>
            <Card.Content className="p-0">
              <div className="bg-background">
                <div
                  className="prose dark:prose-invert max-w-none p-8 max-h-[600px] overflow-auto custom-scrollbar"
                  dangerouslySetInnerHTML={{
                    __html: generatedDoc.html || generatedDoc.content || "",
                  }}
                />
              </div>
            </Card.Content>
            <Card.Footer className="px-6 py-3 bg-muted/30 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
              <span>{generatedDoc.wordCount} words</span>
              <span>
                Generated{" "}
                {new Date(generatedDoc.generatedAt).toLocaleTimeString()}
              </span>
            </Card.Footer>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AIDocumentPanel;
