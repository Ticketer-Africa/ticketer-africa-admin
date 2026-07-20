import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: ["components/ui/**", "hooks/use-mobile.tsx"],
  },
  ...nextConfig,
];

export default config;
