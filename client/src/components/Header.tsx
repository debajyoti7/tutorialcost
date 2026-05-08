import { Archive, Chrome, LogIn, LogOut } from "lucide-react";
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

export default function Header() {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const isActive = (path: string) => location === path;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border"
      style={{
        height: "58px",
        background: "hsl(var(--background) / 0.88)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-editorial mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo — Lora serif */}
        <Link href="/" data-testid="link-home">
          <span
            className="cursor-pointer select-none"
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

        {/* Nav links + actions */}
        <nav className="flex items-center gap-5">
          {/* Nav links — uppercase, 0.82rem */}
          <Link href="/archive">
            <span
              className={`cursor-pointer transition-colors duration-150 ${
                isActive("/archive") ? "nav-link-active" : ""
              }`}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.82rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 500,
                color: isActive("/archive")
                  ? "hsl(var(--sage))"
                  : "hsl(var(--muted-foreground))",
              }}
              data-testid="button-archive"
            >
              Archive
            </span>
          </Link>

          <Link href="/extension">
            <span
              className={`cursor-pointer transition-colors duration-150 ${
                isActive("/extension") ? "nav-link-active" : ""
              }`}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.82rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 500,
                color: isActive("/extension")
                  ? "hsl(var(--sage))"
                  : "hsl(var(--muted-foreground))",
              }}
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
                <span
                  style={{
                    fontSize: "0.82rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Sign In
                </span>
              </a>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
