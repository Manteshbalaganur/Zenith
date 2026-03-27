import type { Complexity } from "@/types/knowledge";

interface ComplexitySliderProps {
  value: Complexity;
  onChange: (value: Complexity) => void;
}

const levels: { value: Complexity; label: string; desc: string }[] = [
  { value: "eli5", label: "ELI5", desc: "Simple" },
  { value: "standard", label: "Standard", desc: "Balanced" },
  { value: "expert", label: "Expert", desc: "Technical" },
];

export function ComplexitySlider({ value, onChange }: ComplexitySliderProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Complexity</span>
      <div className="flex bg-secondary rounded-lg p-1">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => onChange(level.value)}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-200
              ${value === level.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
}
