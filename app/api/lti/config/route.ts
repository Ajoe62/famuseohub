import { appOrigin } from "@/lib/auth/session";

/**
 * Canvas LTI 1.3 JSON configuration. A Canvas admin can paste this URL into
 * Admin → Developer Keys → + LTI Key → Method: "Enter URL".
 * Privacy level "name_only": Canvas sends names but not emails (data minimisation).
 */
export async function GET(request: Request) {
  const origin = appOrigin(request);
  const launch = `${origin}/api/lti/launch`;
  return Response.json({
    title: "FAMU-SOE Capstone and Lab Hub",
    description: "Capstone milestone submissions, advisor approvals, and 50-hour lab-log verification.",
    oidc_initiation_url: `${origin}/api/lti/login`,
    target_link_uri: launch,
    public_jwk_url: `${origin}/api/lti/jwks`,
    scopes: [],
    extensions: [
      {
        domain: new URL(origin).host,
        tool_id: "famu-soe-capstone-hub",
        platform: "canvas.instructure.com",
        privacy_level: "name_only",
        settings: {
          text: "Capstone Hub",
          placements: [
            {
              placement: "course_navigation",
              message_type: "LtiResourceLinkRequest",
              target_link_uri: launch,
              text: "Capstone Hub",
              default: "enabled",
            },
          ],
        },
      },
    ],
    custom_fields: {
      canvas_term_name: "$Canvas.term.name",
    },
  });
}
