
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
import { Image as ImageIcon, Sparkles } from "lucide-react"; 
import CustomLogo from './custom-logo'; // Import the new CustomLogo

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <CustomLogo className="h-8 w-8 text-primary" /> {/* Use CustomLogo and adjust size if needed */}
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
