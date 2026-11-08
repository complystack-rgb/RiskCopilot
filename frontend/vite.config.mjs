import path from "node:path";
import { defineConfig, loadEnv, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Some source files under src/ are .js but contain JSX (CRA convention). Vite only
// handles JSX in .jsx/.tsx by default, so compile JSX in .js files with oxc.
function jsxInJs() {
  return {
    name: "cra-jsx-in-js",
    enforce: "pre",
    async transform(code, id) {
      const [file] = id.split("?");
      if (!/\/src\/.*\.js$/.test(file) || file.includes("/node_modules/")) return null;
      return transformWithOxc(code, file, { lang: "jsx", jsx: { runtime: "automatic" } });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, ["REACT_APP_", "VITE_"]);
  return {
    plugins: [jsxInJs(), react(), tailwindcss()],
    // CRA parity: REACT_APP_* stays the frontend env convention.
    envPrefix: ["VITE_", "REACT_APP_"],
    // App code reads `process.env.REACT_APP_*`; Vite has no process.env in the browser,
    // so each REACT_APP_ key is inlined as a compile-time constant.
    define: Object.fromEntries(
      Object.entries(env)
        .filter(([key]) => key.startsWith("REACT_APP_"))
        .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
    ),
    resolve: {
      alias: [{ find: "@", replacement: path.resolve(__dirname, "./src") }],
    },
    // CRA parity: production bundle lands in build/, not dist/.
    build: { outDir: "build" },
    server: {
      host: true,
      port: 3000,
    },
  };
});
