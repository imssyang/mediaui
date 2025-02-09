import { MenuPanel } from './menu'
import { LayoutPanel } from './layout'
import { StateProvider } from "./state"

function SinglePlayFeature() {
  return (
    <StateProvider>
      <div className="mx-auto p-4 space-y-2">
        <MenuPanel />
      </div>
      <LayoutPanel />
    </StateProvider>
  )
}

export default SinglePlayFeature
