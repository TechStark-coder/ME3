
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const teamMembers = [
  { name: "Reevan", role: "Dev", imageSrc: "https://picsum.photos/seed/reevan/300/300", imageHint: "man portrait", backImageSrc: "https://picsum.photos/seed/card_back_reevan/300/400" },
  { name: "Mohammed Sohail", role: "Dev", imageSrc: "https://picsum.photos/seed/sohail/300/300", imageHint: "man profile", backImageSrc: "https://picsum.photos/seed/card_back_sohail/300/400" },
  { name: "Asiff", role: "Dev", imageSrc: "/asif-dev.jpeg", imageHint: "man sunglasses", backImageSrc: "https://picsum.photos/seed/card_back_asiff/300/400" },
  { name: "Rahul", role: "Dev", imageSrc: "https://picsum.photos/seed/rahul/300/300", imageHint: "man happy", backImageSrc: "https://picsum.photos/seed/card_back_rahul/300/400" },
  { name: "Tejas", role: "Tester", imageSrc: "https://picsum.photos/seed/tejas/300/300", imageHint: "man thinking", backImageSrc: "https://picsum.photos/seed/card_back_tejas/300/400" }
];

export default function MeetTheTeamPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center bg-white text-neutral-900 p-4 md:p-8 relative z-10">
      <div className="w-full max-w-5xl animate-fade-slide-in">
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-800">
                Meet Our Team
            </h1>
            <Link href="/" passHref legacyBehavior>
                <Button variant="outline" className="border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-400 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>
            </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="flip-card-container h-[400px] sm:h-[420px] md:h-[450px]"> {/* Adjust height as needed */}
              <div className="flip-card">
                <div className="flip-card-front">
                  <Card className="bg-neutral-50 border-neutral-200 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden w-full h-full flex flex-col">
                    <CardHeader className="items-center text-center p-6 bg-gradient-to-br from-teal-50 to-sky-50 flex-shrink-0">
                      <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-teal-400 shadow-md mb-4">
                        <Image
                          src={member.imageSrc}
                          alt={`Photo of ${member.name}`}
                          layout="fill"
                          objectFit="cover"
                          data-ai-hint={member.imageHint}
                          className="rounded-full"
                          onError={(e) => {
                              console.error(`Error loading image for ${member.name} from ${member.imageSrc}. This usually means the file is missing or the URL is incorrect. If it's a local file (like '/asif-dev.jpeg'), ensure it's in the 'public' folder. Attempting fallback...`, e);
                              const target = e.target as HTMLImageElement;
                              if (member.name === "Asiff" && member.imageSrc === "/asif-dev.jpeg") {
                                target.src = 'https://picsum.photos/seed/asif_fallback_dev/300/300';
                                target.srcset = ''; 
                              } else if (!member.imageSrc.startsWith('https://picsum.photos')) {
                                target.src = 'https://picsum.photos/seed/generic_fallback/300/300';
                                target.srcset = '';
                              }
                          }}
                        />
                      </div>
                      <CardTitle className="text-xl md:text-2xl font-semibold text-neutral-800">{member.name}</CardTitle>
                      <CardDescription className="text-teal-600 font-medium text-sm md:text-base">{member.role}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 text-center flex-grow">
                       <p className="text-sm text-neutral-600">Hover to see more!</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flip-card-back">
                  {/* Content for the back of the card */}
                  <Image
                    src={member.backImageSrc}
                    alt={`Details for ${member.name}`}
                    layout="fill"
                    objectFit="contain"
                    data-ai-hint="fun image"
                    className="rounded-lg"
                     onError={(e) => {
                              console.error(`Error loading back image for ${member.name} from ${member.backImageSrc}.`, e);
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://picsum.photos/seed/fallback_back_generic/300/400'; // Generic fallback for back image
                              target.srcset = '';
                          }}
                  />
                   {/* You can add text overlay or other elements here if needed */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
