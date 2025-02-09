import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Features from "./features/view"
import { Demo } from '@/demo/demo'
import './App.css'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Toaster />
      <Features />
      <Demo />
    </ThemeProvider>
  )
}

export default App
