import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '../ThemeProvider';

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-8 bg-background">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}