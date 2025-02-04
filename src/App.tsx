import { useState } from 'react'
import { GridStackDemo } from "./demo/demo"
import { ReflexDemo } from './demo/reflex'
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import reactLogo from './assets/react.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Button>Button</Button>
      <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>MediaUI</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div id="videos"></div>
      <div id="logs"></div>

      <h1>Gridstack React Wrapper Demo</h1>
      <h3>(Uncontrolled)</h3>
      <ReflexDemo />
      <GridStackDemo />
    </ThemeProvider>
  )
}

export default App
