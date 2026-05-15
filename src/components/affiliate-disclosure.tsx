import Link from "next/link";

export function AffiliateDisclosure() {
  return (
    <p className="mt-3 text-xs text-slate-500">
      Some links earn us a commission.{" "}
      <Link href="/about" className="underline hover:text-[#0089de]">
        Learn more
      </Link>
    </p>
  );
}
