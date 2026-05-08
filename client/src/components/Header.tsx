import { LogIn, LogOut, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SettingsDialog from "./SettingsDialog";
import { useState } from "react";

export default function Header() {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const isActive = (path: string) => location === path;

  const navLinkStyle = (path: string) => ({
    fontFamily: "var(--font-sans)",
    fontSize: "0.82rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    fontWeight: 500,
    color: isActive(path) ? "hsl(var(--sage))" : "hsl(var(--muted-foreground))",
  });

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border"
        style={{
          height: "58px",
          background: "hsl(var(--background) / 0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-editorial mx-auto px-6 h-full flex items-center justify-between gap-4">
          {/* Logo — Lora serif */}
          <Link href="/" data-testid="link-home">
            <span
              className="cursor-pointer select-none shrink-0"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 500,
                fontSize: "1.125rem",
                color: "hsl(var(--foreground))",
                letterSpacing: "-0.01em",
              }}
            >
              Tutorial Cost
            </span>
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden sm:flex items-center gap-5">
            <Link href="/archive">
              <span
                className={`cursor-pointer transition-colors duration-150 ${isActive("/archive") ? "nav-link-active" : ""}`}
                style={navLinkStyle("/archive")}
                data-testid="button-archive"
              >
                Archive
              </span>
            </Link>

            <Link href="/extension">
              <span
                className={`cursor-pointer transition-colors duration-150 ${isActive("/extension") ? "nav-link-active" : ""}`}
                style={navLinkStyle("/extension")}
                data-testid="button-extension"
              >
                Extension
              </span>
            </Link>

            <SettingsDialog />

            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || 'User'} />
                      <AvatarFallback className="text-xs">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="flex items-center gap-2 cursor-pointer">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                style={{ borderRadius: "100px" }}
                asChild
              >
                <a href="/api/login">
                  <LogIn className="h-3.5 w-3.5" />
                  <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Sign In
                  </span>
                </a>
              </Button>
            )}
          </nav>

          {/* Mobile right side — settings + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <SettingsDialog />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      <div
        className="fixed top-[58px] left-0 right-0 z-40 sm:hidden border-b border-border"
        style={{
          background: "hsl(var(--background) / 0.97)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          visibility: mobileOpen ? "visible" : "hidden",
          opacity: mobileOpen ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
      >
        <nav className="flex flex-col px-6 py-4 gap-4">
          <Link href="/archive" onClick={() => setMobileOpen(false)}>
            <span
              className={`cursor-pointer transition-colors duration-150 ${isActive("/archive") ? "nav-link-active" : ""}`}
              style={navLinkStyle("/archive")}
              data-testid="button-archive-mobile"
            >
              Archive
            </span>
          </Link>

          <Link href="/extension" onClick={() => setMobileOpen(false)}>
            <span
              className={`cursor-pointer transition-colors duration-150 ${isActive("/extension") ? "nav-link-active" : ""}`}
              style={navLinkStyle("/extension")}
              data-testid="button-extension-mobile"
            >
              Extension
            </span>
          </Link>

          <div className="pt-1 border-t border-border">
            {isLoading ? (
              <div className="h-8 w-24 rounded-full bg-muted animate-pulse mt-2" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="ghost" size="sm" style={{ borderRadius: "100px" }} asChild>
                  <a href="/api/logout" className="flex items-center gap-1.5">
                    <LogOut className="h-3.5 w-3.5" />
                    <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Sign Out
                    </span>
                  </a>
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 mt-2"
                style={{ borderRadius: "100px" }}
                asChild
              >
                <a href="/api/login" onClick={() => setMobileOpen(false)}>
                  <LogIn className="h-3.5 w-3.5" />
                  <span style={{ fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Sign In
                  </span>
                </a>
              </Button>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
