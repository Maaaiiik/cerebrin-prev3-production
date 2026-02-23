import { useState, useRef, useCallback, DragEvent } from "react";
import { cn } from "../ui/utils";
import { useAppPreferences } from "../../contexts/AppPreferences";
import {
  useViewConfig,
  ViewCustomizerTrigger,
  ViewCustomizerPanel,
  type VCField,
} from "../shared/ViewCustomizer";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bot,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileDown,
  FileOutput,
  GripVertical,
  Heading1,
  HardDrive,
  KeyRound,
  Link2,
  List,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Table2,
  Trash2,
  Type,
  X,
} from "lucide-react";

// ─── Toolbox View Config ────────────────────────────────────────────────────────

const STUDIO_FIELDS: VCField[] = [
  { key: "block_heading",    label: "Bloque Heading",         description: "Títulos H1 / H2 / H3 para la plantilla",      category: "esencial",    locked: true    },
  { key: "block_markdown",   label: "Bloque Markdown/Texto",  description: "Contenido enriquecido con formato Markdown",   category: "esencial",    locked: true    },
  { key: "block_ai_table",   label: "Bloque AI Table",        description: "Tabla enlazada a datos de agente IA",          category: "operacional", defaultOn: true  },
  { key: "block_key_value",  label: "Bloque Key-Value",       description: "Pares clave/valor para metadatos",             category: "operacional", defaultOn: false },
  { key: "block_drive_link", label: "Bloque Drive Link",      description: "Enlace externo a Google Drive o Notion",       category: "avanzado",    defaultOn: false },
  { key: "show_ai_binding",  label: "Panel de variables IA",  description: "Sección de bindings {{ agent.data }} en props", category: "operacional", defaultOn: true  },
  { key: "show_templates",   label: "Saved Templates",        description: "Lista de plantillas guardadas en el sidebar",   category: "operacional", defaultOn: true  },
];

// ─── Block Types ────────────────────────────────────────────────────────────────

type BlockType = "heading" | "markdown" | "ai-table" | "key-value" | "drive-link";
type TextAlign = "left" | "center" | "right";

interface CanvasBlock {
  id: string;
  type: BlockType;
  // Heading
  headingText?: string;
  headingLevel?: 1 | 2 | 3;
  align?: TextAlign;
  // Markdown
  markdownText?: string;
  // AI Table
  tableBinding?: string;
  tableColumns?: string[];
  // Key-Value
  kvRows?: { key: string; value: string }[];
  kvBinding?: string;
  // Drive Link
  driveUrl?: string;
  driveLinkLabel?: string;
  // Common
  binding?: string;
}

// ─── Toolbox Block Definitions ──────────────────────────────────────────────────

interface ToolboxItem {
  type: BlockType;
  icon: React.ElementType;
  labelKey: string;
  descKey?: string;
  colorClass: string;
  preview: string;
  vcKey: string;
}

const TOOLBOX_ITEMS: ToolboxItem[] = [
  {
    type: "heading",
    icon: Heading1,
    labelKey: "studio_block_heading",
    colorClass: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    preview: "H1 / H2 / H3 title block",
    vcKey: "block_heading",
  },
  {
    type: "markdown",
    icon: Type,
    labelKey: "studio_block_markdown",
    colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    preview: "Rich text / Markdown content",
    vcKey: "block_markdown",
  },
  {
    type: "ai-table",
    icon: Table2,
    labelKey: "studio_block_table",
    colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    preview: "{{ agent.table_data }}",
    vcKey: "block_ai_table",
  },
  {
    type: "key-value",
    icon: List,
    labelKey: "studio_block_keyval",
    colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    preview: "Label: Value pairs",
    vcKey: "block_key_value",
  },
  {
    type: "drive-link",
    icon: Link2,
    labelKey: "studio_block_drive",
    colorClass: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    preview: "Paste Drive / Notion URL",
    vcKey: "block_drive_link",
  },
];

// ─── Default block factory ───────────────────────────────────────────────────────

