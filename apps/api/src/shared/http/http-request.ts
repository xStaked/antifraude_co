export interface HttpRequest {
  method: string;
  url: string;
  originalUrl?: string;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  headers: Record<string, string | string[] | undefined>;
  user?: {
    id?: string;
  };
}
