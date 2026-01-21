const { GoogleGenAI } = require("@google/genai");

const apiKey = "AIzaSyCa902Wsn31Bk4zLCUCV1TMFfA-aWBZIFI";
const ai = new GoogleGenAI({ apiKey });

async function main() {
    try {
        console.log("Testing gemini-2.0-flash-exp...");
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: "Hello",
        });
        console.log("Success with 2.0-flash-exp:", response.text);
    } catch (error) {
        console.error("Error with 2.0-flash-exp:", error.message);
        if (error.body) console.log(JSON.stringify(error.body, null, 2));

        try {
            console.log("Testing models/gemini-1.5-flash...");
            const res = await ai.models.generateContent({
                model: "models/gemini-1.5-flash",
                contents: "Hello",
            });
            console.log("Success with prefix:", res.text);
        } catch (e) { console.log("Prefix failed:", e.message); }
    }
}

main();
