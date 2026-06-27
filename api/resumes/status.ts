declare const process: { env: Record<string, string | undefined> };

const json = (res: any, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

  const hasToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return json(res, hasToken ? 200 : 500, {
    ok: hasToken,
    storeId: process.env.BLOB_STORE_ID ? 'configured' : 'not-set',
    error: hasToken ? null : 'Blob storage is not connected. Add BLOB_READ_WRITE_TOKEN in Vercel Environment Variables.',
  });
}
