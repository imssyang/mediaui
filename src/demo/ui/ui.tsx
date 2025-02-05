import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { ButtonDemo } from "@/demo/ui/button"
import { CheckboxDemo } from "@/demo/ui/checkbox"
import { LabelDemo } from "@/demo/ui/label"
import { SwitchDemo } from "@/demo/ui/switch"

export function UIDemo() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ModeToggle />
      <ButtonDemo />
      <CheckboxDemo />
      <LabelDemo />
      <SwitchDemo />
    </ThemeProvider>
  )
}

