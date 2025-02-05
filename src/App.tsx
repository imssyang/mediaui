import { useState } from 'react'
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { MediaMenu } from './media/menu'
import { Demo } from '@/demo/demo'
import reactLogo from './assets/react.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ModeToggle />
      <MediaMenu />
      <img src={reactLogo} className="logo react" alt="React logo" />
      <h1>MediaUI</h1>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
      <div id="videos"></div>
      <div id="logs"></div>
      <Demo />
    </ThemeProvider>
  )
}

export default App
