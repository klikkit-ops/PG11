"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown } from "lucide-react"

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
  index: number
}

function FAQItem({ question, answer, isOpen, onClick, index }: FAQItemProps) {
  return (
    <motion.div
      className="border-b last:border-b-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:text-primary"
      >
        <span>{question}</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-muted-foreground">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "How does pet dancing video generation work?",
      answer:
        "Our AI technology uses advanced image-to-video models to transform your pet's photo into a dancing video. Simply upload a clear photo of your pet, choose a dance style, and our AI creates an amazing 5-10 second video of your pet dancing. The entire process takes 2-5 minutes from upload to delivery.",
    },
    {
      question: "What kind of photos should I upload?",
      answer:
        "For best results, upload a clear, front-facing photo of your pet with good lighting. The photo should have only one pet in the frame, and your pet should be clearly visible. Photos with good contrast and clear features work best for video generation.",
    },
    {
      question: "Can I share these videos on social media?",
      answer:
        "Absolutely! All our plans include usage rights for personal and commercial purposes. You can share your pet's dancing videos on social media, use them in videos, or share them with friends and family. They're perfect for TikTok, Instagram, Facebook, and more!",
    },
    {
      question: "How many dance styles are available?",
      answer:
        "We offer 10+ different dance styles including Macarena, Salsa, Hip Hop, Robot, Ballet, Disco, Breakdance, Waltz, Tango, and Cha Cha. You can choose any style for each video you create. More styles are being added regularly!",
    },
    {
      question: "What if I'm not satisfied with the results?",
      answer:
        "We stand behind our AI technology and want you to be completely satisfied. If you're not happy with your video, contact our support team within 7 days, and we'll work with you to improve the results or provide a refund.",
    },
    {
      question: "How quickly will I receive my video?",
      answer:
        "Video generation typically takes 2-5 minutes. Once your video is ready, you'll receive an email notification and can view it directly in your account. You can also download the video in HD quality to share or save.",
    },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
      {faqs.map((faq, index) => (
        <FAQItem
          key={index}
          question={faq.question}
          answer={faq.answer}
          isOpen={openIndex === index}
          onClick={() => setOpenIndex(openIndex === index ? null : index)}
          index={index}
        />
      ))}
    </div>
  )
}

