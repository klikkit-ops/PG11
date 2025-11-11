import { Badge } from "@/components/ui/badge"
import ModernPricing from "@/components/homepage/modern-pricing"

export default function PricingSection() {
  return (
    <section id="pricing" className="border-t py-20 md:py-32 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center md:gap-8">
          <Badge variant="outline" className="mb-2">
            Pricing
          </Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Affordable plans for <span className="text-primary">unlimited fun</span>
          </h2>
          <p className="max-w-[700px] text-muted-foreground text-lg">
            Create amazing dancing videos of your pet with our simple subscription plans. Choose weekly or annual billing.
          </p>
        </div>
        <div className="mt-16">
          <ModernPricing />
        </div>
      </div>
    </section>
  )
}