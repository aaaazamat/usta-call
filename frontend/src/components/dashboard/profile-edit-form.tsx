"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCategories, useRegions } from "@/lib/api/masters-hooks";
import { useUpdateMasterMe } from "@/lib/api/master-me-hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { MasterDetail } from "@/lib/api/types";

export function ProfileEditForm({ profile }: { profile: MasterDetail }) {
  const updateMutation = useUpdateMasterMe();
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  const [bio, setBio] = useState(profile.bio);
  const [experienceYears, setExperienceYears] = useState(String(profile.experience_years));
  const [rateFrom, setRateFrom] = useState(profile.hourly_rate_from ?? "");
  const [rateTo, setRateTo] = useState(profile.hourly_rate_to ?? "");
  const [isAvailable, setIsAvailable] = useState(profile.is_available);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    profile.categories.map((c) => c.id),
  );
  const [selectedRegions, setSelectedRegions] = useState<number[]>(
    profile.regions.map((r) => r.id),
  );

  useEffect(() => {
    setBio(profile.bio);
    setExperienceYears(String(profile.experience_years));
    setRateFrom(profile.hourly_rate_from ?? "");
    setRateTo(profile.hourly_rate_to ?? "");
    setIsAvailable(profile.is_available);
    setSelectedCategories(profile.categories.map((c) => c.id));
    setSelectedRegions(profile.regions.map((r) => r.id));
  }, [profile]);

  const toggleCategory = (id: number) =>
    setSelectedCategories((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );

  const toggleRegion = (id: number) =>
    setSelectedRegions((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        bio: bio.trim(),
        experience_years: Number(experienceYears) || 0,
        hourly_rate_from: rateFrom || null,
        hourly_rate_to: rateTo || null,
        categories: selectedCategories,
        regions: selectedRegions,
        is_available: isAvailable,
      },
      {
        onSuccess: () => toast.success("Profil saqlandi"),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const topCategories = categories?.filter((c) => !c.parent) ?? [];
  const viloyatlar = regions?.filter((r) => r.kind === "viloyat") ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ish holati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="available" className="text-base">
                Ish qabul qilaman
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                O&apos;chirilganda mijozlar sizni topa olmaydi
              </p>
            </div>
            <Switch
              id="available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tavsif va tajriba</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">O&apos;zingiz haqida</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Qanday ishlarni bajarasiz, qancha vaqt shu sohada ishlayapsiz, kuchli tomonlaringiz nima..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              To&apos;liqroq tavsif — ko&apos;proq buyurtma
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Tajriba (yil)</Label>
            <Input
              id="experience"
              type="number"
              min={0}
              max={70}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Soatlik narx</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate_from">Dan (so&apos;m)</Label>
              <Input
                id="rate_from"
                type="number"
                min={0}
                value={rateFrom}
                onChange={(e) => setRateFrom(e.target.value)}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate_to">Gacha (so&apos;m)</Label>
              <Input
                id="rate_to"
                type="number"
                min={0}
                value={rateTo}
                onChange={(e) => setRateTo(e.target.value)}
                placeholder="200000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Kasb (kategoriyalar){" "}
            {selectedCategories.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                · {selectedCategories.length} ta tanlangan
              </span>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Bir nechta kasb egasi bo&apos;lsangiz, hammasini tanlang
          </p>
        </CardHeader>
        <CardContent>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topCategories.map((c) => (
                <ToggleChip
                  key={c.id}
                  active={selectedCategories.includes(c.id)}
                  onClick={() => toggleCategory(c.id)}
                >
                  {c.name}
                </ToggleChip>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Xizmat ko&apos;rsatadigan hududlar</CardTitle>
        </CardHeader>
        <CardContent>
          {viloyatlar.length === 0 ? (
            <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {viloyatlar.map((r) => (
                <ToggleChip
                  key={r.id}
                  active={selectedRegions.includes(r.id)}
                  onClick={() => toggleRegion(r.id)}
                >
                  {r.name}
                </ToggleChip>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur p-3 border rounded-xl">
        <Button type="submit" size="lg" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saqlanmoqda...
            </>
          ) : (
            "O'zgarishlarni saqlash"
          )}
        </Button>
      </div>
    </form>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-sm border transition " +
        (active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-muted border-border")
      }
    >
      {children}
    </button>
  );
}
