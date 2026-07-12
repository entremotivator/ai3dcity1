"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { X, ChevronRight, MessageSquare } from "lucide-react"

export interface DialogueOption {
  text: string
  nextId: string
  action?: () => void
}

export interface DialogueNode {
  id: string
  text: string
  options: DialogueOption[]
  npcName: string
  npcColor: string
}

export interface DialogueTreeProps {
  dialogueTree: Record<string, DialogueNode>
  startNodeId: string
  onClose: () => void
  onComplete?: () => void
}

export function DialogueSystem({ dialogueTree, startNodeId, onClose, onComplete }: DialogueTreeProps) {
  const [currentNodeId, setCurrentNodeId] = useState(startNodeId)
  const [dialogueHistory, setDialogueHistory] = useState<DialogueNode[]>([])
  const [typingText, setTypingText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingSpeed] = useState(30) // ms per character

  const currentNode = dialogueTree[currentNodeId]

  useEffect(() => {
    if (!currentNode) return

    // Add current node to history
    if (!dialogueHistory.find((node) => node.id === currentNode.id)) {
      setDialogueHistory((prev) => [...prev, currentNode])
    }

    // Typing effect
    setIsTyping(true)
    setTypingText("")

    let i = 0
    const text = currentNode.text
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setTypingText((prev) => prev + text.charAt(i))
        i++
      } else {
        clearInterval(typingInterval)
        setIsTyping(false)
      }
    }, typingSpeed)

    return () => clearInterval(typingInterval)
  }, [currentNode, dialogueHistory, typingSpeed])

  const handleOptionClick = (option: DialogueOption) => {
    // Execute any action associated with this option
    if (option.action) {
      option.action()
    }

    // If there's no next node, end the dialogue
    if (!dialogueTree[option.nextId]) {
      if (onComplete) {
        onComplete()
      }
      onClose()
      return
    }

    // Move to the next dialogue node
    setCurrentNodeId(option.nextId)
  }

  if (!currentNode) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <CardTitle className="text-xl flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: currentNode.npcColor || "#4285F4" }} />
            <span>{currentNode.npcName}</span>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 max-h-60 overflow-y-auto p-4 bg-gray-50 rounded-md">
            {dialogueHistory.map((node, index) => (
              <div key={`${node.id}-${index}`} className="mb-4 last:mb-0">
                <div className="flex items-start mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white mr-2"
                    style={{ backgroundColor: node.npcColor || "#4285F4" }}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold">{node.npcName}</div>
                    <p className="text-gray-700">{node === currentNode ? typingText : node.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch border-t pt-4">
          <div className="space-y-2 w-full">
            {!isTyping &&
              currentNode.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-between text-left"
                  onClick={() => handleOptionClick(option)}
                >
                  <span>{option.text}</span>
                  <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>
              ))}
            {isTyping && (
              <Button variant="outline" className="w-full justify-between text-left" disabled>
                <span className="animate-pulse">Typing...</span>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

// Example dialogue tree
export const createExampleDialogueTree = (npcName: string, npcColor: string): Record<string, DialogueNode> => {
  return {
    start: {
      id: "start",
      text: `Hello there! I'm ${npcName}. How can I assist you today?`,
      npcName,
      npcColor,
      options: [
        { text: "Tell me about yourself", nextId: "about" },
        { text: "What can you teach me?", nextId: "teach" },
        { text: "I'm just browsing", nextId: "end" },
      ],
    },
    about: {
      id: "about",
      text: `I'm an AI expert specializing in various fields of artificial intelligence. I've been programmed with extensive knowledge to help visitors like you learn more about AI technologies and applications.`,
      npcName,
      npcColor,
      options: [
        { text: "That's interesting!", nextId: "more_about" },
        { text: "Let's talk about something else", nextId: "start" },
      ],
    },
    more_about: {
      id: "more_about",
      text: `Thank you! I'm constantly learning and updating my knowledge base. My purpose is to make complex AI concepts accessible and engaging for everyone, regardless of their technical background.`,
      npcName,
      npcColor,
      options: [
        { text: "What can you teach me?", nextId: "teach" },
        { text: "I'd like to explore on my own now", nextId: "end" },
      ],
    },
    teach: {
      id: "teach",
      text: `I can teach you about various AI topics including machine learning, neural networks, computer vision, natural language processing, and ethical considerations in AI development. What interests you the most?`,
      npcName,
      npcColor,
      options: [
        { text: "Machine Learning", nextId: "ml" },
        { text: "Neural Networks", nextId: "nn" },
        { text: "AI Ethics", nextId: "ethics" },
        { text: "Maybe later", nextId: "end" },
      ],
    },
    ml: {
      id: "ml",
      text: `Machine Learning is a subset of AI that focuses on building systems that learn from data. Instead of explicitly programming rules, ML algorithms identify patterns and make decisions with minimal human intervention. Would you like to know more about specific ML techniques?`,
      npcName,
      npcColor,
      options: [
        { text: "Tell me about another topic", nextId: "teach" },
        { text: "That's enough for now, thanks!", nextId: "end" },
      ],
    },
    nn: {
      id: "nn",
      text: `Neural Networks are computing systems inspired by the human brain. They consist of interconnected nodes or "neurons" that process and transmit information. Deep Learning, which uses neural networks with many layers, has revolutionized fields like image recognition and natural language processing.`,
      npcName,
      npcColor,
      options: [
        { text: "Tell me about another topic", nextId: "teach" },
        { text: "That's enough for now, thanks!", nextId: "end" },
      ],
    },
    ethics: {
      id: "ethics",
      text: `AI Ethics involves ensuring AI systems are developed and used responsibly. Key concerns include privacy, bias, transparency, and accountability. As AI becomes more integrated into society, addressing these ethical considerations becomes increasingly important.`,
      npcName,
      npcColor,
      options: [
        { text: "Tell me about another topic", nextId: "teach" },
        { text: "That's enough for now, thanks!", nextId: "end" },
      ],
    },
    end: {
      id: "end",
      text: `It was great talking with you! Feel free to explore the gallery and come back if you have more questions. Enjoy your visit!`,
      npcName,
      npcColor,
      options: [{ text: "Goodbye", nextId: "close" }],
    },
  }
}
