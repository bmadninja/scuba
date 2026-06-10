import Link from "next/link";

export function AffiliateDisclosure() {
  return (
    <p className="mt-3 text-xs text-[#8b9db8]">
      Some links earn us a commission.{" "}
      <Link href="/about" className="underline hover:text-[#00d4ff]">
        Learn more
      </Link>
    </p>
  );
}
