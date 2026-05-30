"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "@/i18n/navigation";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { Role, User } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth/store";
import { useMe, useSwitchRole, useUpdateMe } from "@/lib/auth/hooks";

function useRoleLabel() {
  const t = useTranslations("profile");
  return (role: Role): string =>
    role === "client" ? t("roleClient") : role === "master" ? t("roleMaster") : t("roleAdmin");
}

export function ProfileView() {
  const router = useRouter();
  const t = useTranslations("profile");
  const logout = useAuthStore((s) => s.logout);
  const { data: user } = useMe();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            logout();
            toast.success(t("loggedOut"));
            router.push("/");
          }}
          className="text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> {t("logout")}
        </Button>
      </div>

      <ProfileCard user={user} />
      <RoleCard user={user} />
    </div>
  );
}

function ProfileCard({ user }: { user: User }) {
  const t = useTranslations("profile");
  const [fullName, setFullName] = useState(user.full_name);
  const fileRef = useRef<HTMLInputElement>(null);
  const updateMe = useUpdateMe();

  const nameChanged = fullName.trim() !== user.full_name;

  const handleAvatarPick = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("onlyImages"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("maxAvatarSize"));
      return;
    }
    updateMe.mutate(
      { avatar: file },
      {
        onSuccess: () => toast.success(t("avatarUpdated")),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const handleNameSave = () => {
    updateMe.mutate(
      { full_name: fullName.trim() },
      {
        onSuccess: () => toast.success(t("nameSaved")),
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("personalInfo")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar ?? undefined} alt={user.full_name} />
              <AvatarFallback className="text-xl">
                {user.full_name?.[0]?.toUpperCase() ??
                  (user.phone?.slice(-2) ?? "U")}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={updateMe.isPending}
              className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted disabled:opacity-50"
              aria-label={t("changeAvatar")}
            >
              {updateMe.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarPick(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>{t("avatarHint")}</p>
            <p className="text-xs mt-1">{t("avatarFormats")}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="phone">{t("phone")}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="phone"
              value={user.phone ?? "—"}
              readOnly
              disabled
            />
            {user.is_verified && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" /> {t("verified")}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">{t("fullName")}</Label>
          <div className="flex gap-2">
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
              placeholder={t("namePlaceholder")}
            />
            <Button
              onClick={handleNameSave}
              disabled={!nameChanged || updateMe.isPending}
            >
              {updateMe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RoleCard({ user }: { user: User }) {
  const t = useTranslations("profile");
  const roleLabel = useRoleLabel();
  const switchRole = useSwitchRole();

  if (user.role === "admin") return null;

  const otherRole: Exclude<Role, "admin"> = user.role === "client" ? "master" : "client";

  const handleSwitch = () => {
    if (
      !confirm(
        user.role === "client" ? t("confirmToMaster") : t("confirmToClient"),
      )
    )
      return;
    switchRole.mutate(otherRole, {
      onSuccess: () => toast.success(t("nowInRole", { role: roleLabel(otherRole) })),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("roleTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{t("currentRole")}</span>
            <Badge variant="default">{roleLabel(user.role)}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {user.role === "client" ? t("clientDesc") : t("masterDesc")}
          </p>
        </div>
        <Button variant="outline" onClick={handleSwitch} disabled={switchRole.isPending}>
          {switchRole.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("switchTo", { role: roleLabel(otherRole) })
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
