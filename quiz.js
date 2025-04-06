document.addEventListener("DOMContentLoaded", function () {
    const nextButton = document.getElementById("next-btn");
    const backButton = document.getElementById("back-btn");
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options");
    const explanationText = document.getElementById("explanation");
    const aiExplanationBox = document.getElementById("ai-explanation");
    const aiButton = document.getElementById("ai-btn");
    const languageSwitch = document.getElementById("language-switch");
    const progressText = document.getElementById("progress");
    const accuracyText = document.getElementById("accuracy");

    let currentLanguage = localStorage.getItem("language") || "cn";
    let currentQuestionIndex = 0;
    let correctAnswers = 0;

    let questions = JSON.parse(localStorage.getItem("currentQuestions")) || [];
    if (questions.length === 0) {
        alert("⚠️ 题库加载失败，请返回选择章节！");
        window.location.href = "index.html";
        return;
    }

    let mistakes = JSON.parse(localStorage.getItem("mistakes")) || [];
    let completedChapters = JSON.parse(localStorage.getItem("completedChapters")) || [];
    const currentChapter = questions[0].chapter;

    if (completedChapters.includes(currentChapter)) {
        completedChapters = completedChapters.filter(ch => ch !== currentChapter);
        localStorage.setItem("completedChapters", JSON.stringify(completedChapters));
    }

    function updateLanguageButton() {
        languageSwitch.textContent = (currentLanguage === "cn") ? "Switch to English" : "切换至中文";
    }

    languageSwitch.addEventListener("click", function () {
        currentLanguage = (currentLanguage === "cn") ? "en" : "cn";
        localStorage.setItem("language", currentLanguage);
        updateLanguageButton();
        loadQuestion();
    });

    updateLanguageButton();

    function loadQuestion() {
        const question = questions[currentQuestionIndex];
        questionText.textContent = (currentLanguage === "cn") ? question.question_cn : question.question_en;

        optionsContainer.innerHTML = "";
        question.options.forEach((option, index) => {
            const button = document.createElement("button");
            button.classList.add("option-btn");
            button.textContent = (currentLanguage === "cn") ? option.cn : option.en;
            button.addEventListener("click", function () {
                checkAnswer(index, question.correct, question);
            });
            optionsContainer.appendChild(button);
        });

        aiButton.classList.remove("hidden");
        aiExplanationBox.classList.add("hidden");
        aiExplanationBox.textContent = "";

        aiButton.textContent = "AI 智能解析";
        aiButton.disabled = false;

        aiButton.onclick = async () => {
            aiButton.disabled = true;
            aiButton.textContent = "AI 正在分析...";
            aiExplanationBox.textContent = await fetchAIExplanation(question.question_cn || question.question_en);
            aiExplanationBox.classList.remove("hidden");
            aiButton.textContent = "AI 智能解析";
            aiButton.disabled = false;
        };

        explanationText.classList.add("hidden");
        nextButton.classList.add("hidden");
    }

    function checkAnswer(selectedIndex, correctIndex, question) {
        const buttons = document.querySelectorAll(".option-btn");
        buttons.forEach((button, index) => {
            button.disabled = true;
            if (index === correctIndex) button.classList.add("correct");
            if (index === selectedIndex && index !== correctIndex) button.classList.add("wrong");
        });

        if (selectedIndex === correctIndex) {
            correctAnswers++;
            mistakes = mistakes.filter(q => q.question_en !== question.question_en);
        } else {
            if (!mistakes.some(q => q.question_en === question.question_en)) {
                mistakes.push(question);
            }
        }

        localStorage.setItem("mistakes", JSON.stringify(mistakes));

        explanationText.textContent = (currentLanguage === "cn") ? question.explanation_cn : question.explanation_en;
        explanationText.classList.remove("hidden");
        nextButton.classList.remove("hidden");

        progressText.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
        accuracyText.textContent = `${Math.round((correctAnswers / (currentQuestionIndex + 1)) * 100)}%`;
    }

    nextButton.addEventListener("click", function () {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            alert(`🎉 章节完成！正确率: ${Math.round((correctAnswers / questions.length) * 100)}%`);

            if (!completedChapters.includes(currentChapter) && mistakes.length === 0) {
                completedChapters.push(currentChapter);
                localStorage.setItem("completedChapters", JSON.stringify(completedChapters));
            }

            window.location.href = "index.html";
        }
    });

    backButton.addEventListener("click", function () {
        window.location.href = "index.html";
    });

    loadQuestion();

    async function fetchAIExplanation(questionText) {
        try {
            const res = await fetch("https://hvac-worker.d5p9gttfz8.workers.dev", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: questionText })
            });
            const data = await res.json();
            return data.answer || "AI 没有返回内容。";
        } catch (e) {
            console.error("❌ AI 请求失败:", e);
            return "⚠️ 无法获取 AI 解析，请稍后重试。";
        }
    }
});
