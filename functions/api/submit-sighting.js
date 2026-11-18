// Temporarily disabled: the old version wrote to the server's disk, which
// static/edge hosting does not support. Returns a clear message to the form.
export async function onRequestPost() {
  return Response.json({ ok: false, error: "Submissions are paused while we move to new hosting. Please try again soon, or email your sighting to josie@scubaseason.fun." }, { status: 503 });
}
