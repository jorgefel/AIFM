import { Palette } from "lucide-react";
import { ThemeSelector } from "@/components/ui/ThemeSelector";

export function AppearanceSection() {
  return (
    <div className="pt-6 border-t border-line-soft space-y-4">
      <h4 className="text-ink font-semibold flex items-center gap-2">
        <Palette className="w-5 h-5 text-violet-500" />
        Apariencia
      </h4>
      <ThemeSelector />
    </div>
  );
}
