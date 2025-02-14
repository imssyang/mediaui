"use client";

import { useEffect, useState } from "react";
import { Link, Unlink } from "lucide-react";
import { log } from "@/lib/log"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast"
import { useWebRTC } from "@/webrtc/context";
import { useWebRTCState } from "@/webrtc/state";
import { useTask, useTaskDispatch } from "./task";

type InputField = {
  value: string;
  type: string;
  disabled: boolean;
};

type SelectInputProps = {
  id: string;
  label: string;
  input: InputField;
  onInputChange: (e: { target: { value: string } }) => void;
  onSelectChange: (value: string) => void;
};

const SelectInput: React.FC<SelectInputProps> = ({
  id,
  label,
  input,
  onInputChange,
  onSelectChange,
}) => {
  return (
    <>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={input.type}
        value={input.value}
        disabled={input.disabled}
        onChange={onInputChange}
        placeholder="URL"
        className="flex-1"
      />

      <Select
        value={input.type}
        disabled={input.disabled}
        onValueChange={onSelectChange}
      >
        <SelectTrigger className="w-10 flex justify-center items-center">
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="text">URL</SelectItem>
          <SelectItem value="file">File</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}

function MenuInput() {
  const webrtc = useWebRTC();
  const task = useTask();
  const state = useWebRTCState(task.connID);
  const taskDispatch = useTaskDispatch();
  const { toast } = useToast();
  const [input, setInput] = useState<InputField>(
    { value: "", type: "text", disabled: false }
  );

  const createConnection = async (urls: string[]) => {
    const conn = webrtc.createConnection();
    await conn.createOffer(true, true);

    taskDispatch({
      type: 'addConnection',
      connID: conn.connID,
      urls: urls,
    });
    setInput({ ...input, disabled: true });
    log.react('addConnection', conn.connID, urls);
  };

  const closeConnection = async () => {
    webrtc.closeConnection(task.connID);
    taskDispatch({
        type: 'delConnection',
        connID: task.connID,
    });
    setInput({ ...input, disabled: false });
    log.react('delConnection', task.connID);
  };

  const handleChange = (value: string) => {
    setInput((prev) => ({ ...prev, value }));
  };

  const handleTypeChange = (newType: string) => {
    setInput({ ...input, type: newType });
  };

  const handleSubmit = async () => {
    const urls = input.value
      .split(",")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      toast({
        variant: "destructive",
        description: "Empty input.",
      })
      return;
    }

    if (!input.disabled) {
      await createConnection(urls);
    } else {
      if (task.connID.length > 0) {
        await closeConnection();
      }
    }
  };

  useEffect(() => {
    if (["closed", "disconnected", "failed"].includes(state.connState)) {
      closeConnection();
    }
  }, [state])

  return (
    <>
      <SelectInput
        id="media-input"
        label="Media:"
        input={input}
        onInputChange={(e: { target: { value: string } }) => handleChange(e.target.value)}
        onSelectChange={(value: string) => handleTypeChange(value)}
      />
      <Button
        variant={input.disabled ? "outline" : "default"}
        onClick={handleSubmit}
        size="icon"
      >
        {input.disabled ? <Link /> : <Unlink />}
      </Button>
    </>
  );
}

export function MenuPanel() {
  return (
    <div className="flex items-center gap-2">
      <MenuInput />
      <Separator orientation="vertical" className="flex h-8 items-center" />
      <ModeToggle />
    </div>
  );
}