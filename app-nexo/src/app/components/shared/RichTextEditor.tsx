import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extension-placeholder";
import { useState, useEffect } from "react";
import { cn } from "../ui/utils";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  FileCode,
  Minus,
  Undo2,
  Redo2,
  AlignLeft,
  Braces,
  Type,
  Table as TableIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditorMode = "rich" | "plain" | "html" | "json";

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  className?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={cn(
        "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-100 shrink-0",
        active
          ? "bg-violet-500/20 text-violet-400 border border-violet-500/40"
          : "text-muted-foreground/70 hover:text-foreground hover:bg-muted",
        disabled && "opacity-25 pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

function ToolSep() {
  return <div className="w-px h-4 bg-border/60 mx-0.5 shrink-0" />;
}

// ─── Editor CSS ───────────────────────────────────────────────────────────────

const EDITOR_CSS = `
.cerebrin-editor .ProseMirror {
  outline: none;
  min-height: 120px;
  padding: 12px 16px;
  font-size: 0.875rem;
  line-height: 1.65;
  caret-color: rgb(139, 92, 246);
}
.cerebrin-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: rgba(148, 163, 184, 0.3);
  pointer-events: none;
  height: 0;
}
.cerebrin-editor .ProseMirror > * + * { margin-top: 0.45em; }
.cerebrin-editor .ProseMirror h1 { font-size: 1.35em; font-weight: 700; line-height: 1.3; margin-top: 0.75em; }
.cerebrin-editor .ProseMirror h2 { font-size: 1.15em; font-weight: 600; line-height: 1.3; margin-top: 0.65em; }
.cerebrin-editor .ProseMirror h3 { font-size: 1.0em; font-weight: 600; line-height: 1.3; margin-top: 0.55em; }
.cerebrin-editor .ProseMirror ul { list-style-type: disc; padding-left: 1.4em; }
.cerebrin-editor .ProseMirror ol { list-style-type: decimal; padding-left: 1.4em; }
.cerebrin-editor .ProseMirror li + li { margin-top: 0.1em; }
.cerebrin-editor .ProseMirror blockquote {
  border-left: 3px solid rgba(139, 92, 246, 0.45);
  padding-left: 1em;
  margin-left: 0;
  color: rgba(148, 163, 184, 0.75);
  font-style: italic;
}
.cerebrin-editor .ProseMirror code {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.5);
  padding: 0.1em 0.35em;
  border-radius: 4px;
  font-family: 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
  font-size: 0.82em;
  color: rgb(110, 231, 183);
}
.cerebrin-editor .ProseMirror pre {
  background: rgba(9, 14, 23, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.45);
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
}
.cerebrin-editor .ProseMirror pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.82em;
  color: rgb(110, 231, 183);
}
.cerebrin-editor .ProseMirror hr {
  border: none;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  margin: 0.85em 0;
}
.cerebrin-editor .ProseMirror table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.6em 0;
  font-size: 0.8125rem;
}
.cerebrin-editor .ProseMirror th,
.cerebrin-editor .ProseMirror td {
  border: 1px solid rgba(51, 65, 85, 0.65);
  padding: 5px 10px;
  text-align: left;
  vertical-align: top;
  position: relative;
}
.cerebrin-editor .ProseMirror th {
  background: rgba(30, 41, 59, 0.75);
  font-weight: 600;
}
.cerebrin-editor .ProseMirror .selectedCell::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(139, 92, 246, 0.12);
  pointer-events: none;
  z-index: 2;
}
.cerebrin-editor .ProseMirror .column-resize-handle {
  position: absolute;
  right: -2px;
  top: 0; bottom: 0;
  width: 4px;
  background: rgba(139, 92, 246, 0.45);
  pointer-events: none;
}
`;

// ─── RichTextEditor ───────────────────────────────────────────────────────────

export function RichTextEditor({
  initialContent = "",
  placeholder = "Add a description…",
  onChange,
  className,
}: RichTextEditorProps) {
  const [mode, setMode] = useState<EditorMode>("rich");
  const [rawHtml, setRawHtml] = useState(initialContent);
  const [rawJson, setRawJson] = useState("");
  const [plainText, setPlainText] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: initialContent || "<p></p>",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sync rawJson when editor changes (for JSON view)
  useEffect(() => {
    if (!editor) return;
    const updateJson = () => {
      setRawJson(JSON.stringify(editor.getJSON(), null, 2));
    };
    editor.on("update", updateJson);
    return () => { editor.off("update", updateJson); };
  }, [editor]);

  const switchMode = (next: EditorMode) => {
    if (!editor) return;
    // Snapshot current state when leaving Rich mode
    if (mode === "rich") {
      setRawHtml(editor.getHTML());
      setRawJson(JSON.stringify(editor.getJSON(), null, 2));
      setPlainText(editor.getText("\n"));
    }
    setMode(next);
  };

  const applyHtml = () => {
    if (!editor || !rawHtml.trim()) return;
    editor.commands.setContent(rawHtml, true);
    setMode("rich");
  };

  const applyPlain = () => {
    if (!editor) return;
    const html = plainText
      .split("\n")
      .map((line) => `<p>${line || "<br/>"}</p>`)
      .join("");
    editor.commands.setContent(html, true);
    setMode("rich");
  };

  const MODES: { id: EditorMode; label: string; Icon: React.ElementType }[] = [
    { id: "rich", label: "Rich", Icon: Type },
    { id: "plain", label: "Plain", Icon: AlignLeft },
    { id: "html", label: "HTML", Icon: FileCode },
    { id: "json", label: "JSON", Icon: Braces },
  ];

  const isTableActive = editor?.isActive("table") ?? false;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <style>{EDITOR_CSS}</style>

      {/* ── Mode tabs + action button ───────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/40 border border-border/50">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchMode(id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all duration-150",
                mode === id
                  ? "bg-background border border-border/80 text-foreground shadow-sm"
                  : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
              style={{ fontWeight: mode === id ? 500 : 400 }}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {mode === "html" && (
          <button
            type="button"
            onClick={applyHtml}
            className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors"
          >
            Apply HTML →
          </button>
        )}
        {mode === "plain" && (
          <button
            type="button"
            onClick={applyPlain}
            className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-colors"
          >
            Apply →
          </button>
        )}
      </div>

      {/* ── Rich toolbar ────────────────────────────────────────────────────── */}
      {mode === "rich" && editor && (
        <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 rounded-lg bg-muted/30 border border-border/50">
          {/* History */}
          <ToolBtn
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolSep />

          {/* Inline format */}
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            title="Inline code"
          >
            <Code className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolSep />

          {/* Headings */}
          {([1, 2, 3] as const).map((level) => (
            <ToolBtn
              key={level}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level }).run()
              }
              active={editor.isActive("heading", { level })}
              title={`Heading ${level}`}
            >
              <span style={{ fontSize: "10px", fontWeight: 700, lineHeight: 1 }}>
                H{level}
              </span>
            </ToolBtn>
          ))}
          <ToolSep />

          {/* Lists */}
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Ordered list"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolSep />

          {/* Blocks */}
          <ToolBtn
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code block"
          >
            <FileCode className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <span style={{ fontSize: "14px", lineHeight: 1, fontFamily: "Georgia, serif" }}>"</span>
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider"
          >
            <Minus className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolSep />

          {/* Table */}
          <ToolBtn
            onClick={() =>
              isTableActive
                ? editor.chain().focus().deleteTable().run()
                : editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
            }
            active={isTableActive}
            title={isTableActive ? "Delete table" : "Insert table (3×3)"}
          >
            <TableIcon className="w-3.5 h-3.5" />
          </ToolBtn>

          {isTableActive && (
            <div className="contents">
              <ToolBtn
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Add row below"
              >
                <span style={{ fontSize: "9px", fontWeight: 600 }}>+R</span>
              </ToolBtn>
              <ToolBtn
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Add column right"
              >
                <span style={{ fontSize: "9px", fontWeight: 600 }}>+C</span>
              </ToolBtn>
              <ToolBtn
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="Delete row"
              >
                <span style={{ fontSize: "9px", fontWeight: 600, color: "rgb(248,113,113)" }}>−R</span>
              </ToolBtn>
              <ToolBtn
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="Delete column"
              >
                <span style={{ fontSize: "9px", fontWeight: 600, color: "rgb(248,113,113)" }}>−C</span>
              </ToolBtn>
            </div>
          )}
        </div>
      )}

      {/* ── Editor content area ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "rounded-xl border overflow-hidden transition-colors",
          mode === "rich"
            ? "border-border/50 hover:border-border focus-within:border-violet-500/40"
            : mode === "html"
            ? "border-emerald-500/20 bg-[#060d18]"
            : mode === "json"
            ? "border-blue-500/20 bg-[#060d18]"
            : "border-border/50"
        )}
      >
        {/* Rich */}
        {mode === "rich" && editor && (
          <div
            className="cerebrin-editor overflow-y-auto"
            style={{ maxHeight: 220 }}
          >
            <EditorContent editor={editor} />
          </div>
        )}

        {/* Plain */}
        {mode === "plain" && (
          <textarea
            value={plainText}
            onChange={(e) => setPlainText(e.target.value)}
            placeholder={placeholder}
            spellCheck
            className="w-full bg-transparent px-4 py-3 text-sm text-foreground/85 placeholder:text-muted-foreground/30 outline-none resize-none leading-relaxed"
            style={{ minHeight: 120 }}
          />
        )}

        {/* HTML */}
        {mode === "html" && (
          <textarea
            value={rawHtml}
            onChange={(e) => setRawHtml(e.target.value)}
            spellCheck={false}
            placeholder="<p>Paste or edit HTML here, then click Apply HTML…</p>"
            className="w-full bg-transparent px-4 py-3 font-mono text-xs leading-relaxed outline-none resize-none"
            style={{ minHeight: 120, color: "rgb(110, 231, 183)" }}
          />
        )}

        {/* JSON */}
        {mode === "json" && (
          <textarea
            value={rawJson}
            readOnly
            spellCheck={false}
            className="w-full bg-transparent px-4 py-3 font-mono text-xs leading-relaxed outline-none resize-none cursor-default select-all"
            style={{ minHeight: 120, color: "rgb(147, 197, 253)" }}
          />
        )}
      </div>

      {/* ── Hint line ───────────────────────────────────────────────────────── */}
      <p className="text-[10px] text-muted-foreground/30 text-right leading-none">
        {mode === "rich" && "WYSIWYG · Ctrl+B bold · Ctrl+I italic · markdown shortcuts supported"}
        {mode === "plain" && "Plain text · click Apply → to push to Rich editor"}
        {mode === "html" && "HTML source · edit and click Apply HTML → to update"}
        {mode === "json" && "TipTap document JSON · read-only snapshot"}
      </p>
    </div>
  );
}