import type { FrameMasterConfig } from "frame-master/server/types";
import { join } from "path";
import ReactToHtml from "frame-master-plugin-react-to-html";

function getMime(path: string): string {
  const ext = path.split(".").pop() ?? "";
  const mime: Record<string, string> = {
    png: "image/png",
    webp: "image/webp",
    ico: "image/x-icon",
    css: "text/css",
    js: "application/javascript",
  };
  return mime[ext] ?? "application/octet-stream";
}
import ApplyReact from "frame-master-plugin-apply-react/plugin";
import TailwindPlugin from "frame-master-plugin-tailwind";
import CloudflareAction from "frame-master-plugin-cloudflare-pages-functions-action";
import svgToJsxPlugin from "frame-master-svg-to-jsx-loader";
import mdxLoaderPlugin from "frame-master-plugin-mdx-to-js-loader";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import EnvInHtml from "frame-master-plugin-env-in-html";
import rehypePrettyCode from "rehype-pretty-code";
import ImageOptimizerPlugin from "frame-master-plugin-image-optimizer";

export default {
  HTTPServer: {
    port: 3001,
  },
  plugins: [
    ReactToHtml({
      shellPath: "src/shell.tsx",
      srcDir: "src/pages",
    }),
    ApplyReact({
      clientShellPath: "src/client-wrapper.tsx",
      route: "src/pages",
      style: "nextjs",
    }),
    TailwindPlugin({
      inputFile: "static/tailwind.css",
      outputFile: "static/style.css",
      options: {
        autoInjectInBuild: true,
        runtime: "bun",
      },
    }),
    {
      name: "static-assets",
      version: "1.0.0",
      build: {
        buildConfig: {
          naming: {
            asset: "[dir]/[name].[ext]",
          },
        },
        async afterBuild(_buildConfig, result) {
          if (!result.success) return;
          const cwd = process.cwd();
          const staticDir = join(cwd, "static");
          const outDir = join(cwd, ".frame-master/build");
          const destStatic = join(outDir, "static");
          await Bun.$`mkdir -p ${destStatic} && cp -r ${staticDir}/* ${destStatic}/`;
          for (const name of ["testimonials-bg.png", "favicon.ico"]) {
            const src = join(staticDir, name);
            if (await Bun.file(src).exists()) {
              result.outputs.push({
                path: join(destStatic, name),
                kind: "asset",
                hash: "",
                loader: "file",
              } as Bun.BuildArtifact);
            }
          }
        },
      },
      serverConfig: {
        routes: {
          ["/static/*"]: async (req) => {
            const pathname = new URL(req.url).pathname;
            const subpath = pathname.replace(/^\/static\//, "").replace(/\.\./g, "") || ".";
            const staticDir = join(process.cwd(), "static");
            const filePath = join(staticDir, subpath);
            if (!filePath.startsWith(staticDir)) return new Response("Forbidden", { status: 403 });
            const file = Bun.file(filePath);
            if (!(await file.exists())) return new Response("Not Found", { status: 404 });
            return new Response(file, {
              headers: { "Content-Type": getMime(subpath) },
            });
          },
        },
      },
    },
    EnvInHtml({
      prefix: "PUBLIC_",
      entries: ["NODE_ENV"],
    }),
    CloudflareAction({
      actionBasePath: "src/actions",
      outDir: ".frame-master/build",
    }),
    svgToJsxPlugin(),
    mdxLoaderPlugin({
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          rehypeAutolinkHeadings,
          [rehypePrettyCode, { theme: "one-dark-pro" }],
        ],
        recmaPlugins: [],
      },
    }),
    ImageOptimizerPlugin({
      input: "static",
      output: "optimized",
      formats: ["webp"],
      quality: 100,
      sizes: [320, 1024],
      skipExisting: true,
      enableImports: true,
    }),
  ],
} satisfies FrameMasterConfig;
