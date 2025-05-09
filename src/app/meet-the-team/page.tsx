
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const teamMembers = [
  { name: "Reevan", role: "Dev", imageSrc: "/reevan.jpeg", imageHint: "man portrait", backImageSrc: "/reevan2.jpg", backImageHint: "abstract pattern" },
  { name: "Mohammed Sohail", role: "Dev", imageSrc: "/sohail-1.jpeg", imageHint: "man profile", backImageSrc: "/sohail-2.jpg", backImageHint: "geometric design" },
  { name: "Asif", role: "Dev", imageSrc: "/asif.jpeg", imageHint: "man sunglasses", backImageSrc: "/asif2.jpg", backImageHint: "team logo" },
  { name: "Rahul", role: "Dev", imageSrc: "/rahul.jpeg", imageHint: "man happy", backImageSrc: "/rahul2.jpg", backImageHint: "nature scene" },
  { name: "Tejas", role: "Tester", imageSrc: "/tejas.jpeg", imageHint: "man thinking", backImageSrc: "/tejas-2.jpg", backImageHint: "tech background" }
];

export default function MeetTheTeamPage() {
  return (
    <main 
      className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center p-4 md:p-8 relative z-10 bg-cover bg-center bg-no-repeat"
    >
      <div className="w-full max-w-6xl min-h-[70vh] md:min-h-[600px] animate-fade-slide-in bg-black/50 backdrop-blur-sm p-6 rounded-lg">
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white"> 
                Meet Our Team
            </h1>
            <Link href="/" passHref legacyBehavior>
                <Button variant="outline" className="border-border/70 hover:border-foreground transition-colors"> 
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>
            </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="flip-card-container h-[400px] sm:h-[420px] md:h-[450px]">
              <div className="flip-card">
                <div className="flip-card-front">
                  <Card className="bg-neutral-50/90 border-neutral-200/50 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden w-full h-full flex flex-col">
                    <CardHeader className="items-center text-center p-6 bg-gradient-to-br from-teal-50/80 to-sky-50/80 flex-shrink-0">
                      <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-teal-400 shadow-md mb-4">
                        <Image
                          src={member.imageSrc}
                          alt={`Photo of ${member.name}`}
                          layout="fill"
                          objectFit="cover"
                          data-ai-hint={member.imageHint}
                          className="rounded-full"
                          onError={(e) => {
                              console.error(`Error loading image for ${member.name} from ${member.imageSrc}. This usually means the file is missing or the URL is incorrect. If it's a local file (like '${member.imageSrc}'), ensure it's in the 'public' folder. Attempting fallback...`, e);
                              const target = e.target as HTMLImageElement;
                              // Specific fallback for Asif if his specific local image fails
                              if (member.name === "Asif" && member.imageSrc === "/asif.jpeg") {
                                target.src = 'https://picsum.photos/seed/asif_fallback_dev/300/300';
                                target.srcset = ''; 
                              } else if (member.imageSrc && !member.imageSrc.startsWith('https://picsum.photos')) {
                                // Generic fallback for other local images that might fail
                                target.src = `https://picsum.photos/seed/generic_fallback_${member.name.toLowerCase().replace(/\s/g, '_')}/300/300`;
                                target.srcset = '';
                              } else {
                                // Fallback for picsum URLs themselves if they error for some reason
                                target.src = 'https://picsum.photos/seed/remote_error_fallback/300/300';
                                target.srcset = '';
                              }
                          }}
                        />
                      </div>
                      <CardTitle className="text-xl md:text-2xl font-semibold text-neutral-800">{member.name}</CardTitle>
                      <CardDescription className="text-teal-600 font-medium text-sm md:text-base">{member.role}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 text-center flex-grow">
                       <p className="text-sm text-neutral-700">Hover to see more!</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flip-card-back bg-neutral-50/90 border-neutral-200/50">
                  <Image
                    src={member.backImageSrc || "/asif2.jpg"} // Default back image if not specified
                    alt={`Details for ${member.name}`}
                    layout="fill"
                    objectFit="contain" 
                    data-ai-hint={member.backImageHint || "fun image"}
                    className="rounded-lg p-2" // Added padding to prevent image touching edges
                     onError={(e) => {
                              console.error(`Error loading back image for ${member.name} from ${member.backImageSrc || "/asif2.jpg"}. Ensure this file exists in the 'public' directory and the filename (including extension and case) is an exact match. Attempting fallback...`, e);
                              const target = e.target as HTMLImageElement;
                              // Specific fallback for Asif's back image if it's the known one that fails
                              if (member.name === "Asif" && (member.backImageSrc === "/asif2.jpg" || !member.backImageSrc)) {
                                target.src = 'https://picsum.photos/seed/fallback_back_asif_specific/300/400';
                                target.srcset = ''; 
                              } else if (member.backImageSrc && !member.backImageSrc.startsWith('https://picsum.photos')) {
                                // Fallback for any other local back images that might fail
                                target.src = `https://picsum.photos/seed/fallback_back_other_local_${member.name.toLowerCase().replace(/\s/g, '_')}/300/400`;
                                target.srcset = ''; 
                              } else {
                                // Fallback for picsum URLs themselves if they error
                                target.src = 'https://picsum.photos/seed/fallback_back_remote_error/300/400';
                                target.srcset = ''; 
                              }
                          }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
