import Link from "next/link";

export function AffiliateDisclosure() {
  return (
    <p className="mt-3 text-xs text-[color:var(--color-ink-2)]">
      Some links earn us a commission.{" "}
      <Link href="/about" className="underline hover:text-[color:var(--color-ocean)]">
        Learn more
      </Link>
    </p>
  );
}
