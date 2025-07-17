import { Features } from "@/app/components/Feature"
import { Footer } from "@/app/components/Footer"

export default function FeaturePage() {
  return (
 <div className="min-h-screen w-full bg-black bg-gradient-to-b from-black via-gray-900 to-black">
<main className="py-10">
  <Features />
  <Footer/>
</main>
</div>
  );
}
