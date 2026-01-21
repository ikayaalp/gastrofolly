const { GoogleGenerativeAI } = require("@google/generative-ai");
const apiKey = "AIzaSyCa902Wsn31Bk4zLCUCV1TMFfA-aWBZIFI";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function run() {
    try {
        console.log("Testing gemini-1.5-flash with old SDK...");
        const result = await model.generateContent("Hello");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(JSON.stringify(e.response, null, 2));
    }
}
run();
