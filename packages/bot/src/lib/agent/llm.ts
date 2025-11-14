import { AzureChatOpenAI } from "@langchain/openai"

import dotenv from 'dotenv';
dotenv.config();

export const llm = new AzureChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY ?? "",
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME ?? "",
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME ?? "",
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "",
});



