import { GridStackDemo } from "@/demo/gridstack/gridstack"
import { ReflexDemo } from '@/demo/reflex/reflex'
import { UIDemo } from "@/demo/ui/ui"

export function Demo() {
  return (
    <>
      <GridStackDemo />
      <div style={{ height: "300px" }}>
        <ReflexDemo />
      </div>
      <UIDemo />
    </>
  )
}
