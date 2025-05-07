
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const teamMembers = [
  { name: "Reevan", role: "Dev", imageSrc: "https://picsum.photos/seed/reevan/300/300", imageHint: "man portrait" },
  { name: "Mohammed Sohail", role: "Dev", imageSrc: "https://picsum.photos/seed/sohail/300/300", imageHint: "man profile" },
  { name: "Asif", role: "Dev", imageSrc: "https://picsum.photos/seed/asif_dev_updated/300/300", imageHint: "man sunglasses" },
  { name: "Rahul", role: "Dev", imageSrc: "https://picsum.photos/seed/rahul/300/300", imageHint: "man happy" },
  { name: "Tejas", role: "Tester", imageSrc: "https://picsum.photos/seed/tejas/300/300", imageHint: "man thinking" }
];

export default function MeetTheTeamPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center bg-white text-neutral-900 p-4 md:p-8 relative z-10">
      {/* The z-index is set to 10 to be above the default body but below the header (z-50) */}
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
            <Card key={index} className="bg-neutral-50 border-neutral-200 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 rounded-xl overflow-hidden">
              <CardHeader className="items-center text-center p-6 bg-gradient-to-br from-teal-50 to-sky-50">
                <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-teal-400 shadow-md mb-4">
                  <Image
                    src={member.imageSrc}
                    alt={`Photo of ${member.name}`}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={member.imageHint}
                    className="rounded-full"
                  />
                </div>
                <CardTitle className="text-xl md:text-2xl font-semibold text-neutral-800">{member.name}</CardTitle>
                <CardDescription className="text-teal-600 font-medium text-sm md:text-base">{member.role}</CardDescription>
              </CardHeader>
              {/* You can add more content here if needed, e.g., a short bio or social links */}
              {/* <CardContent className="p-4 text-center">
                <p className="text-sm text-neutral-600">A brief description about {member.name}.</p>
              </CardContent> */}
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

