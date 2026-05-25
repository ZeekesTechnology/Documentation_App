import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Image,
  Indent,
  Italic,
  Link,
  List,
  ListOrdered,
  Outdent,
  Quote,
  Redo,
  Strikethrough,
  Table,
  Underline,
  Undo,
} from "lucide-react";
import type { ReactNode } from "react";

function ToolbarButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="rounded p-1.5 text-gray-300 hover:bg-vault-surface hover:text-white"
    >
      {children}
    </button>
  );
}

export function RichTextToolbar({
  onCommand,
}: {
  onCommand: (command: string, value?: string) => void;
}) {
  const run = (command: string, value?: string) => onCommand(command, value);

  return (
    <div className="flex flex-wrap items-center gap-0.5 border border-vault-border bg-vault-panel px-2 py-1.5">
      <select
        className="mr-1 rounded border border-vault-border bg-vault-bg px-2 py-1 text-xs text-gray-300"
        defaultValue="p"
        onChange={(e) => run("formatBlock", e.target.value)}
      >
        <option value="p">Style</option>
        <option value="h3">Heading</option>
        <option value="p">Paragraph</option>
      </select>

      <ToolbarButton title="Bold" onClick={() => run("bold")}>
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Italic" onClick={() => run("italic")}>
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Underline" onClick={() => run("underline")}>
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" onClick={() => run("strikeThrough")}>
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-vault-border" />

      <ToolbarButton title="Text color" onClick={() => run("foreColor", "#111827")}>
        <span className="text-xs font-bold underline">A</span>
      </ToolbarButton>
      <ToolbarButton title="Highlight" onClick={() => run("hiliteColor", "#fef08a")}>
        <span className="rounded bg-yellow-200 px-1 text-xs font-bold text-gray-900">
          A
        </span>
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-vault-border" />

      <ToolbarButton title="Bulleted list" onClick={() => run("insertUnorderedList")}>
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Numbered list" onClick={() => run("insertOrderedList")}>
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Blockquote" onClick={() => run("formatBlock", "blockquote")}>
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Decrease indent" onClick={() => run("outdent")}>
        <Outdent className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Increase indent" onClick={() => run("indent")}>
        <Indent className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-vault-border" />

      <ToolbarButton title="Align left" onClick={() => run("justifyLeft")}>
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Align center" onClick={() => run("justifyCenter")}>
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Align right" onClick={() => run("justifyRight")}>
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Justify" onClick={() => run("justifyFull")}>
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-vault-border" />

      <ToolbarButton title="Undo" onClick={() => run("undo")}>
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => run("redo")}>
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-vault-border" />

      <ToolbarButton
        title="Insert link"
        onClick={() => {
          const url = window.prompt("Link URL:");
          if (url) run("createLink", url);
        }}
      >
        <Link className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Insert table" onClick={() => run("insertHTML", "<table border='1'><tr><td>&nbsp;</td></tr></table>")}>
        <Table className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Insert image"
        onClick={() => {
          const url = window.prompt("Image URL:");
          if (url) run("insertImage", url);
        }}
      >
        <Image className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
