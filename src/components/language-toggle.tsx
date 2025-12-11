"use client";

import { Languages } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

import type { Locale } from "@/lib/dictionaries";

interface LanguageToggleProps {
  className?: string;
  currentLang: Locale;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className,
  currentLang,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleToggleLanguage = () => {
    const newLang = currentLang === "en" ? "es" : "en";
    const newPath = pathname.replace(`/${currentLang}`, `/${newLang}`);
    const queryString = searchParams.toString();
    const fullPath = queryString ? `${newPath}?${queryString}` : newPath;
    router.push(fullPath);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggleLanguage}
      className={`${className} min-w-[70px] h-10 font-bold text-base`}
      aria-label={`Switch to ${currentLang === "en" ? "Spanish" : "English"}`}
    >
      <Languages className="h-4 w-4 mr-1.5" />
      {currentLang === "en" ? "ES" : "EN"}
    </Button>
  );
};

export { LanguageToggle };
