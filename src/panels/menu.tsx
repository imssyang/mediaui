"use client";

import { useState } from "react";
import { Link } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type InputField = {
  value: string;
  type: string;
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
        onChange={onInputChange}
        placeholder="URL"
        className="flex-1"
      />

      <Select
        value={input.type}
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
  const [input, setInput] = useState<InputField>(
    { value: "", type: "text" }
  );

  const handleChange = (value: string) => {
    setInput((prev) => ({ ...prev, value }));
  };

  const handleTypeChange = (newType: string) => {
    setInput({ value: "", type: newType });
  };

  const handleSubmit = () => {
    const urls = input.value
      .split(",")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urls.length === 0) {
      return;
    }

    console.log("提交的 URL 列表:", urls);
    alert(`提交的数据: ${urls.join("\n")}`);
  };

  return (
    <>
      <SelectInput
        id="media-input"
        label="Media:"
        input={input}
        onInputChange={(e: { target: { value: string } }) => handleChange(e.target.value)}
        onSelectChange={(value: string) => handleTypeChange(value)}
      />
      <Button onClick={handleSubmit} size="icon">
        <Link />
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