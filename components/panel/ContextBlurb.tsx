interface ContextBlurbProps {
  text: string;
}

export default function ContextBlurb({ text }: ContextBlurbProps) {
  return <p className="text-sm text-ink/80 leading-relaxed">{text}</p>;
}
