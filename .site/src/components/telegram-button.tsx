"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { Button } from "./ui/button";
import { SocialGlyph } from "./social-icons";

/** Кнопка «Написать» в шапке: самолётик улетает вправо-вверх при наведении и прилетает слева-снизу, когда курсор уходит. */
export function TelegramButton() {
  const [state, setState] = useState<"idle" | "out" | "in">("idle");
  return (
    <Button asChild size="sm" className="ml-2.5 hidden sm:inline-flex">
      <a
        href={site.telegram}
        target="_blank"
        rel="noopener"
        aria-label="Написать в Telegram"
        onPointerEnter={() => setState("out")}
        onPointerLeave={() => setState("in")}
        onFocus={() => setState("out")}
        onBlur={() => setState("in")}
      >
        <span className="relative inline-flex size-4 overflow-hidden">
          <SocialGlyph name="telegramPlane" className={"tg-plane size-4" + (state === "out" ? " tg-out" : state === "in" ? " tg-in" : "")} />
        </span>
        Написать
      </a>
    </Button>
  );
}
