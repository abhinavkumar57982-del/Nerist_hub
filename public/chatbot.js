// Frontend chatbot.js - For HTML pages
async function sendMessage() {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (!msg) return;

  const messages = document.getElementById("chatbot-messages");

  messages.innerHTML += `<div class="user-message"><b>You:</b> ${msg}</div>`;
  input.value = "";
  
  // Show loading indicator
  messages.innerHTML += `<div class="bot-message loading"><b>Bot:</b> Thinking...</div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();
    
    // Remove loading message
    const loadingMsg = messages.querySelector('.loading');
    if (loadingMsg) {
      loadingMsg.remove();
    }
    
    messages.innerHTML += `<div class="bot-message"><b>Bot:</b> ${data.reply}</div>`;
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    console.error("Chat error:", error);
    
    // Remove loading message
    const loadingMsg = messages.querySelector('.loading');
    if (loadingMsg) {
      loadingMsg.remove();
    }
    
    messages.innerHTML += `<div class="bot-message error"><b>Bot:</b> Sorry, I'm having trouble connecting to the server.</div>`;
    messages.scrollTop = messages.scrollHeight;
  }
}

// Add enter key support
document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById("chat-input");
  if (input) {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
});