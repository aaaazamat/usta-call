// Next.js 16'da `middleware.ts` o'rniga `proxy.ts` ishlatiladi.
// next-intl `createMiddleware` factory'si NextRequest/NextResponse bilan ishlaydi,
// shuning uchun u shu yerda muvaffaqiyatli ishlaydi.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // /uz, /kk, /ru va boshqa hamma yo'llarni qamrab oladi.
  // _next, api, statik fayllar va public papkadagi fayllar bypass qilinadi.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
