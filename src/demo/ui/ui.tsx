import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { ButtonDemo } from "./button"
import { CheckboxDemo } from "./checkbox"
import { CollapsibleDemo } from "./collapsible"
import { LabelDemo } from "./label"
import { SwitchDemo } from "./switch"
import { FormDemo } from "./form"

export function UIDemo() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ModeToggle />
      <ButtonDemo />
      <CheckboxDemo />
      <CollapsibleDemo />
      <LabelDemo />
      <SwitchDemo />
      <FormDemo />
    </ThemeProvider>
  )
}

