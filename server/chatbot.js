// chatbot.js - Backend module for local answers
const neristFAQ = require("./neristData");

function getLocalAnswer(userMessage) {
  const lowerMsg = userMessage.toLowerCase();
  
  for (const faq of neristFAQ) {
    for (const keyword of faq.keywords) {
      if (lowerMsg.includes(keyword.toLowerCase())) {
        return faq.answer;
      }
    }
  }
  
  return null;
}

module.exports = getLocalAnswer;