import { useState } from 'react'
import { ThemeProvider } from "@/components/theme-provider"
import { Media } from './panels/media'
import { Demo } from '@/demo/demo'
import reactLogo from './assets/react.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Media />
      <img src={reactLogo} className="logo react" alt="React logo" />
      <h1>MediaUI</h1>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
      <Demo />
    </ThemeProvider>
  )
}

export default App
