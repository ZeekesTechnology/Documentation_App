import { HelpCircle, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UpdateDialog } from "./UpdateDialog";

export function HelpMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = window.documentationApp?.onOpenUpdateDialog?.(() => {
      setMenuOpen(false);
      setUpdateOpen(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const openUpdateDialog = () => {
    setMenuOpen(false);
    setUpdateOpen(true);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded px-2 py-2 text-sm text-gray-400 hover:bg-vault-surface hover:text-white"
          title="Help"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Help</span>
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full z-40 mt-1 min-w-[220px] rounded border border-vault-border bg-vault-panel py-1 shadow-lg"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-200 hover:bg-vault-surface"
              onClick={openUpdateDialog}
            >
              <RefreshCw className="h-4 w-4 text-gray-400" />
              Search for Update
            </button>
          </div>
        )}
      </div>

      <UpdateDialog open={updateOpen} onClose={() => setUpdateOpen(false)} />
    </>
  );
}
