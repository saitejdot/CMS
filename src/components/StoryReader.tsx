"use client";

import { useState } from "react";
import TranslationControl from "@/components/TranslationControl";

interface StoryReaderProps {
  slug: string;
  originalContent: string;
}

export default function StoryReader({ slug, originalContent }: StoryReaderProps) {
  const [content, setContent] = useState(originalContent);

  function handleTranslated(translatedHtml: string | null) {
    setContent(translatedHtml ?? originalContent);
  }

  return (
    <>
      <TranslationControl slug={slug} originalContent={originalContent} onTranslated={handleTranslated} />
      <div
        className="story-content notebook-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}
