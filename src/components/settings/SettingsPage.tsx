// Rainy Cowork - Settings Page
// Full-page settings with AI model selection, API keys, and preferences

import { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Button,
    Tabs,
    Switch,
    Label,
    Separator,
    TextField,
    Input,
    Spinner,
} from '@heroui/react';
import {
    Bot,
    Key,
    Palette,
    Shield,
    Check,
    Lock,
    Sparkles,
    TrendingUp,
    Eye,
    EyeOff,
    CreditCard,
    X,
    ArrowLeft,
} from 'lucide-react';
import * as tauri from '../../services/tauri';
import { useAIProvider, useCoworkStatus } from '../../hooks';
import { AI_PROVIDERS, type ProviderType } from '../../types';

interface SettingsPageProps {
    initialTab?: string;
    onBack?: () => void;
}

export function SettingsPage({ initialTab = 'models', onBack }: SettingsPageProps) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [models, setModels] = useState<tauri.ModelOption[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // API key management
    const {
        hasApiKey,
        validateApiKey,
        storeApiKey,
        deleteApiKey,
    } = useAIProvider();

    const {
        planName,
        hasPaidPlan,
        usagePercent,
        remainingUses,
        isOverLimit,
        isLoading: coworkLoading,
        status: coworkStatus,
        refresh: refreshCowork,
    } = useCoworkStatus();

    const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [validationStatus, setValidationStatus] = useState<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({});
    const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});

    // Load models and current selection
    useEffect(() => {
        async function loadData() {
            try {
                const [availableModels, currentModel] = await Promise.all([
                    tauri.getAvailableModels(),
                    tauri.getSelectedModel(),
                ]);
                setModels(availableModels);
                setSelectedModel(currentModel);
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Handle model selection
    const handleSelectModel = useCallback(async (modelId: string) => {
        setIsSaving(true);
        try {
            await tauri.setSelectedModel(modelId);
            setSelectedModel(modelId);
        } catch (error) {
            console.error('Failed to set model:', error);
        } finally {
            setIsSaving(false);
        }
    }, []);

    // API key handlers
    const getProviderId = (type: ProviderType) => type === 'rainyApi' ? 'rainy_api' : 'gemini';

    const handleApiKeyChange = (provider: ProviderType, value: string) => {
        setApiKeyInputs(prev => ({ ...prev, [provider]: value }));
        setValidationStatus(prev => ({ ...prev, [provider]: 'idle' }));
    };

    const handleValidateKey = async (provider: ProviderType) => {
        const key = apiKeyInputs[provider];
        if (!key?.trim()) return;

        setValidationStatus(prev => ({ ...prev, [provider]: 'validating' }));

        try {
            const providerId = getProviderId(provider);
            const isValid = await validateApiKey(providerId, key);
            setValidationStatus(prev => ({ ...prev, [provider]: isValid ? 'valid' : 'invalid' }));
        } catch {
            setValidationStatus(prev => ({ ...prev, [provider]: 'invalid' }));
        }
    };

    const handleSaveKey = async (provider: ProviderType) => {
        const key = apiKeyInputs[provider];
        if (!key?.trim()) return;

        setSavingStatus(prev => ({ ...prev, [provider]: true }));

        try {
            const providerId = getProviderId(provider);
            await storeApiKey(providerId, key);
            setApiKeyInputs(prev => ({ ...prev, [provider]: '' }));
            setValidationStatus(prev => ({ ...prev, [provider]: 'idle' }));
            await refreshCowork();
        } catch (error) {
            console.error('Failed to save API key:', error);
        } finally {
            setSavingStatus(prev => ({ ...prev, [provider]: false }));
        }
    };

    const handleDeleteKey = async (provider: ProviderType) => {
        const providerId = getProviderId(provider);
        await deleteApiKey(providerId);
        await refreshCowork();
    };

    const toggleShowKey = (provider: ProviderType) => {
        setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
    };

    const formatResetDate = (isoDate: string) => {
        if (!isoDate) return 'N/A';
        try {
            return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return 'N/A';
        }
    };

    // Group models by tier
    const freeModels = models.filter(m => !m.isPremium);
    const premiumModels = models.filter(m => m.isPremium);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
                {onBack && (
                    <Button variant="secondary" size="sm" onPress={onBack}>
                        <ArrowLeft className="size-4" />
                    </Button>
                )}
                <h1 className="text-xl font-semibold">Settings</h1>
            </div>

            {/* Tabs Content */}
            <div className="flex-1 overflow-auto p-4">
                <Tabs
                    selectedKey={activeTab}
                    onSelectionChange={(key) => setActiveTab(key as string)}
                    className="w-full"
                >
                    <Tabs.List className="mb-4">
                        <Tabs.Tab id="models">
                            <Bot className="size-4" />
                            AI Models
                        </Tabs.Tab>
                        <Tabs.Tab id="keys">
                            <Key className="size-4" />
                            API Keys
                        </Tabs.Tab>
                        <Tabs.Tab id="subscription">
                            <CreditCard className="size-4" />
                            Subscription
                        </Tabs.Tab>
                        <Tabs.Tab id="appearance">
                            <Palette className="size-4" />
                            Appearance
                        </Tabs.Tab>
                        <Tabs.Tab id="permissions">
                            <Shield className="size-4" />
                            Permissions
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* Models Tab */}
                    <Tabs.Panel id="models" className="space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <>
                                {/* Current Plan */}
                                <Card className="p-4 bg-accent/5 border-accent/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="size-5 text-accent" />
                                            <span className="font-medium">Current Plan: {planName}</span>
                                        </div>
                                        {!hasPaidPlan && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onPress={() => window.open('https://enosislabs.com/pricing', '_blank')}
                                            >
                                                <TrendingUp className="size-4" />
                                                Upgrade
                                            </Button>
                                        )}
                                    </div>
                                </Card>

                                {/* Free Tier Models */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                        Free Tier (Gemini BYOK)
                                    </h3>
                                    <div className="grid gap-3">
                                        {freeModels.map((model) => (
                                            <Card
                                                key={model.id}
                                                className={`p-4 cursor-pointer transition-all hover:border-accent/50 ${selectedModel === model.id
                                                        ? 'border-accent bg-accent/5'
                                                        : ''
                                                    }`}
                                                onClick={() => handleSelectModel(model.id)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{model.name}</span>
                                                            {selectedModel === model.id && (
                                                                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <Check className="size-3" />
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {model.description}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                            <span>Provider: {model.provider}</span>
                                                            <span>•</span>
                                                            <span>Thinking: {model.thinkingLevel}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`size-5 rounded-full border-2 flex items-center justify-center ${selectedModel === model.id
                                                            ? 'border-accent bg-accent'
                                                            : 'border-muted-foreground'
                                                        }`}>
                                                        {selectedModel === model.id && (
                                                            <Check className="size-3 text-white" />
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Premium Models */}
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                        <Lock className="size-4" />
                                        Premium Models (Rainy API)
                                    </h3>
                                    <div className="grid gap-3">
                                        {premiumModels.map((model) => (
                                            <Card
                                                key={model.id}
                                                className={`p-4 transition-all ${model.isAvailable && selectedModel === model.id
                                                        ? 'border-accent bg-accent/5 cursor-pointer'
                                                        : model.isAvailable
                                                            ? 'cursor-pointer hover:border-accent/50'
                                                            : 'opacity-60 cursor-not-allowed'
                                                    }`}
                                                onClick={() => model.isAvailable && handleSelectModel(model.id)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{model.name}</span>
                                                            {!model.isAvailable && (
                                                                <Lock className="size-3 text-muted-foreground" />
                                                            )}
                                                            {model.isAvailable && selectedModel === model.id && (
                                                                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <Check className="size-3" />
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {model.description}
                                                        </p>
                                                    </div>
                                                    {model.isAvailable ? (
                                                        <div className={`size-5 rounded-full border-2 flex items-center justify-center ${selectedModel === model.id
                                                                ? 'border-accent bg-accent'
                                                                : 'border-muted-foreground'
                                                            }`}>
                                                            {selectedModel === model.id && (
                                                                <Check className="size-3 text-white" />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onPress={() => window.open('https://enosislabs.com/pricing', '_blank')}
                                                        >
                                                            Upgrade
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {isSaving && (
                                    <div className="fixed bottom-4 right-4 bg-accent text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                        <Spinner size="sm" />
                                        Saving...
                                    </div>
                                )}
                            </>
                        )}
                    </Tabs.Panel>

                    {/* API Keys Tab */}
                    <Tabs.Panel id="keys" className="space-y-4">
                        {AI_PROVIDERS.map((provider) => {
                            const providerId = getProviderId(provider.id);
                            const hasKey = hasApiKey(providerId);
                            const status = validationStatus[provider.id] || 'idle';
                            const saving = savingStatus[provider.id];
                            const showKey = showKeys[provider.id];

                            return (
                                <Card key={provider.id} className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="size-4 text-accent" />
                                                <span className="font-medium">{provider.name}</span>
                                            </div>
                                            {hasKey && (
                                                <span className="text-xs text-green-600 flex items-center gap-1">
                                                    <Check className="size-3" />
                                                    Connected
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            {provider.description}
                                        </p>

                                        {!hasKey ? (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <TextField
                                                        className="flex-1"
                                                        name={`api-key-${provider.id}`}
                                                        type={showKey ? 'text' : 'password'}
                                                        onChange={(value) => handleApiKeyChange(provider.id, value)}
                                                    >
                                                        <Input
                                                            placeholder="Enter API key..."
                                                            value={apiKeyInputs[provider.id] || ''}
                                                        />
                                                    </TextField>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onPress={() => toggleShowKey(provider.id)}
                                                    >
                                                        {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                    </Button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onPress={() => handleValidateKey(provider.id)}
                                                        isDisabled={!apiKeyInputs[provider.id]?.trim() || status === 'validating'}
                                                    >
                                                        {status === 'validating' ? 'Validating...' : 'Validate'}
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onPress={() => handleSaveKey(provider.id)}
                                                        isDisabled={!apiKeyInputs[provider.id]?.trim() || saving}
                                                    >
                                                        {saving ? 'Saving...' : 'Save to Keychain'}
                                                    </Button>
                                                </div>
                                                {status === 'valid' && (
                                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                                        <Check className="size-3" /> API key is valid
                                                    </p>
                                                )}
                                                {status === 'invalid' && (
                                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                                        <X className="size-3" /> Invalid API key
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    API key stored in Keychain
                                                </span>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onPress={() => handleDeleteKey(provider.id)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </Tabs.Panel>

                    {/* Subscription Tab */}
                    <Tabs.Panel id="subscription" className="space-y-4">
                        <Card className="p-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="size-5 text-accent" />
                                        <span className="font-semibold text-lg">{planName}</span>
                                        {hasPaidPlan && (
                                            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    {!hasPaidPlan && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onPress={() => window.open('https://enosislabs.com/pricing', '_blank')}
                                        >
                                            <TrendingUp className="size-4" />
                                            Upgrade
                                        </Button>
                                    )}
                                </div>

                                <Separator />

                                {!coworkLoading && coworkStatus && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Monthly Usage</span>
                                            <span className={isOverLimit ? 'text-red-500 font-medium' : ''}>
                                                {coworkStatus.usage.used} / {coworkStatus.usage.limit} uses
                                            </span>
                                        </div>

                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' :
                                                        usagePercent >= 70 ? 'bg-yellow-500' :
                                                            'bg-accent'
                                                    }`}
                                                style={{ width: `${Math.min(100, usagePercent)}%` }}
                                            />
                                        </div>

                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{remainingUses} remaining</span>
                                            <span>Resets {formatResetDate(coworkStatus.usage.resets_at)}</span>
                                        </div>
                                    </div>
                                )}

                                {coworkLoading && (
                                    <div className="flex items-center justify-center py-4">
                                        <Spinner size="sm" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    </Tabs.Panel>

                    {/* Appearance Tab */}
                    <Tabs.Panel id="appearance" className="space-y-4">
                        <Card className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="font-medium">Dark Mode</Label>
                                    <p className="text-sm text-muted-foreground">Use dark theme</p>
                                </div>
                                <Switch defaultSelected>
                                    <Switch.Control>
                                        <Switch.Thumb />
                                    </Switch.Control>
                                </Switch>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="font-medium">Compact Mode</Label>
                                    <p className="text-sm text-muted-foreground">Reduce spacing in UI</p>
                                </div>
                                <Switch>
                                    <Switch.Control>
                                        <Switch.Thumb />
                                    </Switch.Control>
                                </Switch>
                            </div>
                        </Card>
                    </Tabs.Panel>

                    {/* Permissions Tab */}
                    <Tabs.Panel id="permissions" className="space-y-4">
                        <Card className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="font-medium">Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Show task completion alerts</p>
                                </div>
                                <Switch defaultSelected>
                                    <Switch.Control>
                                        <Switch.Thumb />
                                    </Switch.Control>
                                </Switch>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="font-medium">Auto-execute Tasks</Label>
                                    <p className="text-sm text-muted-foreground">Start tasks immediately</p>
                                </div>
                                <Switch>
                                    <Switch.Control>
                                        <Switch.Thumb />
                                    </Switch.Control>
                                </Switch>
                            </div>
                        </Card>
                    </Tabs.Panel>
                </Tabs>
            </div>
        </div>
    );
}
