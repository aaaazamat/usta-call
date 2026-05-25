// Root layout — proxy.ts foydalanuvchini /uz, /kk, yoki /ru ga yo'naltiradi,
// shu yerga hech kim to'g'ridan-to'g'ri tushmaydi. HTML/body taglari
// [locale]/layout.tsx da render qilinadi (chunki <html lang=...> locale'ga bog'liq).
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
