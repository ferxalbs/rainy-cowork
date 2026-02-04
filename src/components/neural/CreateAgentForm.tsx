import {
  Button,
  Select,
  ListBox,
  Slider,
  TextArea,
  TextField,
  Input,
  Label,
  Description,
  Separator,
  Spinner,
} from "@heroui/react";
import { useState } from "react";
import { createAtmAgent } from "../../services/tauri";
import { toast } from "@heroui/react";
import {
  Save,
  Eye,
  EyeOff,
  Bot,
  Sparkles,
  Cpu,
  ChevronDown,
} from "lucide-react";

interface CreateAgentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AGENT_TYPES = [
  { key: "chat", label: "Chat Assistant", icon: <Bot className="size-4" /> },
  { key: "task", label: "Task Worker", icon: <Cpu className="size-4" /> },
  {
    key: "researcher",
    label: "Researcher",
    icon: <Sparkles className="size-4" />,
  },
];

const GEMINI_MODELS = [
  {
    key: "gemini-3-pro-preview",
    label: "Gemini 3 Pro",
    description: "1M context, best for complex logic",
  },
  {
    key: "gemini-3-flash-preview",
    label: "Gemini 3 Flash",
    description: "Fast and efficient",
  },
  {
    key: "gemini-2.5-flash-preview-05-20",
    label: "Gemini 2.5 Flash",
    description: "Stable choice with 1M context",
  },
];

export function CreateAgentForm({ onSuccess, onCancel }: CreateAgentFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("chat");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gemini-3-pro-preview");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(8192);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = {
    systemPrompt: prompt,
    model,
    temperature,
    maxTokens,
    provider: "rainy" as const,
  };

  const handleSubmit = async () => {
    if (!name.trim() || !prompt.trim()) {
      toast.danger("Name and System Prompt are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAtmAgent(name, type, config);
      toast.success(`Agent "${name}" deployed successfully`);
      onSuccess();
    } catch (error) {
      console.error("Failed to create agent:", error);
      toast.danger("Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-1 text-foreground relative z-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField className="w-full text-foreground">
          <Label className="text-xs font-semibold uppercase tracking-wider text-default-500 mb-1.5 ml-1">
            Agent Name
          </Label>
          <Input
            placeholder="e.g., Sales Assistant"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 bg-zinc-800/50 backdrop-blur-sm border-white/10 hover:border-white/20 focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </TextField>

        <Select
          className="w-full"
          selectedKey={type}
          onSelectionChange={(key) => setType(key as string)}
        >
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
            Agent Type
          </Label>
          <Select.Trigger className="h-11 bg-zinc-800/50 backdrop-blur-sm border-white/10 hover:border-white/20 focus:border-primary/50 transition-colors text-foreground">
            <Select.Value className="flex items-center gap-2 text-foreground">
              {({ selectedItem, defaultChildren }) => {
                const selectedKey = (selectedItem as any)?.key;
                const selectedType = AGENT_TYPES.find(
                  (t) => t.key === selectedKey,
                );
                return (
                  <div className="flex items-center gap-2">
                    {selectedType?.icon}
                    <span className="text-foreground">
                      {selectedType?.label || defaultChildren}
                    </span>
                  </div>
                );
              }}
            </Select.Value>
            <Select.Indicator>
              <ChevronDown className="size-4 opacity-50 text-foreground" />
            </Select.Indicator>
          </Select.Trigger>
          <Select.Popover className="bg-zinc-900 border border-white/10">
            <ListBox className="bg-zinc-900 text-foreground">
              {AGENT_TYPES.map((t) => (
                <ListBox.Item key={t.key} id={t.key} textValue={t.label}>
                  <div className="flex items-center gap-2">
                    {t.icon}
                    <span>{t.label}</span>
                  </div>
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <Select
        className="w-full"
        selectedKey={model}
        onSelectionChange={(key) => setModel(key as string)}
      >
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
          Model (Gemini 3 Family)
        </Label>
        <Select.Trigger className="h-11 font-mono text-xs bg-zinc-800/50 backdrop-blur-sm border-white/10 hover:border-white/20 focus:border-primary/50 transition-colors text-foreground">
          <Select.Value className="text-foreground" />
          <Select.Indicator>
            <ChevronDown className="size-4 opacity-50 text-foreground" />
          </Select.Indicator>
        </Select.Trigger>
        <Description className="text-[10px] mt-1 text-default-400 font-medium">
          All models support up to 1M token input context
        </Description>
        <Select.Popover className="bg-zinc-900 border border-white/10">
          <ListBox className="bg-zinc-900 text-foreground">
            {GEMINI_MODELS.map((m) => (
              <ListBox.Item
                key={m.key}
                id={m.key}
                textValue={m.label}
                className="data-[hover=true]:bg-white/5"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm text-foreground">
                    {m.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {m.description}
                  </span>
                </div>
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="space-y-10 py-2">
        <Slider
          maxValue={1}
          minValue={0}
          step={0.05}
          value={temperature}
          onChange={(v) => setTemperature(v as number)}
        >
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-default-500">
              Temperature
            </Label>
            <Slider.Output className="text-xs font-mono bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">
              {temperature.toFixed(2)} (
              {temperature > 0.6
                ? "Creative"
                : temperature < 0.4
                  ? "Precise"
                  : "Balanced"}
              )
            </Slider.Output>
          </div>
          <Slider.Track>
            <Slider.Fill className="bg-secondary" />
            <Slider.Thumb className="bg-background border-secondary" />
          </Slider.Track>
        </Slider>

        <Slider
          maxValue={65536}
          minValue={1024}
          step={1024}
          value={maxTokens}
          onChange={(v) => setMaxTokens(v as number)}
        >
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-default-500">
              Max Output Tokens
            </Label>
            <Slider.Output className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              {maxTokens.toLocaleString()}
            </Slider.Output>
          </div>
          <Slider.Track>
            <Slider.Fill className="bg-primary" />
            <Slider.Thumb className="bg-background border-primary" />
          </Slider.Track>
        </Slider>
      </div>

      <TextField className="w-full">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">
          System Prompt
        </Label>
        <TextArea
          placeholder="You are a helpful assistant who..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full min-h-[120px] bg-zinc-800/50 backdrop-blur-sm border-white/10 hover:border-white/20 focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground"
        />
      </TextField>

      <div className="space-y-3">
        <Button
          variant="tertiary"
          size="sm"
          onPress={() => setShowPreview(!showPreview)}
          className="text-default-500 h-8"
        >
          <div className="flex items-center gap-2">
            {showPreview ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            <span>{showPreview ? "Hide" : "Show"} Config Preview</span>
          </div>
        </Button>
        {showPreview && (
          <pre className="text-[10px] font-mono bg-default-100/50 p-4 rounded-2xl overflow-x-auto border border-default-200/50 backdrop-blur-sm">
            {JSON.stringify(config, null, 2)}
          </pre>
        )}
      </div>

      <Separator />

      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onPress={onCancel}
          className="font-medium h-12 px-6"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={handleSubmit}
          className="font-bold h-12 px-10 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 isDisabled:opacity-50"
          isDisabled={isSubmitting}
        >
          <div className="flex items-center gap-2">
            {isSubmitting ? (
              <Spinner size="sm" color="current" />
            ) : (
              <Save className="size-5" />
            )}
            <span>Deploy Agent</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
