/**
 * EditorialHook — italic serif paragraph above data sections.
 * Source Serif 4, 1.0625rem, line-height 1.8, #aebcd0, max-width 640px.
 * No marketing superlatives — honest editorial voice only.
 */

type EditorialHookProps = {
  text: string;
  className?: string;
};

export function EditorialHook({ text, className = "" }: EditorialHookProps) {
  return (
    <p
      className={className}
      style={{
        fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
        fontSize: "1.0625rem",
        lineHeight: 1.8,
        color: "#aebcd0",
        maxWidth: 640,
        fontStyle: "italic",
      }}
    >
      {text}
    </p>
  );
}
