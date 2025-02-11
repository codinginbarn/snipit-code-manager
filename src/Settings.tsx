import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug, Palette, Clipboard, Container, FolderOpen, Library, Folder } from "lucide-react";
import { loadSettings, saveSettings } from "@/db/db";
import { invoke } from "@tauri-apps/api/tauri";
import { dialog } from "@tauri-apps/api";
import { path as tauriPath } from "@tauri-apps/api";
import { useToast } from "@/hooks/use-toast"; // Import ShadCN's toast

const settingsOptions = [
  { name: "Themes", icon: <Palette className="w-4 h-4" /> },
  { name: "Connections", icon: <Plug className="w-4 h-4" /> },
  { name: "Collections", icon: <Container className="w-4 h-4" /> },
  { name: "About", icon: <Library className="w-4 h-4" /> },
  { name: "Test", icon: <Clipboard className="w-4 h-4" /> },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("Themes");
  const [settings, setSettings] = useState<{ os: string; firstStartup: string; collectionPath: string } | null>(null);
  const [appDirectory, setAppDirectory] = useState<string>("");
  const { toast } = useToast(); // ShadCN's toast hook

  useEffect(() => {
    (async () => {
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);
      setAppDirectory(await tauriPath.appDataDir());
    })();
  }, []);

  const handleFolderOpen = async (path: string) => {
    try {
      await invoke("open_folder", { path });
      toast({
        title: "Success",
        description: "Folder opened successfully.",
      });
    } catch (error) {
      console.error("Failed to open folder:", error);
      toast({
        title: "Error",
        description: "Failed to open folder.",
        variant: "destructive",
      });
    }
  };

  const handleChangeCollectionPath = async () => {
    try {
      const selected = await dialog.open({ directory: true });
      if (selected && typeof selected === "string" && settings) {
        const updatedSettings = { ...settings, collectionPath: selected };
        await saveSettings(updatedSettings);
        setSettings(updatedSettings);
        toast({
          title: "Collection Updated",
          description: "Collection path has been changed successfully.",
        });
      }
    } catch (error) {
      console.error("Failed to change collection path:", error);
      toast({
        title: "Error",
        description: "Failed to update collection path.",
        variant: "destructive",
      });
    }
  };

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value);
    toast({
      title: "Theme Updated",
      description: `Theme has been changed to ${value}.`,
    });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "Themes":
        return (
          <Section title="Themes" description="Customize your theme and appearance settings.">
            <Select value={theme} onValueChange={(value) => handleThemeChange(value as "light" | "dark" | "system")}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">☀️ Light</SelectItem>
                <SelectItem value="dark">🌙 Dark</SelectItem>
                <SelectItem value="system">🖥 System</SelectItem>
              </SelectContent>
            </Select>
          </Section>
        );
      case "Connections":
        return <Section title="Connections" description="Manage API integrations, database connections, and more." />;
      case "Collections":
        return (
          <Section title="Collections" description="Select a folder to store your collections.">
            <div className="flex items-center space-x-2 w-96">
              <Button variant="outline" onClick={handleChangeCollectionPath}>
                <FolderOpen className="w-4 h-4 mr-1" /> Choose Folder
              </Button>
              <Input type="text" className="flex-1" placeholder="No folder selected" value={settings?.collectionPath || ""} readOnly />
            </div>
          </Section>
        );
      case "About":
        return (
          <Section title="About" description="Information about the app and your device.">
            {settings ? (
              <div className="space-y-2 w-96">
                <p><strong>OS:</strong> {settings.os}</p>
                <p><strong>First Startup:</strong> {new Date(settings.firstStartup).toLocaleString()}</p>
                <DirectoryInfo label="Collection Directory" path={settings.collectionPath} onOpen={handleFolderOpen} />
                <DirectoryInfo label="App Directory" path={appDirectory} onOpen={handleFolderOpen} />
              </div>
            ) : (
              <p>Loading settings information...</p>
            )}
          </Section>
        );
      case "Test":
        return <Section title="Test" description="Basically a boilerplate for me." />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      <aside className="w-64 p-4 border-r">
        <h2 className="text-lg font-bold mb-4">Settings</h2>
        <div className="space-y-2">
          {settingsOptions.map(({ name, icon }) => (
            <Button key={name} variant={activeSection === name ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setActiveSection(name)}>
              {icon}
              <span className="ml-2">{name}</span>
            </Button>
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6">{renderSection()}</main>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mb-4">{description}</p>
      {children}
    </div>
  );
}

function DirectoryInfo({ label, path, onOpen }: { label: string; path: string; onOpen: (path: string) => void }) {
  return (
    <div className="flex items-center space-x-2">
      <p><strong>{label}:</strong> {path}</p>
      <Button size="sm" variant="outline" onClick={() => onOpen(path)}>
        <Folder className="w-4 h-4" />
      </Button>
    </div>
  );
}
