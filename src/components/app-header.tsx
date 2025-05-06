
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
import { Image as ImageIconLucide, Sparkles, Menu } from "lucide-react"; 
import CustomLogo from './custom-logo'; // Ensure CustomLogo is correctly imported

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between py-2">
        <Link href="/" className="flex items-center space-x-2" aria-label="Go to homepage">
          {/* Use CustomLogo component, wrapped in Link for navigation */}
          <CustomLogo className="h-10 w-auto md:h-12" /> 
          {/* Removed the text "SameSameButDifferent" */}
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Menu className="h-4 w-4" /> {/* Changed icon to Menu for more general "features" dropdown */}
              Features
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Explore AI Tools</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/analyze-single" passHref legacyBehavior>
              <DropdownMenuItem asChild>
                <a className="flex items-center gap-2 cursor-pointer">
                  <ImageIconLucide className="h-4 w-4" />
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

