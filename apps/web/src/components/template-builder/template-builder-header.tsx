"use client";

export function TemplateBuilderHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-base font-semibold text-slate-900">
          Template Builder
        </h1>
        <p className="text-xs text-slate-500">
          Create and manage email sequences for your campaigns
        </p>
      </div>
    </header>
  );
}
