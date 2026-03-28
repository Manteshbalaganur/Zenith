import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, Clock, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistorySidebarProps {
  sessionId: string;
  onSelectMap: (id: string) => void;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export function HistorySidebar({ sessionId, onSelectMap, onClose, isEmbedded }: HistorySidebarProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("knowledge_maps")
        .select("id, query, updated_at, map_data")
        .eq("user_id", sessionId)
        .order("updated_at", { ascending: false });
        
      if (!error && data) {
        setHistory(data);
      }
    } catch(e) { console.error(e); }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHistory();
    
    // Realtime listener for this user's maps
    const channel = supabase.channel(`public:knowledge_maps:user_id=eq.${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_maps', filter: `user_id=eq.${sessionId}` }, () => {
         fetchHistory();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const deleteMap = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await (supabase as any).from("knowledge_maps").delete().eq("id", id);
      setHistory(history.filter(h => h.id !== id));
    } catch(e) {}
  };

  const containerClass = isEmbedded 
    ? "flex flex-col h-full w-full" 
    : "fixed inset-y-0 right-0 w-80 bg-background/95 backdrop-blur-xl border-l border-border z-40 flex flex-col shadow-2xl animate-in slide-in-from-right-8";

  return (
    <div className={containerClass}>
      <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0">
        <h2 className="font-semibold flex items-center gap-2 text-sm text-primary uppercase tracking-widest">
          <Clock className="w-4 h-4" />
          Exploration History
        </h2>
        {!isEmbedded && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-primary/20 hover:text-primary transition-colors">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-8 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-10 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
               <Info className="w-8 h-8 text-primary/60" />
            </div>
            <p className="text-foreground font-semibold">No history yet</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Start exploring a concept to build out your knowledge history.
            </p>
          </div>
        ) : (
          history.map((h) => {
            const nodes = h.map_data || [];
            const understoodCount = nodes.filter((n: any) => n.status === "understood").length;
            const score = nodes.length > 0 ? Math.round((understoodCount / nodes.length) * 100) : 0;
            
            return (
              <div 
                key={h.id} 
                onClick={() => {
                  onSelectMap(h.id);
                  onClose();
                }}
                className="p-3 rounded-lg border border-border bg-card/50 hover:bg-primary/10 hover:border-primary/30 cursor-pointer transition-all flex flex-col gap-2 group relative"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-sm line-clamp-1">{h.query}</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-6 h-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={(e) => deleteMap(e, h.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">
                    {new Date(h.updated_at).toLocaleDateString()}
                  </span>
                  <span className={`font-mono ${score > 80 ? "text-success" : score > 50 ? "text-warning" : "text-destructive"}`}>
                    {score}% Mastered
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
