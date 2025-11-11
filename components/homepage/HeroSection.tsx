import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import TrustBadges from "@/components/homepage/trust-badges"
import ThreeDBeforeAfterGallery from "@/components/homepage/3d-before-after-gallery"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center mb-8">
          <Badge className="mb-4" variant="outline">
            🎉 MAKE YOUR PET DANCE WITH AI
          </Badge>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-6">
            Turn Your Pet Into a <span className="text-primary">Dancing Superstar</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-[800px] mx-auto">
            Create amazing dancing videos of your pet using AI! Choose from 10+ dance styles and watch your pet come to life in seconds.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="group">
                Create Your Pet's Dancing Video
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        {/* <div className="mt-8">
          <TrustBadges />
        </div> */}

        <div className="mt-12">
          <ThreeDBeforeAfterGallery />
        </div>
      </div>
    </section>
  )
}