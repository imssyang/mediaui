import { ThemeProvider } from "@/components/theme-provider"
import { MenuPanel } from './panels/menu'
import { LayoutPanel } from './panels/layout'
import { Demo } from '@/demo/demo'
import './App.css'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="mx-auto p-4 space-y-2">
        <MenuPanel />
      </div>
      <LayoutPanel />
      <Demo />
    </ThemeProvider>
  )
}

export default App
