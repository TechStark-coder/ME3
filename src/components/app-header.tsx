
"use client";

import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Sparkles } from "lucide-react"; // Aperture removed, Sparkles and ImageIcon remain

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-transparent"> {/* Updated to bg-transparent */}
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          {/* Wink Eye SVG Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
            <path d="M8 14.5C8 14.5 9 12.5 12 12.5C15 12.5 16 14.5 16 14.5" />
            <line x1="15" y1="9" x2="15" y2="9.01" /> {/* Open eye */}
            <line x1="9" y1="9" x2="9" y2="10.5" /> {/* Winking eye (closed line) */}
          </svg>
          <span className="font-bold inline-block text-primary">SameSameButDifferent</span>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              New Features
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Explore AI Tools</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/analyze-single" passHref legacyBehavior>
              <DropdownMenuItem asChild>
                <a className="flex items-center gap-2 cursor-pointer">
                  <ImageIcon className="h-4 w-4" />
                  Analyze Single Image
                </a>
              </DropdownMenuItem>
            </Link>
            {/* Add more features here later if needed */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
