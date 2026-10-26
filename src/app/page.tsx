import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stack = [
  "Next.js (App Router) + React + TypeScript",
  "Tailwind CSS + shadcn/ui",
  "PostgreSQL + Prisma (migration + seed)",
  "Modular monolith per domain (src/modules/*)",
  "OpenAPI contract-first (contracts/openapi.yaml)",
  "CI/CD GitHub Actions (lint, typecheck, test, build, migration)",
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Portal Chapter DPS</CardTitle>
          <CardDescription>
            Baseline fondasi teknis — halaman placeholder. Modul bisnis
            dibangun di atas struktur ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/api/v1/health">Cek health API</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="https://github.com/begawansemar7-pixel/dps-portal">Repository</Link>
        </Button>
      </div>
    </main>
  );
}
