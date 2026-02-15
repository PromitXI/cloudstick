import Image from "next/image";

interface BrandIconProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export default function BrandIcon({
  size = 24,
  className = "",
  priority = false,
}: BrandIconProps) {
  return (
    <Image
      src="/landing-page-icon.jpg"
      alt="42Drive icon"
      width={size}
      height={size}
      priority={priority}
      className={`object-cover ${className}`}
    />
  );
}
