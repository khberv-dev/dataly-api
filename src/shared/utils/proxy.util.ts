import type { AxiosProxyConfig } from 'axios';

export function parseProxyConfig(url: string | undefined): AxiosProxyConfig | false {
  if (!url) return false;
  const { protocol, hostname, port, username, password } = new URL(url);
  const config: AxiosProxyConfig = {
    protocol: protocol.replace(':', ''),
    host: hostname,
    port: parseInt(port),
  };
  if (username) config.auth = { username, password };
  return config;
}
