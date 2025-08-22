import OpenAI from 'openai';



async function main() {

  const client = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
  });


  const completion = await client.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-5",
    store: true,
  });

  console.log(completion.choices[0]);
}

main();
