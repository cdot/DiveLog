/**
 * Cloudflare Worker that passes on a request to an Appscript. Only
 * required because App Script doesn't handle CORS correctly.
 * See README.md for usage.
 */
export default {

  /**
   * @param {object} request request
   */
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS"
    };

    if (request.method === "POST") {
      // Decode the request JSON
      const data = await request.json();
      const response = await fetch(
        // The only field we always require is the App Script deployment ID
        `https://script.google.com/macros/s/${data.appscriptID}/exec`,
        {
          method: "POST",
          // pass everything on to the App Script.
          body: JSON.stringify(data)
        });
      // Decode the response from App Script
      const reply = await response.json();
      // Re-encode it and send it back to the caller
      return new Response(JSON.stringify(reply), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } else // OPTIONS (or GET, though Allow-Methods should exclude it :-/)
      // Just send back the CORS headers
      return new Response(null, { headers: corsHeaders });
  }
}
