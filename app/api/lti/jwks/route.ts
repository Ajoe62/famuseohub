import { publicJwks } from "@/lib/lti/keys";

/** The tool's public key set. Canvas reads it (Developer Key → "Public JWK URL"). */
export async function GET() {
  return Response.json(await publicJwks(), { headers: { "Cache-Control": "public, max-age=3600" } });
}
