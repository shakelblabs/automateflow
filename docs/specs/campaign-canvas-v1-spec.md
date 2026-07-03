# Campaign Canvas Builder — V1 Spec

**Status:** Implemented (UI prototype)  
**Stack:** Next.js 16, React 19, `@xyflow/react`, Tailwind CSS 4, shadcn/ui

## Overview

Campaign Canvas Builder is a visual workflow editor for sales automation campaigns. Users compose outbound sequences by connecting workflow steps on a canvas — triggers, actions, logic, enrichment, and AI steps — and configure each step in a side panel.

V1 is a **front-end prototype**: canvas editing, node configuration, and header actions work in the browser. Save, test run, and publish show toast feedback only; there is no backend persistence or execution engine yet.

## Goals (V1)

- Three-column builder layout: palette, canvas, config panel
- Drag-and-drop and click-to-add nodes from a categorized palette
- Connect nodes with animated edges on a React Flow canvas
- Select a node to edit its settings in the right panel
- Editable campaign name and draft status in the header
- Starter workflow pre-loaded on first load
- Consistent emerald/slate design system aligned with sales-automation tooling

## Non-Goals (V1)

- Backend API, database, or auth
- Real campaign execution, scheduling, or email sending
- Workflow validation (cycles, missing triggers, branch completeness)
- Undo/redo, copy/paste, or multi-select
- Template picker UI (templates are defined in code only)
- Mobile layout

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header: logo, campaign name, Draft badge, Test/Save/Publish │
├──────────┬──────────────────────────────┬─────────────────┤
│ Palette  │ Canvas (React Flow)          │ Config panel    │
│ 280px    │ flex-1                       │ 340px           │
│          │                              │                 │
│ Search   │ Dotted background            │ Empty state or  │
│ Categories│ Nodes + edges               │ step settings   │
│ Draggable│ Controls + minimap           │                 │
│ items    │                              │                 │
└──────────┴──────────────────────────────┴─────────────────┘
```

### Header (`CampaignHeader`)

- Inline-editable campaign name (default: "Q2 Outbound Sequence")
- Actions: **Test run**, **Save**, **Publish** — each fires a Sonner toast
- Draft badge (static in V1)

### Left palette (`NodePalette`)

- Fixed width 280px, scrollable categories
- Search filters nodes by label and description
- Each item: drag (HTML DnD + `application/reactflow` MIME) or click to add

### Center canvas (`WorkflowCanvas`)

- React Flow with dot background, zoom controls, minimap
- Drop zone for palette drags; `screenToFlowPosition` for placement
- Click node → select; click pane → deselect
- Imperative handle exposed to parent: `addNode`, `updateNodeConfig`, `clearSelection`

### Right panel (`NodeConfigPanel`)

- Empty state when no node selected
- Renders fields from node definition (`text`, `textarea`, `number`, `select`, `toggle`)
- Live preview snippet for actions and wait steps
- Close button clears canvas selection

## Node System

All node types are declared in `src/lib/node-definitions.ts`. This file is the **single source of truth** for palette items, canvas appearance, and config fields.

### Categories

| Category     | Purpose                                      | Accent                         |
|-------------|-----------------------------------------------|--------------------------------|
| `triggers`  | Start or resume when an event occurs          | Emerald left border, green icon |
| `actions`   | Outreach steps (email, LinkedIn)              | Slate left border              |
| `logic`     | Delays, branching, A/B splits                 | Slate left border              |
| `enrichment`| Data quality and lead intelligence            | Slate left border              |
| `ai`        | AI personalization and research               | Emerald accent, tinted bg      |

### Node definition shape

```ts
interface NodeDefinition {
  type: string;           // unique id, e.g. "action-send-email"
  label: string;
  description: string;
  category: NodeCategory;
  icon: LucideIcon;
  accentClass: string;    // Tailwind border-l-* class
  fields: NodeField[];
  hasInput?: boolean;     // default true; triggers set false
  hasOutput?: boolean;    // default true
  outputs?: number;       // 2 for branch nodes (yes/no handles)
}
```

### V1 node inventory

**Triggers:** New Lead Added, Email Replied, Email Opened, Link Clicked  
**Actions:** Send Email, Send Follow-up, LinkedIn Message  
**Logic:** Wait / Delay, If / Else Branch, A/B Split Test  
**Enrichment:** Enrich Lead Data, Verify Email, Find Decision Maker  
**AI:** AI Personalize Email, AI Research Company

### Canvas node data

```ts
interface WorkflowNodeData {
  nodeType: string;   // maps to NodeDefinition.type
  label: string;
  config: Record<string, string | number | boolean | undefined>;
}
```

Branch nodes (`logic-condition`, `logic-ab-split`) render two source handles (`yes` / `no`) at 30% and 70% width.

### Default workflow

On load, the canvas shows a 5-step cold outbound chain:

1. New Lead Added → 2. Enrich Lead Data → 3. AI Personalize Email → 4. Send Email → 5. Wait / Delay

Edges use emerald stroke (`#059669`), animated.

## State Architecture

`CampaignBuilder` owns:

- `campaignName`
- `selectedNode` (synced with canvas selection)
- `canvasRef` for imperative canvas updates

Config changes flow: **ConfigPanel → CampaignBuilder → WorkflowCanvas.updateNodeConfig**

Selection uses `SelectedNodeProvider` context so `WorkflowNode` can highlight the active node without prop drilling through React Flow.

## Design System

### Colors

- Primary action: emerald-600 (`#059669`)
- Text: slate-900 / slate-500
- Borders: slate-200
- Canvas background: slate-50
- Focus rings: emerald-500

### Components

- Use `AppButton` (not shadcn `Button`) for app chrome — variants: `primary`, `secondary`, `ghost`, `dark`
- shadcn/ui for form controls: `Input`, `Select`, `Textarea`, `Label`, `Badge`, `ScrollArea`
- Border radius: `0.625rem` (10px) throughout

### Merge fields

Email and message fields support `{{first_name}}`, `{{company}}`, etc. as placeholder text only (no runtime substitution in V1).

## File Map

```
src/
├── app/
│   ├── page.tsx              # Renders CampaignBuilder
│   ├── layout.tsx
│   └── globals.css           # Design tokens
├── components/
│   ├── app-button.tsx
│   ├── campaign/
│   │   ├── campaign-builder.tsx    # Root orchestrator
│   │   ├── campaign-header.tsx
│   │   ├── node-palette.tsx
│   │   ├── node-config-panel.tsx
│   │   ├── workflow-canvas.tsx
│   │   ├── workflow-node.tsx
│   │   └── selected-node-context.tsx
│   └── ui/                   # shadcn primitives
└── lib/
    ├── node-definitions.ts   # Node catalog + helpers
    └── utils.ts
```

## Campaign templates (code-only)

Defined in `CAMPAIGN_TEMPLATES` for future use:

- Cold Outbound Sequence
- Inbound Lead Nurture
- Re-engagement Campaign

## V2 Considerations

- Persist workflow JSON to API
- Validation rules before publish
- Template gallery on empty canvas
- Branch edge labels and handle IDs wired to execution
- Keyboard shortcuts (delete node, undo)
- Real test-run simulation with sample lead data
