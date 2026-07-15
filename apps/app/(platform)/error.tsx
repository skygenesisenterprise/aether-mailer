"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface PlatformErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PlatformError({ error, reset }: PlatformErrorProps) {
  React.useEffect(() => {
    console.error("[Platform] Error", error);
  }, [error]);

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Empty className="max-w-xl border border-border/70 bg-card/40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangle className="text-amber-400" />
          </EmptyMedia>
          <EmptyTitle>Impossible de charger cet espace</EmptyTitle>
          <EmptyDescription>
            Une erreur a interrompu le chargement de la plateforme. Réessayez sans quitter votre
            session.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset} className="rounded-xl">
            <RotateCcw className="size-4" />
            Réessayer
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
