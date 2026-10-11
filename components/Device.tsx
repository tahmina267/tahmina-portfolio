import Image from "next/image";

export function Browser({ src, url, className = "", children }: { src?: string; url: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={`browser ${className}`}>
      <div className="browser-bar"><i /><i /><i /><span>{url}</span></div>
      {children ?? <Image src={src!} alt="" width={1400} height={930} sizes="(max-width: 900px) 92vw, 640px" />}
    </div>
  );
}

export function Phone({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div className={`phone ${className}`}>
      <Image src={src} alt="" width={390} height={844} sizes="200px" />
    </div>
  );
}
