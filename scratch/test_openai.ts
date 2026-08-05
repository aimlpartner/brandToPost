import dotenv from 'dotenv';
dotenv.config();

async function testExecuteOpenAIImageGeneration() {
  const openaiApiKey = process.env.OPENAI_API_KEY!;
  const prompt = "A clean minimalist executive workspace with modern coffee cup and notebook on a wooden desk, editorial photography";
  
  const modelsToTry = ['gpt-image-2', 'dall-e-3'];
  for (const modelName of modelsToTry) {
    try {
      const payload: any = {
        model: modelName,
        prompt: prompt,
        n: 1,
        size: '1024x1024'
      };
      if (modelName.startsWith('dall-e')) {
        payload.response_format = 'b64_json';
        payload.quality = 'standard';
      }

      console.log(`[testExecute] Trying model ${modelName}...`);
      const genRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`[testExecute] ${modelName} status: ${genRes.status}`);
      if (genRes.ok) {
        const genData = await genRes.json();
        let base64Data: string | null = null;
        if (genData?.data?.[0]?.b64_json) {
          base64Data = genData.data[0].b64_json;
          console.log(`[testExecute] Got b64_json directly! Length: ${base64Data?.length}`);
        } else if (genData?.data?.[0]?.url) {
          const imgFetch = await fetch(genData.data[0].url);
          const buf = await imgFetch.arrayBuffer();
          base64Data = Buffer.from(buf).toString('base64');
          console.log(`[testExecute] Downloaded URL and converted to b64! Length: ${base64Data?.length}`);
        }
        if (base64Data) {
          console.log(`[testExecute] SUCCESS! Generated image successfully with ${modelName}`);
          return;
        }
      } else {
        const errTxt = await genRes.text();
        console.warn(`[testExecute] Model ${modelName} failed HTTP ${genRes.status}:`, errTxt);
      }
    } catch (e: any) {
      console.warn(`[testExecute] Exception for ${modelName}:`, e.message || e);
    }
  }
}

testExecuteOpenAIImageGeneration();