function createBlock(type: BlockType, index: number): CanvasBlock {
  const id = `block-${Date.now()}-${index}`;
  switch (type) {
    case "heading":
      return { id, type, headingText: "New Heading", headingLevel: 1, align: "left", binding: "" };
    case "markdown":
      return { id, type, markdownText: "Write your content here. Supports **bold**, _italic_, and more.", align: "left", binding: "" };
    case "ai-table":
      return { id, type, tableBinding: "{{ agent.q1_analysis }}", tableColumns: ["Metric", "Value", "Δ vs Target"], binding: "{{ agent.q1_analysis }}" };
    case "key-value":
      return { id, type, kvRows: [{ key: "Author", value: "Ana García" }, { key: "Date", value: "Feb 2026" }, { key: "Status", value: "Draft" }], kvBinding: "", binding: "" };
    case "drive-link":
      return { id, type, driveUrl: "", driveLinkLabel: "View Source Document", binding: "" };
    default:
      return { id, type };
  }
}

// ─── Initial mock canvas ─────────────────────────────────────────────────────────

const INITIAL_BLOCKS: CanvasBlock[] = [
  {
    id: "mock-heading",
    type: "heading",
    headingText: "Q1 2026 · Executive Summary",
    headingLevel: 1,
    align: "left",
    binding: "",
  },
  {
    id: "mock-markdown",
    type: "markdown",
    markdownText:
      "This document summarises the strategic objectives, KPI performance, and key decisions taken during Q1 2026. It has been generated automatically by **writer-bot** and reviewed by the Strategy team.",
    align: "left",
    binding: "{{ agent.executive_intro }}",
  },
  {
    id: "mock-table",
    type: "ai-table",
    tableBinding: "{{ agent.q1_analysis }}",
    tableColumns: ["KPI", "Target", "Actual", "Status"],
    binding: "{{ agent.q1_analysis }}",
  },
  {
    id: "mock-kv",
    type: "key-value",
    kvRows: [
      { key: "Report Owner", value: "Carlos Mendoza" },
      { key: "Review Cycle", value: "Quarterly" },
      { key: "Last Updated", value: "Feb 20, 2026" },
    ],
    kvBinding: "{{ agent.report_meta }}",
    binding: "{{ agent.report_meta }}",
  },
];

// ─── Canvas Block Renderer ────────────────────────────────────────────────────────

