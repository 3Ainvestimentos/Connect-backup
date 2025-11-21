
export default function ChatbotPage() {
  return (
    <div className="h-full w-full">
      <iframe
        src="https://bob-1-0-vercel.vercel.app/"
        className="w-full h-full border-none"
        title="Assistente Bob 1.0"
        allow="clipboard-write; clipboard-read; microphone"
      ></iframe>
    </div>
  );
}
