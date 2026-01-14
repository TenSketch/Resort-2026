import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbProps {
  items: string[];
  className?: string;
  showHome?: boolean;
}

const Breadcrumb = ({ items, className = "", showHome = true }: BreadcrumbProps) => {
  return (
    <nav className={`flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ${className}`}>
      {showHome && (
        <>
          <Home className="h-3 w-3 sm:h-4 sm:w-4 text-black shrink-0" />
          {items.length > 0 && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 shrink-0" />}
        </>
      )}
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1 sm:space-x-2">
          {index > 0 && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 shrink-0" />}
          <span 
            className={`truncate max-w-[60px] sm:max-w-none ${
              index === items.length - 1 
                ? "text-black font-medium" 
                : "text-gray-600 hover:text-gray-800 cursor-pointer"
            }`}
          >
            {item}
          </span>
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
