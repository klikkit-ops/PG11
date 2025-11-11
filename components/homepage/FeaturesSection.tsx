import { Video, Clock, Share2, Sparkles, Music } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    title: "10+ Dance Styles",
    description: "Choose from Macarena, Salsa, Hip Hop, Ballet, and more fun dance styles",
    icon: <Music className="h-6 w-6" />
  },
  {
    title: "HD Video Quality",
    description: "Get high-quality videos perfect for sharing on social media",
    icon: <Video className="h-6 w-6" />
  },
  {
    title: "Fast Generation",
    description: "Receive your dancing videos in just 2-5 minutes",
    icon: <Clock className="h-6 w-6" />
  },
  {
    title: "Share Anywhere",
    description: "Download and share your videos on TikTok, Instagram, Facebook, and more",
    icon: <Share2 className="h-6 w-6" />
  },
  {
    title: "AI-Powered",
    description: "Advanced AI technology that preserves your pet's identity while adding dance moves",
    icon: <Sparkles className="h-6 w-6" />
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Everything You Need for Amazing Pet Videos
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 rounded-lg bg-background border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}