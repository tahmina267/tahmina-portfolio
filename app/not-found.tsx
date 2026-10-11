import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section nf">
      <div className="wrap nf-grid">
        <Image src="/art/fishbowl.webp" alt="Illustration of a girl inside a fishbowl" width={420} height={420} className="float-slow" />
        <div>
          <p className="eyebrow">404</p>
          <h1 className="display">This page swam <em className="c-ultra">away</em>.</h1>
          <p className="lede">The link might be old. The work is still here, though.</p>
          <Link className="btn btn-dark" href="/#work">Back to the work →</Link>
        </div>
      </div>
    </section>
  );
}
