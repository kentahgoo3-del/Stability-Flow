import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalystComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function AnalystCombobox({ value, onChange, placeholder = "Select or type analyst name…", className, "data-testid": testId }: AnalystComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });
  const analysts = (users as any[]).filter((u: any) => u.role === "analyst" || u.role === "manager" || u.role === "section_head" || u.role === "reviewer");

  const filtered = analysts.filter((u: any) =>
    !inputValue.trim() || u.fullName.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInputValue(v);
    onChange(v);
    setOpen(true);
  }

  function handleSelect(name: string) {
    setInputValue(name);
    onChange(name);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          data-testid={testId}
          type="text"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-8"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        <ChevronsUpDown
          className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground cursor-pointer"
          onClick={() => { setOpen(o => !o); inputRef.current?.focus(); }}
        />
      </div>

      {open && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden"
        >
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.map((u: any) => (
              <div
                key={u.id}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/60 transition-colors"
                onMouseDown={e => { e.preventDefault(); handleSelect(u.fullName); }}
              >
                <Check className={cn("h-3.5 w-3.5 flex-shrink-0 text-primary", value === u.fullName ? "opacity-100" : "opacity-0")} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{u.fullName}</span>
                  {u.department && <span className="ml-2 text-xs text-muted-foreground">{u.department}</span>}
                </div>
                <span className="text-[10px] text-muted-foreground capitalize">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