function renderCanvasBlock(
  block: CanvasBlock,
  isSelected: boolean,
  onClick: () => void,
  onDelete: () => void,
  onMoveUp: () => void,
  onMoveDown: () => void,
  t: (k: any) => string,
  isDragging: boolean,
  onDragStart: (e: DragEvent<HTMLDivElement>) => void,
  onDragEnd: () => void,
  dragOverId: string | null,
  onDragOver: (e: DragEvent<HTMLDivElement>) => void,
  onDrop: (e: DragEvent<HTMLDivElement>) => void,
  isDragOver: boolean,
) {
  const baseCard = cn(
    "relative group rounded-xl border transition-all duration-150 cursor-pointer",
    isSelected
      ? "border-violet-500 ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/10"
      : "border-border hover:border-violet-400/40 hover:shadow-md",
    isDragging ? "opacity-40" : "",
    isDragOver ? "ring-2 ring-violet-400/60 border-violet-400" : "",
  );

  const AIBadge = ({ binding }: { binding?: string }) =>
    binding ? (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/25 text-violet-400 text-xs ml-2">
        <Sparkles className="w-2.5 h-2.5" />
        {t("studio_ai_badge")}
      </span>
    ) : null;

  const Controls = () => (
    <div className={cn(
      "absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
      isSelected ? "opacity-100" : ""
    )}>
      <button
        onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
        className="w-6 h-6 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronUp className="w-3 h-3" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="w-6 h-6 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center hover:bg-destructive/20 text-destructive transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
        className="w-6 h-6 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className="w-3 h-3" />
      </button>
    </div>
  );

  const DragHandle = () => (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded"
    >
      <GripVertical className="w-3 h-3 text-muted-foreground/50" />
    </div>
  );

  const DropIndicator = () => isDragOver ? (
    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
  ) : null;

  if (block.type === "heading") {
    const Tag = (`h${block.headingLevel ?? 1}`) as "h1" | "h2" | "h3";
    return (
      <div
        key={block.id}
        className={baseCard}
        onClick={onClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{ paddingLeft: "2rem" }}
      >
        <DropIndicator />
        <DragHandle />
        <div className={cn(
          "px-4 py-3",
          block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left"
        )}>
          <Tag className={cn(
            "text-foreground",
            block.headingLevel === 1 ? "text-2xl" : block.headingLevel === 2 ? "text-xl" : "text-lg"
          )} style={{ fontWeight: 700, lineHeight: 1.3 }}>
            {block.headingText || "Untitled Heading"}
          </Tag>
          {block.binding && <AIBadge binding={block.binding} />}
        </div>
        <Controls />
      </div>
    );
  }

  if (block.type === "markdown") {
    return (
      <div
        key={block.id}
        className={baseCard}
        onClick={onClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{ paddingLeft: "2rem" }}
      >
        <DropIndicator />
        <DragHandle />
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-muted-foreground">Markdown Body</span>
            <AIBadge binding={block.binding} />
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed" style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{
              __html: (block.markdownText ?? "")
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/_(.+?)_/g, "<em>$1</em>"),
            }}
          />
        </div>
        <Controls />
      </div>
    );
  }

  if (block.type === "ai-table") {
    const cols = block.tableColumns ?? ["Col A", "Col B", "Col C"];
    const mockRows = [
      ["Revenue Growth", "15%", "+3.2%", "✅ On Track"],
      ["NPS Score", "72", "68", "⚠️ Below"],
      ["Churn Rate", "< 2%", "1.8%", "✅ On Track"],
    ];
    return (
      <div
        key={block.id}
        className={cn(baseCard, "border-dashed")}
        onClick={onClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{ paddingLeft: "2rem" }}
      >
        <DropIndicator />
        <DragHandle />
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center">
                <Bot className="w-3 h-3 text-violet-400" />
              </div>
              <span className="text-xs text-violet-400" style={{ fontWeight: 600 }}>AI Data Table</span>
              <AIBadge binding={block.binding} />
            </div>
            <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
              {block.tableBinding || "{{ agent.data }}"}
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-dashed border-violet-500/30 bg-violet-500/5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-violet-500/20">
                  {cols.map((col, i) => (
                    <th key={i} className="px-3 py-2 text-left text-violet-300" style={{ fontWeight: 600 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-border/30 hover:bg-violet-500/5 transition-colors">
                    {row.slice(0, cols.length).map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-foreground/70">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground/50 mt-2 text-center italic">
            Live data will populate at generation time
          </p>
        </div>
        <Controls />
      </div>
    );
  }

  if (block.type === "key-value") {
    return (
      <div
        key={block.id}
        className={baseCard}
        onClick={onClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{ paddingLeft: "2rem" }}
      >
        <DropIndicator />
        <DragHandle />
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400" style={{ fontWeight: 600 }}>Key-Value List</span>
            <AIBadge binding={block.binding} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {(block.kvRows ?? []).map((row, i) => (
              <div key={i} className="contents">
                <span className="text-xs text-muted-foreground" style={{ fontWeight: 600 }}>{row.key}</span>
                <span className="text-xs text-foreground/80">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        <Controls />
      </div>
    );
  }

  if (block.type === "drive-link") {
    return (
      <div
        key={block.id}
        className={baseCard}
        onClick={onClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{ paddingLeft: "2rem" }}
      >
        <DropIndicator />
        <DragHandle />
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate" style={{ fontWeight: 600 }}>
                {block.driveLinkLabel || "Drive Link Block"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {block.driveUrl || "No URL configured — set in properties panel"}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground/40 shrink-0" />
          </div>
        </div>
        <Controls />
      </div>
    );
  }

  return null;
}

// ─── Property Panel ─────────────────────────────────────────────────────────────

function PropertyPanel({
  block,
  onChange,
  t,
  showAIBinding = true,
}: {
  block: CanvasBlock | null;
  onChange: (updated: CanvasBlock) => void;
  t: (k: any) => string;
  showAIBinding?: boolean;
}) {
  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center">
          <FileOutput className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{t("studio_no_selection")}</p>
      </div>
    );
  }

  const update = (patch: Partial<CanvasBlock>) => onChange({ ...block, ...patch });

  const InputRow = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 placeholder-muted-foreground/40 transition-colors";

  return (
    <div className="flex flex-col gap-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>{t("studio_properties")}</p>
        <p className="text-xs text-violet-400 mt-0.5 capitalize">
          {block.type.replace("-", " ")} block
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Binding — universal (toggleable via ViewCustomizer) */}
        {showAIBinding && (
          <InputRow label={t("studio_value_binding")}>
            <div className="relative">
              <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-violet-400" />
              <input
                type="text"
                className={cn(inputCls, "pl-7")}
                placeholder={t("studio_binding_ph")}
                value={block.binding ?? ""}
                onChange={(e) => update({ binding: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground/50 mt-1">Maps this block to an AI agent output variable</p>
          </InputRow>
        )}

        {/* Heading-specific */}
        {block.type === "heading" && (
          <div className="contents">
            <InputRow label="Heading Text">
              <input
                type="text"
                className={inputCls}
                value={block.headingText ?? ""}
                onChange={(e) => update({ headingText: e.target.value })}
              />
            </InputRow>
            <InputRow label="Heading Level">
              <div className="flex gap-1">
                {([1, 2, 3] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => update({ headingLevel: lvl })}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg border text-xs transition-colors",
                      block.headingLevel === lvl
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                        : "bg-muted border-border text-muted-foreground hover:border-violet-500/30"
                    )}
                  >
                    H{lvl}
                  </button>
                ))}
              </div>
            </InputRow>
            <InputRow label={t("studio_align_label")}>
              <div className="flex gap-1">
                {(["left", "center", "right"] as TextAlign[]).map((align) => {
                  const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                  return (
                    <button
                      key={align}
                      onClick={() => update({ align })}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg border flex items-center justify-center transition-colors",
                        block.align === align
                          ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                          : "bg-muted border-border text-muted-foreground hover:border-violet-500/30"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            </InputRow>
          </div>
        )}

        {/* Markdown-specific */}
        {block.type === "markdown" && (
          <InputRow label="Content">
            <textarea
              rows={6}
              className={cn(inputCls, "resize-none")}
              value={block.markdownText ?? ""}
              onChange={(e) => update({ markdownText: e.target.value })}
              placeholder="Write Markdown content... **bold**, _italic_"
            />
          </InputRow>
        )}

        {/* AI Table-specific */}
        {block.type === "ai-table" && (
          <div className="contents">
            <InputRow label="Table Data Binding">
              <div className="relative">
                <Bot className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-violet-400" />
                <input
                  type="text"
                  className={cn(inputCls, "pl-7 font-mono")}
                  placeholder="{{ agent.table_variable }}"
                  value={block.tableBinding ?? ""}
                  onChange={(e) => update({ tableBinding: e.target.value, binding: e.target.value })}
                />
              </div>
            </InputRow>
            <InputRow label="Column Headers (comma separated)">
              <input
                type="text"
                className={inputCls}
                placeholder="Col A, Col B, Col C"
                value={(block.tableColumns ?? []).join(", ")}
                onChange={(e) =>
                  update({ tableColumns: e.target.value.split(",").map((s) => s.trim()) })
                }
              />
            </InputRow>
          </div>
        )}

        {/* Key-Value-specific */}
        {block.type === "key-value" && (
          <InputRow label="Key-Value Pairs">
            <div className="space-y-2">
              {(block.kvRows ?? []).map((row, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    className={cn(inputCls, "flex-1")}
                    placeholder={t("studio_col_key")}
                    value={row.key}
                    onChange={(e) => {
                      const rows = [...(block.kvRows ?? [])];
                      rows[i] = { ...rows[i], key: e.target.value };
                      update({ kvRows: rows });
                    }}
                  />
                  <input
                    type="text"
                    className={cn(inputCls, "flex-1")}
                    placeholder={t("studio_col_value")}
                    value={row.value}
                    onChange={(e) => {
                      const rows = [...(block.kvRows ?? [])];
                      rows[i] = { ...rows[i], value: e.target.value };
                      update({ kvRows: rows });
                    }}
                  />
                  <button
                    onClick={() => {
                      const rows = (block.kvRows ?? []).filter((_, ri) => ri !== i);
                      update({ kvRows: rows });
                    }}
                    className="shrink-0 w-6 h-6 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => update({ kvRows: [...(block.kvRows ?? []), { key: "", value: "" }] })}
                className="w-full py-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-violet-500/40 hover:text-violet-400 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> {t("studio_add_row")}
              </button>
            </div>
          </InputRow>
        )}

        {/* Drive Link-specific */}
        {block.type === "drive-link" && (
          <div className="contents">
            <InputRow label={t("studio_drive_url")}>
              <div className="relative">
                <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-sky-400" />
                <input
                  type="url"
                  className={cn(inputCls, "pl-7")}
                  placeholder={t("studio_drive_ph")}
                  value={block.driveUrl ?? ""}
                  onChange={(e) => update({ driveUrl: e.target.value })}
                />
              </div>
            </InputRow>
            <InputRow label="Link Label">
              <input
                type="text"
                className={inputCls}
                placeholder="View Document"
                value={block.driveLinkLabel ?? ""}
                onChange={(e) => update({ driveLinkLabel: e.target.value })}
              />
            </InputRow>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Quick actions */}
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:text-foreground hover:border-violet-500/30 transition-colors flex-1">
            <Copy className="w-3 h-3" /> Duplicate
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive hover:bg-destructive/20 transition-colors flex-1">
            <Trash2 className="w-3 h-3" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Google Drive Icon (SVG) ─────────────────────────────────────────────────────

function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 48H0c0 1.55.4 3.1 1.2 4.5L6.6 66.85z" fill="#0066DA" />
      <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 43.5C.4 44.9 0 46.45 0 48h27.5L43.65 25z" fill="#00AC47" />
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 52.5c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="#EA4335" />
      <path d="M43.65 25L57.4 0H29.9L43.65 25z" fill="#00832D" />
      <path d="M59.8 48H87.3L73.55 24.45 57.4 0 43.65 25 59.8 48z" fill="#2684FC" />
      <path d="M27.5 48L13.75 71.55 27.5 76.8l16.15-28.8L59.8 48H27.5z" fill="#FFBA00" />
    </svg>
  );
}

// ─── Main TemplateStudio Component ───────────────────────────────────────────────

export function TemplateStudio() {
  const { t } = useAppPreferences();

  const [blocks, setBlocks] = useState<CanvasBlock[]>(INITIAL_BLOCKS);
  const [selectedId, setSelectedId] = useState<string | null>("mock-table");
  const [templateName, setTemplateName] = useState("Q1 Executive Summary");
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingCanvasId, setDraggingCanvasId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [vcOpen, setVcOpen] = useState(false);
  const vc = useViewConfig("cerebrin_studio_v1", STUDIO_FIELDS);
  const dragTypeRef = useRef<BlockType | null>(null);
  const dragCanvasIdRef = useRef<string | null>(null);

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  const updateBlock = useCallback((updated: CanvasBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelectedId(null);
  }, []);

  const moveBlock = useCallback((id: string, dir: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  // ── Toolbox drag handlers ──
  const handleToolboxDragStart = (type: BlockType) => {
    dragTypeRef.current = type;
    dragCanvasIdRef.current = null;
  };

  // ── Canvas item drag handlers ──
  const handleCanvasDragStart = (id: string) => {
    dragCanvasIdRef.current = id;
    dragTypeRef.current = null;
    setDraggingCanvasId(id);
  };

  const handleCanvasDragEnd = () => {
    setDraggingCanvasId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    setDragOverId(targetId);
  };

  const handleDropOnBlock = (e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);

    // Reorder if dragging canvas block
    if (dragCanvasIdRef.current && dragCanvasIdRef.current !== targetId) {
      setBlocks((prev) => {
        const fromIdx = prev.findIndex((b) => b.id === dragCanvasIdRef.current);
        const toIdx = prev.findIndex((b) => b.id === targetId);
        if (fromIdx < 0 || toIdx < 0) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        return next;
      });
      dragCanvasIdRef.current = null;
      return;
    }

    // Insert new block from toolbox before target
    if (dragTypeRef.current) {
      const newBlock = createBlock(dragTypeRef.current, Date.now());
      setBlocks((prev) => {
        const toIdx = prev.findIndex((b) => b.id === targetId);
        const next = [...prev];
        next.splice(toIdx, 0, newBlock);
        return next;
      });
      setSelectedId(newBlock.id);
      dragTypeRef.current = null;
    }
  };

  const handleDropOnCanvas = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverId(null);
    if (dragTypeRef.current) {
      const newBlock = createBlock(dragTypeRef.current, Date.now());
      setBlocks((prev) => [...prev, newBlock]);
      setSelectedId(newBlock.id);
      dragTypeRef.current = null;
    }
    dragCanvasIdRef.current = null;
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex h-full overflow-hidden bg-background">

      {/* ═══ Column 1: Toolbox ═══════════════════════════════════════════════ */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-border bg-sidebar overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center">
              <FileOutput className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-sm text-foreground" style={{ fontWeight: 700 }}>{t("studio_title")}</h2>
          </div>
          <p className="text-xs text-muted-foreground ml-7">{t("studio_subtitle")}</p>
        </div>

        {/* Template name */}
        <div className="px-4 py-3 border-b border-border">
          <label className="text-xs text-muted-foreground block mb-1.5">{t("studio_template_name")}</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-muted border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
          />
        </div>

        {/* Toolbox label */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>{t("studio_toolbox")}</p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">{t("studio_toolbox_desc")}</p>
        </div>

        {/* Block items */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 mt-2">
          {TOOLBOX_ITEMS.filter(item => vc.isVisible(item.vcKey)).map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                draggable
                onDragStart={() => handleToolboxDragStart(item.type)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-grab active:cursor-grabbing",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "transition-all duration-150 select-none",
                  item.colorClass
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs" style={{ fontWeight: 600 }}>{t(item.labelKey as any)}</p>
                  <p className="text-xs opacity-60 truncate">{item.preview}</p>
                </div>
                <GripVertical className="w-3.5 h-3.5 shrink-0 opacity-40 ml-auto" />
              </div>
            );
          })}
        </div>

        {/* Templates library hint */}
        {vc.isVisible("show_templates") && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>Saved Templates</p>
          </div>
          {["Executive Summary", "Invoice Template", "Weekly Report"].map((tpl) => (
            <button
              key={tpl}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-0.5"
            >
              {tpl}
            </button>
          ))}
          <button className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-violet-400 hover:bg-violet-500/10 transition-colors flex items-center gap-1 mt-1">
            <Plus className="w-3 h-3" /> {t("studio_new_template")}
          </button>
        </div>
        )}
      </aside>

      {/* ═══ Column 2: Canvas ════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted">
        {/* Canvas Toolbar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground" style={{ fontWeight: 600 }}>{templateName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400">
              {blocks.length} blocks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBlocks(INITIAL_BLOCKS)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted border border-transparent hover:border-border transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
            <ViewCustomizerTrigger onClick={() => setVcOpen(true)} isOpen={vcOpen} />
            <button
              onClick={handleSave}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all duration-200",
                isSaved
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-muted border-border text-muted-foreground hover:border-violet-500/40 hover:text-violet-400"
              )}
            >
              {isSaved ? (
                <span className="contents"><RefreshCw className="w-3 h-3 animate-spin" /> Saved!</span>
              ) : (
                <span className="contents"><Save className="w-3 h-3" /> Save</span>
              )}
            </button>
          </div>
        </div>

        {/* A4 Scroll Area */}
        <div
          className="flex-1 overflow-y-auto"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnCanvas}
        >
          <div className="flex justify-center py-10 px-4 min-h-full">
            {/* A4 Paper */}
            <div
              className="w-full max-w-3xl bg-card shadow-2xl rounded-xl overflow-hidden"
              style={{ minHeight: "297mm" }}
            >
              {/* Paper Header bar */}
              <div className="flex items-center justify-between px-10 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Cerebrin · Output Studio</span>
                </div>
                <span className="text-xs text-muted-foreground/40 font-mono">
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {/* Blocks area */}
              <div className="px-10 py-8 space-y-3">
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center">
                      <Plus className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">{t("studio_drop_zone")}</p>
                  </div>
                ) : (
                  blocks.map((block) => 
                    renderCanvasBlock(
                      block,
                      selectedId === block.id,
                      () => setSelectedId(block.id),
                      () => deleteBlock(block.id),
                      () => moveBlock(block.id, "up"),
                      () => moveBlock(block.id, "down"),
                      t,
                      draggingCanvasId === block.id,
                      (e) => { e.stopPropagation(); handleCanvasDragStart(block.id); },
                      handleCanvasDragEnd,
                      dragOverId,
                      (e) => handleDragOver(e, block.id),
                      (e) => handleDropOnBlock(e, block.id),
                      dragOverId === block.id && draggingCanvasId !== block.id,
                    )
                  )
                )}

                {/* Drop zone at bottom */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-xl border-2 border-dashed py-4 text-xs transition-all duration-200",
                    dragOverId === "bottom-drop"
                      ? "border-violet-500 bg-violet-500/10 text-violet-400"
                      : "border-border/40 text-muted-foreground/30"
                  )}
                  onDragOver={(e) => { e.preventDefault(); setDragOverId("bottom-drop"); }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => {
                    handleDropOnCanvas(e);
                    setDragOverId(null);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> {t("studio_drop_hint")}
                </div>
              </div>

              {/* Paper Footer */}
              <div className="px-10 py-4 border-t border-border/30 flex items-center justify-between">
                <span className="text-xs text-muted-foreground/30 font-mono">{templateName}</span>
                <span className="text-xs text-muted-foreground/30 font-mono">
                  Generated by Cerebrin · AI executes, Humans control
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Column 3: JSON Mapper & Export ══════════════════════════════════ */}
      <aside className="w-72 shrink-0 flex flex-col border-l border-border bg-sidebar overflow-hidden">
        {/* Properties header is inside PropertyPanel */}
        <div className="flex-1 overflow-hidden">
          <PropertyPanel block={selectedBlock} onChange={updateBlock} t={t} showAIBinding={vc.isVisible("show_ai_binding")} />
        </div>

        {/* Export Actions */}
        <div className="p-4 border-t border-border space-y-2.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>Export & Sync</p>

          {/* Google Drive Sync */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98]">
            <GoogleDriveIcon className="w-5 h-5 shrink-0" />
            <div className="text-left flex-1">
              <p className="text-xs" style={{ fontWeight: 600 }}>{t("studio_sync_drive")}</p>
              <p className="text-xs opacity-70">Drive-first · stores URL only</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
          </button>

          {/* Export PDF */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-transparent border border-border hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]">
            <FileDown className="w-4 h-4 shrink-0 text-muted-foreground" />
            <div className="text-left flex-1">
              <p className="text-xs" style={{ fontWeight: 600 }}>{t("studio_export_pdf")}</p>
              <p className="text-xs opacity-50">Render snapshot as PDF</p>
            </div>
          </button>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {[
              { label: "Blocks", value: blocks.length },
              { label: "Mapped", value: blocks.filter((b) => b.binding).length },
              { label: "Pages", value: "~2" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center py-2 rounded-lg bg-muted border border-border">
                <span className="text-sm text-foreground" style={{ fontWeight: 700 }}>{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ViewCustomizer Panel */}
      {vcOpen && (
        <ViewCustomizerPanel
          title="Template Studio"
          subtitle="Configura bloques y paneles visibles en el editor"
          fields={STUDIO_FIELDS}
          config={vc.config}
          onToggleField={vc.toggleField}
          onReset={vc.reset}
          onClose={() => setVcOpen(false)}
        />
      )}
    </div>
  );
}