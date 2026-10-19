import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: ["components/ui/**"],
  },
  ...nextConfig,
];

export default config;
