import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 gradient-bg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-float z-30"
      size="icon"
    >
      <Plus className="w-6 h-6 text-white" />
    </Button>
  );
}
