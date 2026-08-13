import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Label } from "$ui/primitives/Label";
import type { MerchantChoice } from "./affiliate-setup-data";

export function MerchantChoiceSelect({
  label = "Merchant",
  merchantChoices,
  name = "merchantId",
  onSelectedMerchantIdChange,
  selectedMerchantValue,
}: {
  label?: string;
  merchantChoices: readonly MerchantChoice[];
  name?: string;
  onSelectedMerchantIdChange: (merchantId: string) => void;
  selectedMerchantValue: string;
}) {
  const options = merchantChoices.map((merchant) => ({
    label: merchant.name,
    value: merchant.id,
  }));

  return (
    <Label>
      {label}
      <Select
        items={options}
        name={name}
        onValueChange={(value) => onSelectedMerchantIdChange(value ?? "")}
        value={selectedMerchantValue}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
}
