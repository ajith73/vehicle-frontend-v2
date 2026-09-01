import { useEffect, useMemo, useState } from 'react';
import { Bell, MapPin, MoonStar, RotateCcw, Shield, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

type CustomerSettingsState = {
  liveNotifications: boolean;
  marketingNotifications: boolean;
  emergencySharingReminder: boolean;
  trustedPartnerPreference: boolean;
  autoLocationPrompt: boolean;
  darkModeHint: boolean;
};

const SETTINGS_KEY = 'roadresq.customer.settings';

const defaultSettings: CustomerSettingsState = {
  liveNotifications: true,
  marketingNotifications: false,
  emergencySharingReminder: true,
  trustedPartnerPreference: true,
  autoLocationPrompt: true,
  darkModeHint: false
};

export default function CustomerSettingsPage() {
  const [settings, setSettings] = useState<CustomerSettingsState>(defaultSettings);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch {
      setSettings(defaultSettings);
    }
  }, []);

  const updateSetting = (key: keyof CustomerSettingsState, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    setLastSavedAt(new Date().toISOString());
    toast.success('Preference saved');
  };

  const resetDefaults = () => {
    setSettings(defaultSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    setLastSavedAt(new Date().toISOString());
    toast.success('Settings reset to default');
  };

  const enabledCount = useMemo(() => Object.values(settings).filter(Boolean).length, [settings]);

  const sections = [
    {
      title: 'Alerts & Updates',
      icon: Bell,
      items: [
        ['liveNotifications', 'Live request notifications', 'Assignment, arrival, service and payment updates'],
        ['marketingNotifications', 'Offers and membership updates', 'Promotions, renewal reminders and launch updates']
      ] as Array<[keyof CustomerSettingsState, string, string]>
    },
    {
      title: 'Location & Dispatch',
      icon: MapPin,
      items: [
        ['autoLocationPrompt', 'Prompt for GPS on request start', 'Helps reduce typing during request creation'],
        ['trustedPartnerPreference', 'Prefer trusted-partner discovery', 'Keeps trusted supply visible in your customer journey']
      ] as Array<[keyof CustomerSettingsState, string, string]>
    },
    {
      title: 'Safety',
      icon: Shield,
      items: [
        ['emergencySharingReminder', 'Show emergency sharing reminder', 'Encourages location sharing during critical roadside incidents']
      ] as Array<[keyof CustomerSettingsState, string, string]>
    },
    {
      title: 'Experience',
      icon: MoonStar,
      items: [
        ['darkModeHint', 'Remember theme preference hint', 'Keeps your app experience aligned with light and dark theme usage']
      ] as Array<[keyof CustomerSettingsState, string, string]>
    }
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 pb-24">
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Customer Settings</p>
            <h1 className="mt-2 text-3xl font-black text-foreground">Control your alerts, location prompts, and safety reminders</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              These preferences support the current RoadResQ customer flow today and can later move to backend persistence without changing the UI.
            </p>
          </div>
          <button onClick={resetDefaults} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground">
            <RotateCcw className="h-4 w-4 text-primary" />
            Reset defaults
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Enabled preferences</p>
            <p className="mt-2 text-2xl font-black text-foreground">{enabledCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Storage mode</p>
            <p className="mt-2 text-sm font-bold text-foreground">Local settings active</p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Last saved</p>
            <p className="mt-2 text-sm font-bold text-foreground">{lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString('en-IN') : 'No new changes this session'}</p>
          </div>
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.title} className="rounded-[2rem] border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <section.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">{section.title}</h2>
              <p className="text-sm text-muted-foreground">Customer-side preferences for the current app flow</p>
            </div>
          </div>

          <div className="space-y-3">
            {section.items.map(([key, title, description]) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 px-4 py-4">
                <div>
                  <p className="font-bold text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[key]}
                  onClick={() => updateSetting(key, !settings[key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${settings[key] ? 'bg-primary' : 'bg-secondary'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-[2rem] border border-primary/20 bg-primary/5 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-bold text-foreground">Current scope</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This page now gives a cleaner control surface for customer preferences while keeping your current theme and flow intact.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
