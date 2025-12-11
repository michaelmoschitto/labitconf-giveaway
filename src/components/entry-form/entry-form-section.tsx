"use client";

import { EntryFormDesktop } from "@/components/entry-form/entry-form-desktop";
import { EntryFormMobile } from "@/components/entry-form/entry-form-mobile";

import type { EntryFormComponentProps } from "@/components/entry-form/types";

export const EntryFormSection = ({ dict, lang }: EntryFormComponentProps) => {
  return (
    <>
      {/* Mobile: Progressive Disclosure - Single Viewport Initial State */}
      <div className="block lg:hidden">
        <EntryFormMobile dict={dict} lang={lang} />
      </div>

      {/* Desktop: Enhanced Unified Form */}
      <div className="hidden lg:block">
        <EntryFormDesktop dict={dict} lang={lang} />
      </div>
    </>
  );
};
