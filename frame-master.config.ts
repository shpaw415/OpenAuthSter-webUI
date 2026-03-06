import type { FrameMasterConfig } from "frame-master/server/types";
import ReactToHtml from "frame-master-plugin-react-to-html";
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
      },
    },
    EnvInHtml({
      prefix: "PUBLIC_",
      entries: ["NODE_ENV"],
    }),
    CloudflareAction({
      actionBasePath: "src/api",
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
      quality: 75,
      sizes: [320],
      skipExisting: true,
      enableImports: true,
    }),
  ],
} satisfies FrameMasterConfig;
