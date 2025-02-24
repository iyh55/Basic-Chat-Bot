const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const stopResponseButton = document.querySelector("#stop-response"); // Stop button in message bar
const fileInput = document.querySelector("#file-input");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// Fix: Define userData to prevent "ReferenceError"
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

// API setup (Replace API_KEY with a backend call for security)
const API_KEY = "AIzaSyAAGP49bSdkMqDCGvfo2ctE_eRVhU7O5Qw"; // Replace with secure backend call
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Store chat history
const chatHistory = [];
let responseController = null;
let typingInterval = null;

// Toggle chatbot visibility
chatbotToggler.addEventListener("click", () => {
  document.body.classList.toggle("show-chatbot");
});

closeChatbot.addEventListener("click", () => {
  document.body.classList.remove("show-chatbot");
});

// Generate bot response with typing animation
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");
  stopResponseButton.classList.remove("hidden"); // Show Stop button when bot starts typing

  // Add user message to chat history
  chatHistory.push({
    role: "user",
    parts: [{ text: userData.message }],
  });

  // Create a new AbortController each time a request is made
  if (responseController) responseController.abort();
  responseController = new AbortController();
  const { signal } = responseController;

  // API request options
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: chatHistory }),
    signal,
  };

  try {
    // Fetch bot response from API
    const response = await fetch(API_URL, requestOptions);

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No valid response received from API.");
    }

    // Extract bot response text
    const apiResponseText = data.candidates[0]?.content?.parts[0]?.text?.trim();
    if (!apiResponseText) throw new Error("Bot response is empty.");

    // Typing animation - display text word by word
    messageElement.innerHTML = "";
    const words = apiResponseText.split(" ");
    let index = 0;

    typingInterval = setInterval(() => {
      if (index < words.length) {
        messageElement.innerHTML += words[index] + " ";
        index++;
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      } else {
        clearInterval(typingInterval);
        typingInterval = null;
        chatHistory.push({ role: "model", parts: [{ text: apiResponseText }] });
        stopResponseButton.classList.add("hidden"); // Hide Stop button after response
      }
    }, 100);
  } catch (error) {
    clearInterval(typingInterval);
    messageElement.innerText = error.message || "An error occurred.";
    messageElement.style.color = "#ff0000";
    stopResponseButton.classList.add("hidden");
  } finally {
    responseController = null;
  }
};

// Handle stopping bot response when Stop button is clicked
stopResponseButton.addEventListener("click", () => {
  if (responseController) responseController.abort();
  if (typingInterval) clearInterval(typingInterval);
  stopResponseButton.classList.add("hidden"); // Hide Stop button when stopped
});

//  Handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  if (!userData.message) return;

  messageInput.value = "";

  // Create and display user message
  const outgoingMessageDiv = document.createElement("div");
  outgoingMessageDiv.classList.add("message", "user-message");
  outgoingMessageDiv.innerHTML = `<div class="message-text">${userData.message}</div>`;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  // Simulate bot response with thinking indicator
  setTimeout(() => {
    const incomingMessageDiv = document.createElement("div");
    incomingMessageDiv.classList.add("message", "bot-message", "thinking");
    incomingMessageDiv.innerHTML = `<div class="message-text"><div class="thinking-indicator">
            <div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleOutgoingMessage(e);
  }
});

//  Send message when button is clicked
sendMessage.addEventListener("click", (e) => handleOutgoingMessage(e));
const restartChat = document.querySelector("#restart-chat");

// Function to Clear Chat History
const clearChat = () => {
  chatBody.innerHTML = ""; // Remove all chat messages
  chatHistory.length = 0;  // Clear stored chat history
  userData.message = null; // Reset user message data

  // Display welcome message again
  const welcomeMessageDiv = document.createElement("div");
  welcomeMessageDiv.classList.add("message", "bot-message");
  welcomeMessageDiv.innerHTML = `
    <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
      <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9z"/>
    </svg>
    <div class="message-text">Hey there 👋 <br /> How can I help you today?</div>
  `;
  chatBody.appendChild(welcomeMessageDiv);
};

// Event Listener for Restart Chat Button
restartChat.addEventListener("click", clearChat);
stopResponseButton.classList.remove("hidden"); // Show Stop button when bot starts typing
stopResponseButton.classList.add("hidden"); // Hide Stop button after response
