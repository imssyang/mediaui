"use client";

import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MediaPlayer } from "./player";

export function LayoutPanel() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="rounded-lg md:min-w-[450px]"
    >
      <ResizablePanel>
        <MediaPlayer />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
