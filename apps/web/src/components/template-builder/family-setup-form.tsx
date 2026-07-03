"use client";

import { AppButton } from "@/components/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FamilySetupFormProps {
  familyName: string;
  familySize: 1 | 3 | 5;
  onFamilyNameChange: (name: string) => void;
  onFamilySizeChange: (size: 1 | 3 | 5) => void;
  onContinue: () => void;
  onCancel: () => void;
}

export function FamilySetupForm({
  familyName,
  familySize,
  onFamilyNameChange,
  onFamilySizeChange,
  onContinue,
  onCancel,
}: FamilySetupFormProps) {
  return (
    <div
      data-testid="family-setup-form"
      className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-slate-900">New template family</h2>
      <p className="mt-1 text-xs text-slate-500">
        Choose a name and how many emails belong in this sequence.
      </p>

      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="family-name">Family name</Label>
          <Input
            id="family-name"
            data-testid="family-name-input"
            value={familyName}
            placeholder='e.g. Cold Outreach — SaaS Founders'
            onChange={(event) => onFamilyNameChange(event.target.value)}
            className="focus-visible:ring-emerald-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="family-size">Family size</Label>
          <Select
            value={String(familySize)}
            onValueChange={(next) =>
              next && onFamilySizeChange(Number(next) as 1 | 3 | 5)
            }
          >
            <SelectTrigger
              id="family-size"
              data-testid="family-size-select"
              className="w-full focus-visible:ring-emerald-500"
            >
              <SelectValue placeholder="Select steps…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1" data-testid="family-size-1">
                1 step (single touch)
              </SelectItem>
              <SelectItem value="3" data-testid="family-size-3">
                3 steps
              </SelectItem>
              <SelectItem value="5" data-testid="family-size-5">
                5 steps
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <AppButton variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          data-testid="family-setup-continue"
          disabled={!familyName.trim()}
          onClick={onContinue}
        >
          Continue
        </AppButton>
      </div>
    </div>
  );
}
