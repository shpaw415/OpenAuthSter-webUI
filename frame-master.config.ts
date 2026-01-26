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
import { AuthManager } from "../openauth-webui-shared-types/endpoints/index";

const proxyPaths = ["/auth", "/auth/authorize", "/auth/callback"];

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
    {
      name: "inject-env",
      version: "1.0.0",
      build: {
        buildConfig: {
          plugins: [
            {
              name: "inject-env-plugin",
              setup(build) {
                build.finally("html", async (args) => {
                  const envVars = Object.assign(
                    {},
                    ...Object.entries(process.env)
                      .filter(([key]) => key.startsWith("PUBLIC_"))
                      .map(([key, value]) => ({ [key]: value })),
                  );
                  const scriptEl = `<script id="_env_script_">window.process = { env: ${JSON.stringify(
                    envVars,
                  )} };</script>`;
                  const appendedData = new HTMLRewriter()
                    .on("head", {
                      element(element) {
                        element.prepend(scriptEl, { html: true });
                      },
                    })
                    .transform(args.contents as string);
                  return {
                    contents: appendedData,
                  };
                });
              },
            },
          ],
        },
      },
    },
    CloudflareAction({
      actionBasePath: "src/api",
      outDir: ".frame-master/build",
    }),
    {
      name: "dev-proxy-to-auth",
      version: "1.0.0",
      router: {
        async request(master) {
          if (!proxyPaths.includes(master.URL.pathname)) return;
          const url = new URL(master.request.url);
          url.port = "8787";

          const res = await fetch(url.toString(), master.request);

          console.log("Proxying auth request:", url.toString(), {
            status: res.status,
          });

          master.setResponse(Bun.gzipSync(await res.arrayBuffer()), {
            status: res.status,
            headers: {
              ...Object.fromEntries(res.headers),
              "content-encoding": "gzip",
            },
          });
        },
      },
    },
    svgToJsxPlugin(),
    mdxLoaderPlugin({
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
        recmaPlugins: [],
      },
    }),
  ],
} satisfies FrameMasterConfig;
