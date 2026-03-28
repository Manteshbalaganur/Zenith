import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  complexity?: any;
  onComplexityChange?: (val: any) => void;
}

export function QueryInput({ onSubmit, isLoading, complexity, onComplexityChange }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-center gap-2 bg-card border border-border rounded-xl p-2">
          <Search className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What concept do you want to understand deeply?"
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />

          {complexity && onComplexityChange && (
            <div className="relative shrink-0" ref={dropdownRef}>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 border-l border-border/50 rounded-none h-6 px-3 min-w-[90px] justify-between"
              >
                 {complexity === 'eli5' ? 'ELI5' : complexity === 'expert' ? 'Expert' : 'Standard'}
                 <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </Button>
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-4 w-32 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                  <div className="p-1">
                    <button type="button" onClick={() => { onComplexityChange('eli5'); setIsDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors hover:bg-primary/20 ${complexity === 'eli5' ? 'text-primary font-bold bg-primary/10' : 'text-muted-foreground'}`}>ELI5</button>
                    <button type="button" onClick={() => { onComplexityChange('standard'); setIsDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors hover:bg-primary/20 ${complexity === 'standard' ? 'text-primary font-bold bg-primary/10' : 'text-muted-foreground'}`}>Standard</button>
                    <button type="button" onClick={() => { onComplexityChange('expert'); setIsDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors hover:bg-primary/20 ${complexity === 'expert' ? 'text-primary font-bold bg-primary/10' : 'text-muted-foreground'}`}>Expert</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={!query.trim() || isLoading}
            size="sm"
            className="shrink-0 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-90 gap-1.5 shadow-[0_0_15px_rgba(20,184,166,0.3)] border-none"
          >
            <Sparkles className="w-4 h-4" />
            Explore
          </Button>
        </div>
      </div>
    </form>
  );
}
