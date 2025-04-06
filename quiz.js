// 🔁 替换原 fetchAIExplanation → 支持流式响应
async function fetchAIStream(messages) {
  const response = await fetch("https://hvac-worker.d5p9gttfz8.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });

  if (!response.body) throw new Error("响应失败");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let content = "";
  chatHistoryBox.textContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    content += chunk;
    chatHistoryBox.textContent = content;
  }

  return content;
}

// ✅ 更新按钮事件绑定
followupBtn.onclick = async () => {
  const userInput = followupInput.value.trim();
  if (!userInput) return;

  messages.push({ role: "user", content: userInput });
  followupInput.value = "AI 正在思考中...";
  followupInput.disabled = true;

  const aiReply = await fetchAIStream(messages);
  messages.push({ role: "assistant", content: aiReply });

  followupInput.value = "";
  followupInput.disabled = false;
};
