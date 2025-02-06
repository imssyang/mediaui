"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Link, Plus, X } from "lucide-react";

type InputField = {
  value: string;
  type: string;
};

type SelectInputProps = {
  input: InputField;
  onInputChange: (e: { target: { value: string } }) => void;
  onSelectChange: (value: string) => void;
};

const SelectInput: React.FC<SelectInputProps> = ({
  input,
  onInputChange,
  onSelectChange,
}) => {
  return (
    <>
      <Input
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

export function DynamicInput() {
  const [inputs, setInputs] = useState<InputField[]>([
    { value: "", type: "text" },
  ]);

  const handleAddInput = () => {
    setInputs([...inputs, { value: "", type: "text" }]);
  };

  const handleRemoveInput = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, value: string) => {
    const updatedInputs = [...inputs];
    updatedInputs[index].value = value;
    setInputs(updatedInputs);
  };

  const handleTypeChange = (index: number, newType: string) => {
    const updatedInputs = [...inputs];
    updatedInputs[index].type = newType;
    updatedInputs[index].value = "";
    setInputs(updatedInputs);
  };

  const handleSubmit = () => {
    console.log("Submitted Data:", inputs);
    alert(`提交的数据: ${inputs.map((input) => input.value).join(", ")}`);
  };

  return (
    <>
      <div id="dynamic-inputs" className="flex items-center gap-2">
        <Label htmlFor="dynamic-inputs">Media:</Label>
        <SelectInput
          input={inputs[0]}
          onInputChange={(e: { target: { value: string; }; }) => handleChange(0, e.target.value)}
          onSelectChange={(value) => handleTypeChange(0, value)}
        />
        <Button onClick={handleAddInput} variant="outline" size="icon">
          <Plus />
        </Button>
        <Button onClick={handleSubmit} size="icon">
          <Link />
        </Button>
      </div>

      {inputs.slice(1).map((input, index) => (
        <div key={index + 1} className="flex items-center gap-2">
          <SelectInput
            input={input}
            onInputChange={(e) => handleChange(index + 1, e.target.value)}
            onSelectChange={(value) => handleTypeChange(index + 1, value)}
          />

          <Button
            variant="destructive"
            size="icon"
            onClick={() => handleRemoveInput(index + 1)}
          >
            <X />
          </Button>
        </div>
      ))}
    </>
  );
}