"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  level: number; // 1-5
}

interface ProviderSkillsProps {
  skills: Skill[];
}

const skillLevels = [
  { label: "Débutant", color: "bg-gray-400" },
  { label: "Basique", color: "bg-blue-400" },
  { label: "Intermédiaire", color: "bg-green-400" },
  { label: "Avancé", color: "bg-yellow-400" },
  { label: "Expert", color: "bg-primary" },
];

export function ProviderSkills({ skills }: ProviderSkillsProps) {
  if (skills.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Compétences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {skills.map((skill) => {
            const levelIndex = Math.min(skill.level - 1, skillLevels.length - 1);
            const levelInfo = skillLevels[levelIndex];

            return (
              <div key={skill.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{skill.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {levelInfo.label}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded-full ${
                        level <= skill.level
                          ? levelInfo.color
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton version
export function ProviderSkillsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-5 w-16 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className="h-2 flex-1 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
