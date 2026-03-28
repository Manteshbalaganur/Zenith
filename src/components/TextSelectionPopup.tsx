import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextSelectionPopupProps {
  onAddConcept: (text: string) => void;
  onExplore: (text: string) => void;
}

export function TextSelectionPopup({ onAddConcept, onExplore }: TextSelectionPopupProps) {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const activeSelection = window.getSelection();
        if (!activeSelection || activeSelection.isCollapsed) {
          setSelection(null);
          return;
        }

        const text = activeSelection.toString().trim();
        // Check word count (we only accept 1-4 words)
        const wordCount = text.split(/\s+/).length;
        if (text && wordCount > 0 && wordCount <= 4 && text.length < 50) {
          const range = activeSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          setSelection({
            text,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        } else {
          setSelection(null);
        }
      }, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // If clicking inside the popup, don't clear the selection
      const popupEl = document.getElementById("text-selection-popup");
      if (popupEl && popupEl.contains(e.target as Node)) {
        return;
      }
      setSelection(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  if (!selection) return null;

  return (
    <div
      id="text-selection-popup"
      className="fixed z-50 animate-in zoom-in-95 duration-200 pointer-events-auto shadow-2xl"
      style={{
        left: Math.max(20, selection.x),
        top: Math.max(20, selection.y),
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="flex items-center gap-1 p-1 bg-popover border border-border/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 hover:bg-primary/20 hover:text-primary text-xs font-medium"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddConcept(selection.text);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add to Concepts
        </Button>
        <div className="w-[1px] h-4 bg-border/50 mx-1"></div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 hover:bg-accent/20 hover:text-accent text-xs font-medium"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onExplore(selection.text);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
        >
          <Search className="w-3.5 h-3.5" />
          Explore Now
        </Button>
      </div>
      <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-popover border-b border-r border-border/50 transform -translate-x-1/2 rotate-45"></div>
    </div>
  );
}
