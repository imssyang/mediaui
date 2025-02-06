"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { MediaMenu } from "./menu";
import { MediaPlayer } from "./player";

function ResizablePane() {
  return (
    <ResizablePanelGroup
      direction="vertical"
      className="rounded-lg md:min-w-[450px]"
    >
      <ResizablePanel defaultSize={100}>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={80}>
            <MediaPlayer connID="1234" />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Three</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function Media() {
  return (
    <>
      <div className="mx-auto p-4 space-y-2">
        <MediaMenu />
      </div>
      <ResizablePane />
    </>
  );
}