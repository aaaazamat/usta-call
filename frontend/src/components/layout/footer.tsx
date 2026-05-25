import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <Container className="py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-semibold mb-3">usta-call</h4>
            <p className="text-muted-foreground">{t("tagline")}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">{t("forClients")}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/masters" className="hover:text-foreground">
                  {t("linkFindMasters")}
                </Link>
              </li>
              <li>
                <Link href="/orders/new" className="hover:text-foreground">
                  {t("linkPostOrder")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">{t("forMasters")}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link href="/register?role=master" className="hover:text-foreground">
                  {t("linkRegisterMaster")}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-foreground">
                  {t("linkHowItWorks")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">{t("contact")}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>support@usta-call.uz</li>
              <li>+998 71 000 00 00</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t text-xs text-muted-foreground flex justify-between">
          <span>{t("copyright", { year })}</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              {t("privacy")}
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              {t("terms")}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
