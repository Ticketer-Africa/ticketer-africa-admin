export const buildEndpoint = (version: string, endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `/${version}/${cleanEndpoint}`;
};
