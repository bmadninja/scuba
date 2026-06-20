import UploadWizard from "@/components/sighting-submission/upload-wizard";

export const metadata = {
  title: "Upload a sighting — Scuba Season",
  description:
    "Submit your dive photos to 5 conservation databases in under 2 minutes. No accounts required.",
};

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <UploadWizard />
      </div>
    </main>
  );
}
