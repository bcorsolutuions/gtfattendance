interface GTFLogoIconProps {
  size?: number;
  className?: string;
}

export function GTFLogoIcon({ size = 64, className }: GTFLogoIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/gtf-logo.png"
      alt="GTF Logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
      className={className}
    />
  );
}
