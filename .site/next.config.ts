import type { NextConfig } from "next";

// Статический экспорт: папка out/ заливается на любой хостинг в РФ
// (Timeweb Cloud, REG.RU, Yandex Object Storage). Vercel из РФ работает нестабильно.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
