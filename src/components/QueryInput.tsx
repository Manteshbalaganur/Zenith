import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

export function QueryInput({ onSubmit, isLoading }: QueryInputProps) {
  const [query, setQuery] = useState("");

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
          <Button
            type="submit"
            disabled={!query.trim() || isLoading}
            size="sm"
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Explore
          </Button>
        </div>
      </div>
    </form>
  );
}
