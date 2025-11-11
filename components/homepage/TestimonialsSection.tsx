import { Badge } from "@/components/ui/badge"
import TestimonialCard from "@/components/homepage/testimonial-card"

const testimonials = [
  {
    quote: "My dog's dancing video went viral on TikTok! The quality is incredible and everyone loves watching my pup do the Macarena.",
    author: "Emma Rodriguez",
    role: "Pet Owner",
    avatarUrl: "/homepage/example0001.png"
  },
  {
    quote: "I've created videos of all my pets dancing and they're absolutely hilarious! The process is so quick and easy - my cats are now internet famous!",
    author: "David Kim",
    role: "Cat Lover",
    avatarUrl: "/homepage/example0002.png"
  },
  {
    quote: "I was skeptical at first, but the results are amazing! My pet's dancing videos bring so much joy to my family and friends. Worth every penny!",
    author: "Jessica Martinez",
    role: "Dog Mom",
    avatarUrl: "/homepage/example0003.png"
  }
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center md:gap-8">
          <Badge variant="outline" className="mb-2">
            Testimonials
          </Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What Our Users Say</h2>
          <p className="max-w-[700px] text-muted-foreground text-lg">
            Thousands of pet owners have created hilarious and adorable dancing videos of their furry friends.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              {...testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  )
}